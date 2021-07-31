import { Map }                     from "rot-js";
import Bowser                      from "bowser";
import MD5                         from "MD5";
import { QUEEN, DRAGON }           from "@/definitions/character-types";
import { SHOE_FLIPPERS }           from "@/definitions/item-types";
import HashUtil                    from "@/utils/hash-util";
import WorldCache                  from "@/utils/world-cache";
import { generateDragQueenName }   from "@/utils/name-generator";
import { findPath }                from "@/utils/path-finder";
import { random, randomInRange }   from "@/utils/random-util";
import CharacterActions            from "@/model/actions/character-actions";
import BuildingFactory             from "./building-factory";
import CharacterFactory            from "./character-factory";
import EnvironmentFactory          from "./environment-factory";
import ShopFactory, { SHOP_TYPES } from "./shop-factory";
import {
    growTerrain, getSurroundingIndices, getSurroundingTiles, coordinateToIndex,
    distance
} from "@/utils/terrain-util";

export const WORLD_TYPE = "Overground";

/**
 * the tile types for rendering the overground
 */
export const WORLD_TILES = {
    GROUND   : 0,
    GRASS    : 1,
    SAND     : 2,
    ROAD     : 3,
    WATER    : 4, // can traverse water when wearing flippers
    MOUNTAIN : 5,
    TREE     : 6,
    NOTHING  : 7
};

const MAX_WALKABLE_TILE = WORLD_TILES.ROAD;
/**
 * Get the highest index within the tiles list that given character can walk on.
 * Depending on our inventory / other character properties we can navigate over
 * different tiles (e.g. walk on water)
 */
export const getMaxWalkableTile = ( character = null ) => {
    if ( !character ) {
        return MAX_WALKABLE_TILE;
    }
    return character.inventory.items.find(({ name }) => name === SHOE_FLIPPERS ) ? WORLD_TILES.WATER : MAX_WALKABLE_TILE;
};

const WorldFactory =
{
    /**
     * Creates a new, empty World
     */
    create() {
        const size  = 8;
        const world = EnvironmentFactory.create( size / 2, size / 2, size, size );

        world.type      = WORLD_TYPE;
        world.buildings = [];
        world.shops     = [];

        return world;
    },

    /**
     * Populates given World with terrain and environment variables
     * calculated for given hash
     *
     * @param {Object} world
     * @param {string} hash MD5 hash 32 characters in length
     */
    populate( world, hash ) {
        let size = 175; // amount of horizontal and vertical tiles in overworld

        const { parsedResult } = Bowser.getParser( window.navigator.userAgent );

        // on iOS we don't exceed the 6 megapixel (2500 x 2500) limit on images, we COULD investigate
        // in stitching multiple smaller images together, but this might just be a satisfactory world size :p
        // note on iPad OS 13 the platform is reported as macOS 10.15, hence the Safari check...

        if ( parsedResult?.os?.name === "iOS" || parsedResult?.browser?.name === "Safari" ) {
            size = Math.min( 2500 / WorldCache.tileWidth, size );
        }
        world.width  = size;
        world.height = size;

        const centerX = Math.round( world.width  / 2 );
        const centerY = Math.round( world.height / 2 );

        // generate the terrain

        generateTerrain( hash, world );

        // generate cities

        const cities = generateCities( hash, world );

        // generate some buildings outside the cities
/*
        const shopHash   = hash.substr( 8, 10 );
        const types      = Object.values( SHOP_TYPES ); // ensure we crate them for each available type
        let createdShops = 0;

        world.shops.push( ...generateGroup(
            centerX, centerY, world, HashUtil.charsToNum( shopHash ), ( x, y, ) => {
                const shop = ShopFactory.create( x, y, types[ createdShops % types.length ]);
                ++createdShops;
                return shop;
            }, Math.round( world.width / 5 ), 4, .6, [ WORLD_TILES.SAND, WORLD_TILES.GRASS ] // exclude GROUND (city only)
        ));
*/
        // generate some characters that occupy some of the building entrances

        const characterHash      = hash.substr( 8, 8 );
        const amountOfCharacters = Math.round(
            Math.min( world.buildings.length * .75, HashUtil.charsToNum( characterHash ) * random() )
        );

        for ( let i = 0; i < amountOfCharacters; ++i ) {
            const { x, y } = world.buildings[ i ];
            world.characters.push( CharacterFactory.create({ x, y: y + 1, type: QUEEN }, { name: generateDragQueenName() }));
        }

        // center player within world

        world.x = centerX;
        world.y = centerY;

        // ensure player begins on a walkable tile TODO: should we check if there's a walkable path instead?

        while ( world.terrain[ coordinateToIndex( world.x, world.y, world )] > MAX_WALKABLE_TILE ) {
            --world.x;
            --world.y;
        }

        // generate the drunk dragon (will be positioned on overground environment enter by Vuex module)

        const dragon = CharacterFactory.create({
            type: DRAGON,
            x: world.x,
            y: world.y,
            ...CharacterActions.generateOpponentProps( CharacterFactory.create({ type: QUEEN }), DRAGON )
        }, { name: "Drunk Dragon" });
        world.characters.push( dragon );
    },

    /**
     * disassemble the world into a serialized JSON structure
     */
    disassemble( world ) {
        // we only assemble position and terrain (the game hash can
        // regenerate the world properties deterministically)
        const out = EnvironmentFactory.disassemble( world );

        out.s = world.shops.map( s => ShopFactory.disassemble( s ));
        out.b = world.buildings.map( b => BuildingFactory.disassemble( b ));

        return out;
    },

    /**
     * assemble a serialized JSON Object
     * back into world structure
     */
    assemble( data ) {
        const world = EnvironmentFactory.assemble( data );

        // restore shops and buildings
        world.shops      = data.s.map( s => ShopFactory.assemble( s ));
        world.buildings  = data.b.map( b => BuildingFactory.assemble( b ));

        return world;
    }
};
export default WorldFactory;

