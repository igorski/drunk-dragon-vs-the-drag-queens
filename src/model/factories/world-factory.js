import { Map } from "rot-js";
import Bowser  from "bowser";
import MD5     from "MD5";

import { QUEEN, DRAGON }              from "@/definitions/character-types";
import { SHOE_FLIPPERS }              from "@/definitions/item-types";
import HashUtil                       from "@/utils/hash-util";
import WorldCache                     from "@/utils/world-cache";
import { reserveObject, checkIfFree } from "@/utils/map-util";
import { generateDragQueenName }      from "@/utils/name-generator";
import { findPath }                   from "@/utils/path-finder";
import CharacterActions               from "@/model/actions/character-actions";
import BuildingFactory                from "./building-factory";
import CharacterFactory               from "./character-factory";
import EnvironmentFactory             from "./environment-factory";
import ShopFactory, { SHOP_TYPES }    from "./shop-factory";
import {
    growTerrain, getSurroundingIndices, getSurroundingTiles,
    getRectangleForIndices, coordinateToIndex, indexToCoordinate
} from "@/utils/terrain-util";
import { random, randomBool, randomInRangeInt, randomFromList } from "@/utils/random-util";

const DEBUG = process.env.NODE_ENV === "development";

export const WORLD_TYPE = "Overground";

/**
 * the tile types for rendering the overground
 */
export const WORLD_TILES = {
    GROUND   : 0,
    GRASS    : 1,
    SAND     : 2,
    ROAD     : 3,
    CAVE     : 4,
    WATER    : 5, // can traverse water when wearing flippers
    MOUNTAIN : 6,
    TREE     : 7,
    NOTHING  : 8
};

