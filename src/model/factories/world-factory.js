import { Map }                     from "rot-js";
import Bowser                      from "bowser";
import MD5                         from "MD5";
import { QUEEN, DRAB, DRAGON }     from "@/definitions/character-types";
import { SHOE_FLIPPERS }           from "@/definitions/item-types";
import HashUtil                    from "@/utils/hash-util";
import WorldCache                  from "@/utils/world-cache";
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

        // generate some buildings and shops

        const buildingHash   = hash.substr( 6, 8 );
        const amountToCreate = HashUtil.charsToNum( buildingHash );

        // ensure we create them for each available type

        const types         = Object.values( SHOP_TYPES );
        let createdShops    = 0;

        world.shops = generateGroup(
            centerX, centerY, world, amountToCreate, ( x, y, ) => {
                const shop = ShopFactory.create( x, y, types[ createdShops % types.length ]);
                ++createdShops;
                return shop;
            }, 4, .6
        );

        world.buildings = generateGroup(
            centerX, centerY, world, amountToCreate, BuildingFactory.create, 4, .33
        );

        // generate some characters that occupy some of the building entrances

        const characterHash      = hash.substr( 8, 8 );
        const amountOfCharacters = Math.round(
            Math.min( world.buildings.length * .75, HashUtil.charsToNum( characterHash ) * Math.random() )
        );

        for ( let i = 0; i < amountOfCharacters; ++i ) {
            const { x, y } = world.buildings[ i ];
            world.characters.push( CharacterFactory.create({ x, y: y + 1, type: QUEEN }));
        }

        // center player within world

        world.x = centerX;
        world.y = centerY;

        // ensure player begins on a walkable tile TODO: should we check if there's a walkable path instead?

        while ( world.terrain[ coordinateToIndex( world.x, world.y, world )] > MAX_WALKABLE_TILE ) {
            --world.x;
            --world.y;
        }

        // generate some drabs
        generateGroup(
            centerX, centerY, world, 15, () => {
                const drab = CharacterFactory.create({
                    type: DRAB,
                    hp: 3,
                    level: 1
                });
                world.characters.push( drab );
                return drab;
            }, 8, .33
        );

        // generate the drunk dragon (will be positioned on overground environment enter by Vuex module)

        const dragon = CharacterFactory.create({
            type: DRAGON,
            x: world.x,
            y: world.y,
            hp: 5,
            level: 1,
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
 * blatantly stolen from code by Igor Kogan
 *
 * @param {string} hash
 * @param {Object} world
 */
function generateTerrain( hash, world ) {
    const MAP_WIDTH = world.width, MAP_HEIGHT = world.height;

    // first create the GROUND

    world.terrain = new Array( MAP_WIDTH * MAP_HEIGHT ).fill( WORLD_TILES.GROUND );

    // create some roads
/*
    try {
        const roadMap = digRoads( MAP_WIDTH, MAP_HEIGHT );
        roadMap.forEach(( tile, index ) => {
            if ( tile !== WORLD_TILES.NOTHING ) {
                world.terrain[ index ] = tile;
            }
        });
    } catch {
        // never mind...
    }
*/
    let x, y, i, index;

    function genSeed( type, size ) {
        const WS = Math.ceil( MAP_WIDTH * MAP_HEIGHT / 1000 );
        for ( i = 0; i < WS; i++ ) {
            x = Math.floor( Math.random() * MAP_WIDTH );
            y = Math.floor( Math.random() * MAP_HEIGHT );
            index = coordinateToIndex( x, y, world );
            world.terrain[ index ] = type;
        }
        for ( i = 0; i < size; i++ ) {
            growTerrain( world.terrain, MAP_WIDTH, MAP_HEIGHT, type );
        }
    }

    genSeed( WORLD_TILES.WATER,    8 ); // plant water seeds (lake)
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
                if ( world.terrain[ around[ i ]] === WORLD_TILES.WATER && Math.random() > .7 ) {
                    world.terrain[ index ] = WORLD_TILES.SAND;
                    break;
                }
            }
        }
    }
    growTerrain( world.terrain, MAP_WIDTH, MAP_HEIGHT, WORLD_TILES.SAND, 0.9 );

    // plant some trees in the parks

    const TS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.1 );

    for ( i = 0; i < TS; i++ ) {
        x     = Math.floor( Math.random() * MAP_WIDTH );
        y     = Math.floor( Math.random() * MAP_HEIGHT );
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
 * @param {number} startX x-coordinate around which the group radius will be calculated
 * @param {number} startY y-coordinate around which the group radius will be calculated
 * @param {Object} world
 * @param {number} amountToCreate
 * @param {Function} typeFactoryCreateFn factory function to create a new instance of the type
 * @param {number} amountInCircle the amount of Objects within a single circle radius
 */
function generateGroup( startX, startY, world, amountToCreate, typeFactoryCreateFn, amountInCircle = 4, radiusIncrement = .6 ) {
    const { width, height } = typeFactoryCreateFn(); // tile dimensions implied by factory method
    const halfWidth = Math.round( width  / 2 );
    const out = [];
    const degToRad = Math.PI / 180;
    const maxDistanceFromEdge = width + height; // in tiles
    let incrementRadians      = ( 360 / amountInCircle ) * degToRad;

    let radians      = degToRad;
    let circleRadius = Math.round( world.width / 5 );
    let circle       = 0;
    let x, y;

    for ( let i = 0; i < amountToCreate; ++i, ++circle ) {
        x = startX + Math.sin( radians ) * circleRadius;
        y = startY + Math.cos( radians ) * circleRadius;

        // keep within bounds of map

        if ( x < maxDistanceFromEdge ) {
            x = maxDistanceFromEdge;
        }
        else if ( x > world.width - maxDistanceFromEdge ) {
            x = world.width - maxDistanceFromEdge;
            circleRadius *= radiusIncrement;
        }

        if ( y < maxDistanceFromEdge ) {
            y = maxDistanceFromEdge;
        }
        else if ( y > world.height - maxDistanceFromEdge ) {
            y = world.height - maxDistanceFromEdge;
            circleRadius *= radiusIncrement;
        }

        radians += incrementRadians;

        const targetX = Math.round( x );
        const targetY = Math.round( y );

        // generate instance of item
        const groupItem = typeFactoryCreateFn( targetX, targetY );

        // reserve object at position nearest to targetX and targetY
        // note we increase the height by one tile to ensure we have a walkway towards the object
        const reservedPosition = reserveObject({ ...groupItem, height: groupItem.height + 1 }, world, out );

        if ( reservedPosition !== null ) {
            // Object has been placed, set its final position
            groupItem.x = reservedPosition.x;
            groupItem.y = reservedPosition.y;

            // bit of a cheat... add a wall around the object entrance (should be at the
            // horizontal middle of the vertical bottom) so the player can't enter from that side

            for ( let xd = groupItem.x - ( halfWidth - 1 ); xd < groupItem.x + halfWidth; ++xd ) {
                for ( let yd = groupItem.y - ( height - 1 ); yd <= groupItem.y; ++yd ) {
                    if ( xd === groupItem.x && yd === groupItem.y ) {
                        continue;
                    }
                    world.terrain[ coordinateToIndex( xd, yd, world )] = WORLD_TILES.MOUNTAIN;
                }
            }
            out.push( groupItem );
        }

        if ( circle === amountInCircle ) {
            circle           = 0;
            circleRadius    *= 2;
            incrementRadians = ( 270 / amountInCircle ) * degToRad;
            radians = 360 * degToRad * Math.random();
        }
    }
    return out;
}


/**
 * Generate roads
 */
function digRoads( worldWidth, worldHeight ) {
    const minRoadWidth  = Math.min( Math.round( Math.random() ) + 2, worldWidth );
    const minRoadHeight = Math.min( Math.round( Math.random() ) + 2, worldHeight );
    let maxRoadWidth    = Math.min( Math.round( Math.random() ) + 2, worldWidth  );
    let maxRoadHeight   = Math.min( Math.round( Math.random() ) + 2, worldHeight );

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
 * reserve a given object at the given coordinate
 *
 * if the requested coordinate isn't free/available, this method
 * will search for the next free position as close as possible to
 * the the requested coordinate
 *
 * @param {Object} object to place
 * @param {Object} world the current world the object should fit in
 * @param {Array<Object>=} others Array of Objects that should be checked against
 * @return {Object|null} coordinates at which Object has been reserved
 */
function reserveObject( object, world, others = [] ) {
    // assemble the list of Objects we shouldn't collide with
    const compare = [ ...world.shops, ...world.buildings, ...others ];

    let { x, y } = object;
    if ( !checkIfFree( object, world, compare )) {

        // which direction we'll try next

        const left  = x > world.width  / 2;
        const up    = y > world.height / 2;

        let tries = 255; // fail-safe, let's not recursive forever
        while ( true ) {
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
            // keep within world bounds

            x = Math.max( 0, Math.min( x, world.width ));
            y = Math.max( 0, Math.min( y, world.height ));

            if ( checkIfFree({ ...object, x, y }, world, compare )) {
                break;
            }

            // didn't find a spot... :(

            if ( --tries === 0 ) {
                return null;
            }
        }
    }
    return { x, y };
}

/**
 * check whether there is nothing occupying the given
 * coordinate in the world
 *
 * @param {number} area rectangle to verify if is free
 * @param {Object} world
 * @param {Array<Object>} objects
 * @return {boolean} whether the position is free
 */
function checkIfFree({ x, y, width, height }, world, objects ) {
    // check if the underlying tile type is available for Object placement
    const tile = world.terrain[ coordinateToIndex( x, y, world )];

    if ( ![ WORLD_TILES.GROUND, WORLD_TILES.SAND ].includes( tile )) {
        return false;
    }

    // check if there is no other Object registered at this position

    const radius = Math.round( Math.max( width, height ) / 2 );
    for ( let i = 0, l = objects.length; i < l; ++i ) {
        const { x: cx, y: cy, width: cwidth, height: cheight } = objects[ i ];
        const cRadius = Math.round( Math.max( cwidth, cheight ));
        const dist = distance( x, y, cx, cy );
        if ( dist < radius + cRadius ) {
            return false;
        }
    }
    return true;
}