/* internal methods */

/**
 * generate the terrain for the given world
 * blatantly stolen from code by Igor Kogan (okay, he kindly donated it)
 *
 * @param {string} hash
 * @param {Object} world
 */
function generateTerrain( hash, world ) {
    const MAP_WIDTH = world.width, MAP_HEIGHT = world.height;

    // first create the GROUND

    world.terrain = new Array( MAP_WIDTH * MAP_HEIGHT ).fill( WORLD_TILES.SAND );//GROUND );

    //digRoads( MAP_WIDTH, MAP_HEIGHT );

    let x, y, i, index;

    function genSeed( type, size ) {
        const WS = Math.ceil( MAP_WIDTH * MAP_HEIGHT / 1000 );
        for ( i = 0; i < WS; i++ ) {
            x = Math.floor( random() * MAP_WIDTH );
            y = Math.floor( random() * MAP_HEIGHT );
            index = coordinateToIndex( x, y, world );
            world.terrain[ index ] = type;
        }
        for ( i = 0; i < size; i++ ) {
            growTerrain( world.terrain, MAP_WIDTH, MAP_HEIGHT, type );
        }
    }

    genSeed( WORLD_TILES.WATER,    10 ); // plant water seeds (lake)
    genSeed( WORLD_TILES.GRASS,    6 );  // plant grass seeds (park)
    genSeed( WORLD_TILES.MOUNTAIN, 3 );  // plant rock seeds (mountain)

    // sandify (creates "beaches" around water)

    const beachHash = hash.substr( 8, 1 );
    const beachSize = HashUtil.charsToNum( beachHash );

    for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x )) {
        const index = coordinateToIndex( x, y, world );
        if ( world.terrain[ index ] === WORLD_TILES.GROUND ) {
            const around = getSurroundingIndices( x, y, MAP_WIDTH, MAP_HEIGHT, true, beachSize );
            for ( i = 0; i < around.length; i++ ) {
                if ( world.terrain[ around[ i ]] === WORLD_TILES.WATER && random() > .7 ) {
                    world.terrain[ index ] = WORLD_TILES.SAND;
                    break;
                }
            }
        }
    }

    // plant some trees in the parks

    const TS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.1 );

    for ( i = 0; i < TS; i++ ) {
        x     = Math.floor( random() * MAP_WIDTH );
        y     = Math.floor( random() * MAP_HEIGHT );
        index = coordinateToIndex( x, y, world );

        if ( world.terrain[ index ] === WORLD_TILES.GRASS ) {
            world.terrain[ index ] = WORLD_TILES.TREE;
        }
    }

    // now clean up possible weirdness

    for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x )) {
        if ( x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1 ) {
            continue; // ignore tiles at world edges
        }
        const tileIndex = coordinateToIndex( x, y, world );
        const tile = world.terrain[ tileIndex ];
        const surroundingTiles = getSurroundingTiles( x, y, world );
        // get rid of tiles that are surrounded by completely different tiles
        if ( !Object.values( surroundingTiles ).includes( tile )) {
            if ( tile === WORLD_TILES.GRASS ) {
                // if the tile was grass, just plant a tree, it probably looks cute!
                world.terrain[ tileIndex ] = WORLD_TILES.TREE;
            } else {
                world.terrain[ tileIndex ] = surroundingTiles.left;
            }
        }
    }
}

