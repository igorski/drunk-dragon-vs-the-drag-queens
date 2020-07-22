import { Map }            from 'rot-js';
import Bowser             from 'bowser';
import MD5                from 'MD5';
import HashUtil           from '@/utils/hash-util';
import WorldCache         from '@/utils/world-cache';
import BuildingFactory    from './building-factory';
import EnvironmentFactory from './environment-factory';
import ShopFactory        from './shop-factory';
import {
    growTerrain, getSurroundingIndices, getSurroundingTiles, coordinateToIndex
} from '@/utils/terrain-util';

export const WORLD_TYPE = 'Overground';

/**
 * the tile types for rendering the overground
 */
export const WORLD_TILES = {
    GROUND   : 0,
    GRASS    : 1,
    SAND     : 2,
    ROAD     : 3,
    WATER    : 4,
    MOUNTAIN : 5,
    TREE     : 6,
    NOTHING  : 7
};
/**
* Highest index within the tiles list which is associated
* with a tile type that the player can walk on
*/
export const MAX_WALKABLE_TILE = WORLD_TILES.ROAD;

const WorldFactory =
{
    /**
     * Creates a new, empty World
     */
    create() {
        const size  = 8;
        const world = EnvironmentFactory.create( size / 2, size / 2, size, size );

        world.type      = WORLD_TYPE;
        world.level     = 0;
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
     * @param {boolean=} optGenerateTerrain optional, whether to generate
     *        the terrain too, defaults to true
     */
    populate( world, hash, optGenerateTerrain = true ) {
        WorldCache.flush(); // flush all cached coordinates

        // calculate overworld dimensions

        let size = HashUtil.charsToNum( hash );
        const { parsedResult } = Bowser.getParser( window.navigator.userAgent );

        // on iOS we don't exceed the 6 megapixel (2500 x 2500) limit on images, we COULD investigate
        // in stitching multiple smaller images together, but this might just be a satisfactory world size :p

alert(JSON.stringify(parsedResult));
        if ( parsedResult?.os?.name === 'iOS' ) {
            size = Math.min( 2200 / WorldCache.tileWidth, size );
        }
        world.width  =
        world.height = size;

        const centerX = Math.round( world.width  / 2 );
        const centerY = Math.round( world.height / 2 );

        // generate the terrain if it didn't exist yet

        if ( optGenerateTerrain ) {
            generateTerrain( hash, world );
        }

        // generate some shops

        const shopHash      = hash.substr( 4, 2 );
        const amountOfShops = HashUtil.charsToNum( shopHash );

        world.shops = generateGroup(
            centerX, centerY, world, amountOfShops, ShopFactory.create, WorldCache.sizeShop, 8, .6
        );

        // generate some buildings

        const buildingHash      = hash.substr( 6, 8 );
        const amountOfBuildings = HashUtil.charsToNum( buildingHash );

        world.buildings = generateGroup(
            centerX, centerY, world, amountOfBuildings, BuildingFactory.create, WorldCache.sizeBuilding, 8, .33
        );

        // center player within world

        world.x = centerX;
        world.y = centerY;

        // ensure player begins on a walkable tile TODO: should we check if there's a walkable path instead?

        while ( world.terrain[ coordinateToIndex( world.x, world.y, world )] > MAX_WALKABLE_TILE ) {
            --world.x;
            --world.y;
        }
    },

    /**
     * disassemble the world into a serialized JSON structure
     */
    disassemble( world ) {
        // we only assemble position and terrain (the game hash can
        // regenerate the world properties deterministically)
        return {
            x: world.x,
            y: world.y,
            w: world.width,
            h: world.height,
            t: world.terrain.join( '' ) // int values
        };
    },

    /**
     * assemble a serialized JSON Object
     * back into world structure
     */
    assemble( data, hash ) {
        const world = WorldFactory.create();
        const hasTerrain = typeof data.t === 'string';

        // recreate and restore world

        WorldFactory.populate( world, hash, !hasTerrain );

        // restore position

        world.x      = data.x;
        world.y      = data.y;
        world.width  = data.w;
        world.height = data.h;

        // restore World terrain

        if ( hasTerrain ) {
            world.terrain = data.t.split( '' ); // split integer values to Array
            const { terrain } = world;
            let i = terrain.length;
            while ( i-- ) {
                terrain[ i ] = parseInt( terrain[ i ], 10 ); // String to numerical
            }
        }
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

    const map = new Array( MAP_WIDTH * MAP_HEIGHT ).fill( WORLD_TILES.GROUND );

    // create some roads
/*
    try {
        const roadMap = digRoads( MAP_WIDTH, MAP_HEIGHT );
        roadMap.forEach(( tile, index ) => {
            if ( tile !== WORLD_TILES.NOTHING ) {
                map[ index ] = tile;
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
            map[ index ] = type;
        }
        for ( i = 0; i < size; i++ ) {
            growTerrain( map, MAP_WIDTH, MAP_HEIGHT, type );
        }
    }

    genSeed( WORLD_TILES.WATER,    10 ); // plant water seeds (lake)
    genSeed( WORLD_TILES.GRASS,    7 ); // plant grass seeds (park)
    genSeed( WORLD_TILES.MOUNTAIN, 5 ); // plant rock seeds (mountain)

    // sandify (creates "beaches" around water)

    for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x )) {
        const index = coordinateToIndex( x, y, world );
        if ( map[ index ] === WORLD_TILES.GROUND ) {
            const around = getSurroundingIndices( x, y, MAP_WIDTH, MAP_HEIGHT, true );
            for ( i = 0; i < around.length; i++ ) {
                if ( map[ around[ i ]] === WORLD_TILES.WATER && Math.random() > .7 ) {
                    map[ index ] = WORLD_TILES.SAND;
                    break;
                }
            }
        }
    }
    growTerrain( map, MAP_WIDTH, MAP_HEIGHT, WORLD_TILES.SAND, 0.9 );

    // plant some trees in the parks

    const TS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.1 );

    for ( i = 0; i < TS; i++ ) {
        x     = Math.floor( Math.random() * MAP_WIDTH );
        y     = Math.floor( Math.random() * MAP_HEIGHT );
        index = coordinateToIndex( x, y, world );

        if ( map[ index ] === WORLD_TILES.GRASS ) {
            map[ index ] = WORLD_TILES.TREE;
        }
    }

    // now clean up possible weirdness

    for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 )) : x )) {
        if ( x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1 ) {
            continue; // ignore tiles at world edges
        }
        const tileIndex = coordinateToIndex( x, y, world );
        const tile = map[ tileIndex ];
        const surroundingTiles = getSurroundingTiles( x, y, world, map );
        // get rid of tiles that are surrounded by completely different tiles
        if ( !Object.values( surroundingTiles ).includes( tile )) {
            if ( tile === WORLD_TILES.GRASS ) {
                // if the tile was grass, just plant a tree, it probably looks cute!
                map[ tileIndex ] = WORLD_TILES.TREE;
            } else {
                map[ tileIndex ] = surroundingTiles.left;
            }
        }
    }
    world.terrain = map;
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
 * @param {Object} dimensions of a single item (in tiles)
 * @param {number} amountInCircle the amount of Objects within a single circle radius
 */
function generateGroup( startX, startY, world, amountToCreate, typeFactoryCreateFn, { width, height }, amountInCircle = 4, radiusIncrement = .6 ) {
    const halfWidth = Math.floor( width  / 2 );
    const out = [];
    const mpi = Math.PI / 180;
    const maxDistanceFromEdge = width + height; // in tiles
    let incrementRadians      = ( 360 / amountInCircle ) * mpi;

    let radians      = mpi;
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

        const groupItem = typeFactoryCreateFn( targetX, targetY );
        reserveObject( targetX, targetY, groupItem, world );

        // bit of a cheat... add a wall around the object entrance (estimated to
        // be at the horizontal middle of the vertical bottom) so the player can't enter from that side

        for ( let xd = targetX - halfWidth; xd < targetX + halfWidth; ++xd ) {
            for ( let yd = targetY - height; yd < targetY; ++yd ) {
                if ( xd === targetX && yd === targetY ) {
                    continue;
                }
                // TODO: this doesn't seem to do much?
                world.terrain[ coordinateToIndex( xd, yd, world )] = WORLD_TILES.MOUNTAIN;
            }
        }

        out.push( groupItem );

        if ( circle === amountInCircle ) {
            circle           = 0;
            circleRadius    *= 2;
            incrementRadians = ( 270 / amountInCircle ) * mpi;
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
 * and register it in the WorldCache at given id
 *
 * if the requested coordinate isn't free/available, this method
 * will search for the next free position as close as possible to
 * the the requested coordinate
 *
 * @param {number} x preferred x-position of obj
 * @param {number} y preferred y-position of obj
 * @param {*} obj Object with x and y properties so its
 *                position can be updated with the final result
 * @param {Object} world the current world the object should fit in
 */
function reserveObject( x, y, obj, world ) {
    if ( !checkIfFree( x, y, world )) {
        let tries = 255;        // fail-safe, let's not recursive forever
        let found = false;

        // which direction we'll try next

        const left  = x > world.width  / 2;
        const up    = y > world.height / 2;

        while ( !found ) {
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

            if ( checkIfFree( x, y, world )) {
                found = true;
            }

            // fail-safe in case we'll never find a spot... :(

            if ( --tries === 0 ) {
                found = true;
            }
        }
    }
    // reserve the Object inside the WorldCache
    WorldCache.reserve( x, y, obj );

    obj.x = x;
    obj.y = y;
}

/**
 * check whether there is nothing occupying the given
 * coordinate in the world
 *
 * @param {number} x
 * @param {number} y
 * @param {Object} world
 * @return {boolean} whether the position is free
 */
function checkIfFree( x, y, { width, terrain }) {
    // check if the underlying tile type is available for Object placement
    const tile = terrain[ coordinateToIndex( x, y, { width })];

    if ( ![ WORLD_TILES.GROUND ].includes( tile )) {
        return false;
    }

    // check if there is no other Object registered in the WorldCache at this position
    return WorldCache.getObjectAtPosition( x, y ) === null;
}