const MAX_WALKABLE_TILE = WORLD_TILES.CAVE;
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
        const world = EnvironmentFactory.create({ x: size / 2, y: size / 2, width: size, height: size });

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

        // generate some shops outside the cities

        const shopHash   = hash.substr( 8, 1 );
        const types      = [ SHOP_TYPES.DEALER, SHOP_TYPES.PAWN, SHOP_TYPES.FOOD ];

        const minShopAmount = types.length * 6;
        const amountOfShopsToCreate = randomInRangeInt( minShopAmount, minShopAmount + HashUtil.charsToNum( shopHash ));

        if ( DEBUG ) {
            console.warn( amountOfShopsToCreate + " < shops to create outside of cities" );
        }
        generateGroup(
            world.shops, world.width, world.height, centerX, centerY, world, amountOfShopsToCreate, ({ x, y }) => {
                return ShopFactory.create({ x, y, type: types[ world.shops.length % types.length ] });
            }, Math.round( world.width / 5 ),
            [ WORLD_TILES.SAND, WORLD_TILES.GRASS ], // exclude GROUND (e.g. cities)
            8
        );

        // create a single island within a large body of water (holds entrance to secret cave)

        generateSecretIsland( world, 5 );

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
        // drunk dragon will be permanently intoxicated at an advanced level, hence the custom speed

        const dragon = CharacterFactory.create({
            type: DRAGON,
            x: world.x,
            y: world.y,
            ...CharacterActions.generateOpponentProps( CharacterFactory.create({ type: QUEEN }), DRAGON )
        }, { name: "Drunk Dragon" }, { intoxication: 0.75, speed: 1.75 });
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
        const width  = randomInRangeInt( minZoneWidth, maxZoneWidth );
        const height = randomInRangeInt( minZoneHeight, maxZoneHeight );
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

    //const buildingHash = hash.substr( 6, 8 );
    //const shopHash     = hash.substr( 8, 10 );

    const { sizeBuilding, sizeShop } = WorldCache;

    // by putting the clothes type last we guarantee that the player needs to travel to a different city
    const shopTypes = [ SHOP_TYPES.JEWELLER, SHOP_TYPES.LIQUOR, SHOP_TYPES.PHARMACY, SHOP_TYPES.CLOTHES ];

    zones.forEach(({ left, right, top, bottom, width, height, centerX, centerY }, index ) => {
        // create terrain for all generated zones
        for ( let x = left; x < right; ++x ) {
            for ( let y = top; y < bottom; ++y ) {
                terrain[ coordinateToIndex( x, y, world )] = WORLD_TILES.GROUND;
            }
        }

        // 1. create buildings

        let amount = randomInRangeInt( 1, 4 );
        if ( DEBUG ) {
console.warn("generate " + amount + " buildings for city " + (index + 1 )+ " at coords " + centerX + " x " + centerY);
        }
        generateGroup(
            world.buildings, width, height, centerX, centerY, world, amount,
            BuildingFactory.create, sizeBuilding.width, [ WORLD_TILES.GROUND ]
        );

        // 2. create shops

        amount = randomInRangeInt( 2, 3 );
        if ( DEBUG ) {
console.warn("generate " + amount + " shops for city " + (index + 1 ) + " at coords " + centerX + " x " + centerY);
        }
        generateGroup(
            world.shops, width, height, centerX, centerY, world, amount, ({ x, y }) => {
                return ShopFactory.create({ x, y, type: shopTypes[ world.shops.length % shopTypes.length ] });
            }, sizeShop.width, [ WORLD_TILES.GROUND ]
        );
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
 * @param {Array<Object>} out Array the group items should be pushed into
 * @param {number} zoneWidth width of the zone within which the group should be generated
 * @param {number} zoneHeight height of the zone within which the group should be generated
 * @param {number} centerX x-coordinate around which the group radius will be calculated
 * @param {number} centerY y-coordinate around which the group radius will be calculated
 * @param {Object} world
 * @param {number} amountToCreate amount of items to create within this group
 * @param {Function} typeFactoryCreateFn factory function to create a new instance of the type
 * @param {number} circleRadius the radius of the circle (in tiles)
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @param {number=} amountInCircle optional amount of items to arrange within a circle
 */
function generateGroup( out, zoneWidth, zoneHeight, centerX, centerY, world, amountToCreate, typeFactoryCreateFn,
    circleRadius, optTileWhitelist = null, amountInCircle = 4 ) {
    const { width, height } = typeFactoryCreateFn({}); // tile dimensions implied by factory method

    const degToRad          = Math.PI / 180;
    const orgRadius         = circleRadius;
    const orgAmountInCircle = 4;

    const radiusIncrement = .6;
    let incrementRadians  = ( 360 / amountInCircle ) * degToRad;
    let radians           = degToRad;
    let itemsInCircle     = 0;
    let circles           = 1;

    const left   = centerX - ( zoneWidth  / 2 );
    const right  = centerX + ( zoneWidth  / 2 );
    const top    = centerY - ( zoneHeight / 2 );
    const bottom = centerY + ( zoneHeight / 2 );

    while ( amountToCreate > 0 ) {
        let x = centerX + Math.sin( radians ) * circleRadius;
        let y = centerY + Math.cos( radians ) * circleRadius;

        // keep within bounds of map

        if ( x < left || x > right || y < top || y > bottom ) {
            if ( DEBUG ) {
                console.warn( "exceeded zone bounds" );
            }
            return;
        }

        radians += incrementRadians;

        // generate instance of item
        const groupItem = typeFactoryCreateFn({ x: Math.round( x ), y: Math.round( y ) });

        // reserve object at position nearest to targetX and targetY
        const reservedPosition = reserveObject( groupItem, world, out, optTileWhitelist );

        if ( reservedPosition !== null ) {
            // Object has been placed, set its final position
            groupItem.x = reservedPosition.x;
            groupItem.y = reservedPosition.y;
            out.push( groupItem );
            --amountToCreate;
        }

        if ( ++itemsInCircle === amountInCircle ) {
            ++circles;
            itemsInCircle    = 0;
            circleRadius     = orgRadius * circles;
            amountInCircle   = orgAmountInCircle * circles;
            incrementRadians = ( 360 / amountInCircle ) * degToRad;
            radians          = 360 * degToRad * random();
        }
    }
}

/**
 * Creates an island inside a body of water that contains
 * the entrance to the secret cave.
 */
function generateSecretIsland( environment, islandSize ) {
    const { width, height, terrain } = environment;
    const waterSize = islandSize * 2; // ensures island is surrounded by water

    const lakes = [];
    for ( let index = 0, l = terrain.length; index < l; ++index ) {
        if ( terrain[ index ] === WORLD_TILES.WATER ) {
            const { x, y } = indexToCoordinate( index, environment );
            const surroundingTiles = getSurroundingIndices( x, y, width, height, true, 10 );
            if ( surroundingTiles.every( i => terrain[ i ] === WORLD_TILES.WATER )) {
                lakes.push( surroundingTiles );
            }
        }
    }
    const lake = randomFromList( lakes );
    if ( lake ) {
        const lakeBounds = getRectangleForIndices( lake, environment );

        if ( DEBUG ) {
            console.warn( `creating island on one of ${lakes.length} possible bodies of water`, lakeBounds );
        }
        const halfSize   = Math.floor( islandSize / 2 );
        const centerX    = lakeBounds.left + halfSize;
        const centerY    = lakeBounds.top  + halfSize;
        const startX     = centerX - halfSize;
        const startY     = centerY - halfSize;
        const endX       = centerX + halfSize;
        const endY       = centerY + halfSize;

        for ( let x = startX; x < endX; ++x ) {
            for ( let y = startY; y < endY; ++y ) {
                if (( x !== startX && x !== ( endX - 1 ) && y !== startY && y !== ( endY - 1 )) || randomBool() ) {
                    terrain[ coordinateToIndex( x, y, environment )] = WORLD_TILES.SAND;
                }
            }
        }
        // create cave entrance bang in the center
        terrain[ coordinateToIndex( centerX, centerY, environment )] = WORLD_TILES.CAVE;
    } else if ( DEBUG ) {
        throw new Error( "failed to generate lake." );
    }
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