/**
 * @param {string} hash
 * @param {Object} world
 * @return {Array<Object>} generated cities (bounding boxes)
 */
function generateCities( hash, world ) {
    const { terrain } = world;
    const centerX = Math.round( world.width  / 2 );
    const centerY = Math.round( world.height / 2 );
    const zones   = [];

    const MAX_ZONES = 20;

    const minZoneWidth  = WorldCache.sizeBuilding.width  * 2;
    const minZoneHeight = WorldCache.sizeBuilding.height * 2;
    const maxZoneWidth  = Math.floor( world.width  / 5);
    const maxZoneHeight = Math.floor( world.height / 5 );

    const generateZone = ( zoneCenterX, zoneCenterY, zoneWidth, zoneHeight ) => {
        const x = Math.round( zoneCenterX - ( zoneWidth  / 2 ));
        const y = Math.round( zoneCenterY - ( zoneHeight / 2 ));
        return {
            left    : x,
            top     : y,
            right   : Math.round( zoneCenterX + ( zoneWidth  / 2 )),
            bottom  : Math.round( zoneCenterY + ( zoneHeight / 2 )),
            width   : zoneWidth,
            height  : zoneHeight,
            centerX : Math.round( zoneCenterX ),
            centerY : Math.round( zoneCenterY ),
            x, y
        }
    };

    // first create center zone (player starts here)

    const centerZone = generateZone( centerX, centerY, maxZoneWidth, maxZoneHeight );
    zones.push( centerZone );

    // generate surrounding zones

    for ( let i = 1; i < MAX_ZONES; ++i ) {
        const x      = random() * world.width;
        const y      = random() * world.height;
        const width  = randomInRange( minZoneWidth, maxZoneWidth );
        const height = randomInRange( minZoneHeight, maxZoneHeight );
        const zone   = generateZone( x, y, width, height );
        // slightly bigger to allow space between cities (currently broken??)
        const zoneBounds = generateZone( x, y, width * 2, height * 2 );
        if ( checkIfFree( zoneBounds, world, zones, false )) {
            zones.push( zone );
        }
    }

    // ensure we can reach the second zone from the first

    const secondZone = zones[ 1 ];
    if ( !connectZones( world, centerZone, secondZone, MAX_WALKABLE_TILE )) {
        // could not connect via natural path, force creation of a new path
        connectZones( world, centerZone, secondZone, Infinity );
    }

    // generate all zone contents

    const buildingHash = hash.substr( 6, 8 );
    const shopHash     = hash.substr( 8, 10 );
    const shopTypes    = Object.values( SHOP_TYPES ); // ensure we crate shops for each available type
    let createdShops   = 0;

    zones.forEach(({ left, right, top, bottom, width, height, centerX, centerY }, index ) => {
        // create terrain for all generated zones
        for ( let x = left; x < right; ++x ) {
            for ( let y = top; y < bottom; ++y ) {
                terrain[ coordinateToIndex( x, y, world )] = WORLD_TILES.GROUND;
            }
        }

        // each city should have a building dead in the center

        const building = BuildingFactory.create(
            Math.round( centerX + WorldCache.sizeBuilding.width / 2 ),
            Math.round( centerY + WorldCache.sizeBuilding.height / 2 )
        );
        if ( reserveObject( building, world )) {
            world.buildings.push( building );
        } else {
            console.warn("could not add building to " +index);
        }

        if ( index === 0 ) {
            // in the first city we also create a clothes shop (so flippers can be bought
            // should we need to cross large bodies of water)

            const shop = ShopFactory.create(
                left + randomInRange( 0, width  - WorldCache.sizeShop.width ),
                top  + randomInRange( 0, height - WorldCache.sizeShop.height ),
                SHOP_TYPES.CLOTHES
            );
            if ( reserveObject( shop, world )) {
                world.shops.push( shop );
            }
        }

        // create buildings or shops every other each zone

        if ( index % 2 === 0 ) {
            const amount = randomInRange( 2, Math.ceil( width / WorldCache.sizeBuilding.width ));
console.warn("generate " + amount + " buildings for " + index + " iteration at coords " + centerX + " x " + centerY);
            world.buildings.push(...generateGroup(
                centerX, centerY, world, amount, BuildingFactory.create, width, 4, .33, [ WORLD_TILES.GROUND ]
            ));
        } else {
            const amount = randomInRange( 2, Math.ceil( width / WorldCache.sizeShop.width ));
console.warn("generate " + amount + " shops for " + index + " iteration at coords " + centerX + " x " + centerY);
            world.shops.push(...generateGroup(
                centerX, centerY, world, amount, ( x, y, ) => {
                    const shop = ShopFactory.create( x, y, shopTypes[ createdShops % shopTypes.length ]);
                    ++createdShops;
                    return shop;
                }, width, 4, .6, [ WORLD_TILES.GROUND ]
            ));
        }
    });
    return zones;
}

function connectZones( world, firstZone, secondZone, maxWalkableTile, tileType = WORLD_TILES.SAND ) {
    const toTheRight = secondZone.x > firstZone.x;
    const isBelow    = secondZone.y > firstZone.y;

    const waypoints = findPath(
        world,
        firstZone.x  + Math.round( firstZone.width   / 2 ),
        firstZone.y  + Math.round( firstZone.height  / 2 ),
        secondZone.x + Math.round( secondZone.width  / 2 ),
        secondZone.y + Math.round( secondZone.height / 2 ),
        maxWalkableTile,
    );

    if ( waypoints.length === 0 ) {
        return false; // could not connect zones
    }

    // create path connecting the zones

    const PATH_PADDING = 2; // make path wider
    const { width, height } = world;
    const { terrain } = world;

    waypoints.forEach(({ x, y }) => {
        for ( let xi = Math.max( 0, x - PATH_PADDING ), xt = Math.min( width, x + PATH_PADDING ); xi < xt; ++xi ) {
            for ( let yi = Math.max( 0, y - PATH_PADDING ), yt = Math.min( height, y + PATH_PADDING ); yi < yt; ++yi ) {
                terrain[ coordinateToIndex( xi, yi, world )] = tileType;
            }
        }
    });
    return true;
}

/**
 * generate an Array of numerical values (floating point values between 0 - 1 )
 * from given aHashOffset - aHashEndOffset range inside the hash. The Array will be
 * the length of given aResultLength
 *
 * @param {String} aHash
 * @param {Number} aHashOffset
 * @param {Number} aHashEndOffset
 * @param {Number} aResultLength
 * @return {Array<Number>}
 */
function generateNumArrayFromSeed( aHash, aHashOffset, aHashEndOffset, aResultLength ) {
    const hashLength      = aHash.length;
    const requestedLength = aHashEndOffset - aHashOffset;
    let hashRangeLength = aHashEndOffset - aHashOffset;

    // keep snippet range within bounds

    while (( aHashOffset + hashRangeLength ) >= hashLength )
        --hashRangeLength;

    let hash = aHash.substr( aHashOffset, hashRangeLength );

    // if the hash was truncated to fit, grab a snippet from the start

    if ( hashRangeLength !== requestedLength )
        hash += aHash.substr( 0, requestedLength - hashRangeLength );

    // if the requested output Array length is larger than the hash
    // length, increase the hash by hashing the snippet

    while ( hash.length < aResultLength ) {
        hash += MD5( hash );
    }
    const out = [];

    // generate values

    for ( let i = 0; i < aResultLength; ++i ) {
        const value = 1 / HashUtil.charToNum( hash[ i ]);

        // catch Infinity
        out.push( Math.abs( value ) > 1 ? .95 : value );
    }
    return out;
}

/**
 * Generate a group of Objects of the same type, these will be laid out in a circular pattern
 *
 * @param {number} centerX x-coordinate around which the group radius will be calculated
 * @param {number} centerY y-coordinate around which the group radius will be calculated
 * @param {Object} world
 * @param {number} amountToCreate
 * @param {Function} typeFactoryCreateFn factory function to create a new instance of the type
 * @param {number} circleRadius the radius of the circle
 * @param {number=} amountInCircle the amount of Objects within a single circle radius
 * @param {number=} radiusIncrement the multiplier by which the circle radius increments
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 */
function generateGroup( centerX, centerY, world, amountToCreate, typeFactoryCreateFn,
    circleRadius, amountInCircle = 4, radiusIncrement = .6, optTileWhitelist = null ) {
    const { width, height } = typeFactoryCreateFn(); // tile dimensions implied by factory method
    const out = [];

    const degToRad  = Math.PI / 180;
    const maxDistanceFromEdge = width + height; // in tiles
    let incrementRadians      = ( 360 / amountInCircle ) * degToRad;

    let radians = degToRad;
    let circle  = 0;

    const horEdge = world.width;// */  circleRadius;
    const verEdge = world.height;// */ circleRadius;

    for ( let i = 0; i < amountToCreate; ++i ) {
        let x = centerX + Math.sin( radians ) * circleRadius;
        let y = centerY + Math.cos( radians ) * circleRadius;

        // keep within bounds of map

        if ( x < maxDistanceFromEdge ) {
            x = maxDistanceFromEdge;
        }
        else if ( x > horEdge - maxDistanceFromEdge ) {
            x = horEdge - maxDistanceFromEdge;
            circleRadius *= radiusIncrement;
        }

        if ( y < maxDistanceFromEdge ) {
            y = maxDistanceFromEdge;
        }
        else if ( y > verEdge - maxDistanceFromEdge ) {
            y = verEdge - maxDistanceFromEdge;
            circleRadius *= radiusIncrement;
        }

        radians += incrementRadians;

        // generate instance of item
        const groupItem = typeFactoryCreateFn( Math.round( x ), Math.round( y ));

        // reserve object at position nearest to targetX and targetY
        const reservedPosition = reserveObject( groupItem, world, out, optTileWhitelist );

        if ( reservedPosition !== null ) {
            // Object has been placed, set its final position
            groupItem.x = reservedPosition.x;
            groupItem.y = reservedPosition.y;
            out.push( groupItem );
            ++circle;
        }

        if ( circle === amountInCircle ) {
            circle = 0;
            circleRadius *= 2;
            incrementRadians = ( 270 / amountInCircle ) * degToRad;
            radians = 360 * degToRad * random();
        }
    }
    return out;
}

/**
 * Generate roads
 */
function digRoads( worldWidth, worldHeight ) {
    const minRoadWidth  = Math.min( Math.round( random() ) + 2, worldWidth );
    const minRoadHeight = Math.min( Math.round( random() ) + 2, worldHeight );
    let maxRoadWidth    = Math.min( Math.round( random() ) + 2, worldWidth  );
    let maxRoadHeight   = Math.min( Math.round( random() ) + 2, worldHeight );

    // make sure the maximum dimensions exceed the minimum dimensions !

    maxRoadWidth  = Math.max( minRoadWidth,  maxRoadWidth );
    maxRoadHeight = Math.max( minRoadHeight, maxRoadHeight );

    const digger = new Map.Digger( worldWidth, worldHeight, {
        roomWidth      : [ minRoadWidth,  maxRoadWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoadHeight, maxRoadHeight ], /* room minimum and maximum height */
        corridorLength : [ 5, 20 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of floor area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    });
    const map = [];

    // init output terrain map

    for ( let x = 0; x < worldWidth; ++x ) {
        map[ x ] = new Array( worldHeight ).fill( WORLD_TILES.NOTHING );
    }

    // create map
    digger.create(( x, y, tile ) => {
        switch( tile ) {
            case 1:
                break;
            case 0:
                map[ x + 1 ][ y + 1 ] = WORLD_TILES.ROAD;
                break;
        }
    });
    const xl = map.length;
    const yl = map[ 0 ].length;

    // convert two dimensional array to one dimensional terrain map

    const terrain = [];

    for ( let x = 0; x < xl; ++x ) {
        for ( let y = 0; y < yl; ++y ) {
            terrain[ y * xl + x ] = map[ x ][ y ];
        }
    }
    return terrain;
}

/**
 * Reserves space for a given object at the given coordinate
 *
 * if the requested coordinate isn't free/available, this method
 * will search for the next free position as close as possible to
 * the the requested coordinate
 *
 * @param {Object} object to place
 * @param {Object} world the current world the object should fit in
 * @param {Array<Object>=} others Array of Objects that should be checked against
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @return {Object|null} coordinates at which Object has been reserved
 */
function reserveObject( object, world, others = [], optTileWhitelist ) {
    // assemble the list of Objects we shouldn't collide with
    const compare = [ ...world.shops, ...world.buildings, ...others ];
    let { x, y } = object;

    let tries = 255; // fail-safe, let's not recursive forever
    while ( tries-- > 0 )
    {
        if ( checkIfFree({ ...object, x, y }, world, compare, true, optTileWhitelist )) {

            // bit of a cheat... add a wall around the object entrance (which is always at the
            // horizontal middle of the vertical bottom) so the player can't enter/walk outside of the entrace

            const halfWidth = Math.round( object.width / 2 );
            for ( let xd = x - ( halfWidth - 1 ); xd < x + halfWidth; ++xd ) {
                for ( let yd = y - ( object.height - 1 ); yd <= y; ++yd ) {
                    if ( xd === x && yd === y ) {
                        continue;
                    }
                    world.terrain[ coordinateToIndex( xd, yd, world )] = WORLD_TILES.MOUNTAIN;
                }
            }
            return { x, y };
        }

        // which direction we'll try next

        const left  = x > world.width  / 2;
        const up    = y > world.height / 2;

        if ( left ) {
            --x;
        } else {
            ++x;
        }
        if ( up ) {
            --y;
        } else {
            ++y;
        }

        // keep within world bounds though

        x = Math.max( 0, Math.min( x, world.width ));
        y = Math.max( 0, Math.min( y, world.height ));
    }
    return null; // didn't find a spot... :(
}

/**
 * check whether there is nothing occupying the given
 * bounding box in the world
 *
 * @param {Object} area rectangle to verify if is free
 * @param {Object} world
 * @param {Array<Object>} objects
 * @param {boolean=} assertTiles default to true, ensures the tiles at the coordinate ara available
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @return {boolean} whether the position is free
 */
function checkIfFree( area, world, objects, assertTiles = true, optTileWhitelist = null ) {
    const { width, height } = area;

    // check if the underlying tile types around the object coordinate are valid for placement
    if ( assertTiles ) {
        const whitelist = Array.isArray( optTileWhitelist ) ? optTileWhitelist : [ WORLD_TILES.GROUND, WORLD_TILES.SAND ];
        // ensure we have this amount of tiles around the object entrance (ensures we can walk there)
        const PADDING = 2;
        // uncomment width and height in below loop conditions if the ENTIRE object surface
        // needs to be on top of the whitelisted tiles
        for ( let x = Math.max( 0, area.x - PADDING ), xt = Math.min( world.width, area.x + /*width +*/ PADDING ); x < xt; ++x ) {
            for ( let y = Math.max( 0, area.y - PADDING ), yt = Math.min( world.height, area.y + /*height +*/ PADDING ); y < yt; ++y ) {
                const tile = world.terrain[ coordinateToIndex( x, y, world )];
                if ( !whitelist.includes( tile )) {
                    return false;
                }
            }
        }
    }

    // check if there is no other Object registered at this position
    const { x, y } = area;
    const radius = Math.max( width, height ) / 2;
    for ( let i = 0, l = objects.length; i < l; ++i ) {
        const compare = objects[ i ];
        const compareRadius = Math.max( compare.width, compare.height );
        const dist = distance( x, y, compare.x, compare.y );

        if ( dist < radius + compareRadius ) {
            return false;
        }
    }
    return true;
}
