import MD5                from 'MD5';
import HashUtil           from '@/utils/hash-util';
import TerrainUtil        from '@/utils/terrain-util';
import WorldCache         from '@/utils/world-cache';
import CaveFactory        from './cave-factory';
import EnvironmentFactory from './environment-factory';
import ShopFactory        from './shop-factory';

export const WORLD_TYPE = 'Overground';

/**
 * the tile types for rendering the overground
 */
export const WORLD_TILES = {
    GRASS    : 0,
    SAND     : 1,
    WATER    : 2,
    MOUNTAIN : 3,
    TREE     : 4
};

export default
{
    /**
     * Creates a new, empty World
     */
    createWorld() {
        const size  = 8;
        const world = EnvironmentFactory.createEnvironment( size / 2, size / 2, size, size );

        world.type  = WORLD_TYPE;
        world.level = 0;
        world.caves = [];
        world.shops = [];

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
    populate( world, hash, optGenerateTerrain = true )
    {
        let i, x, y;

        WorldCache.flush(); // flush all cached coordinates

        // calculate overworld dimensions

        world.width  =
        world.height = HashUtil.charsToNum( hash );

        // center player within world (overridden by restored save game)

        world.x = Math.round( world.width  / 2 );
        world.y = Math.round( world.height / 2 );

        // generate the terrain if it didn't exist yet

        if ( optGenerateTerrain )
            generateTerrain( hash, world );

        // generate some shops

        var shops         = hash.substr( 4, 2 ), shop;
        var amountOfShops = HashUtil.charsToNum( shops );

        world.shops = [];

        var mpi = Math.PI / 180;
        var shopsInCircle = 4, circleRadius = 10;
        var incrementRadians = ( 360 / shopsInCircle ) * mpi;
        var circle = 0, radians = mpi;
        var maxDistanceFromEdge = 10;
        var targetX, targetY;

        for ( i = 0; i < amountOfShops; ++i, ++circle )
        {
            x = world.x + Math.sin( radians ) * circleRadius;
            y = world.y + Math.cos( radians ) * circleRadius;

            // keep within bounds of map

            if ( x < maxDistanceFromEdge ) {
                x = maxDistanceFromEdge;
            }
            else if ( x > world.width - maxDistanceFromEdge ) {
                x = world.width - maxDistanceFromEdge;
                circleRadius *= .6;
            }

            if ( y < maxDistanceFromEdge ) {
                y = maxDistanceFromEdge;
            }
            else if ( y > world.height - maxDistanceFromEdge ) {
                y = world.height - maxDistanceFromEdge;
                circleRadius *= .6;
            }

            radians += incrementRadians;

            targetX = Math.round( x );
            targetY = Math.round( y );

            shop = ShopFactory.generateShop( targetX, targetY );
            reserveObject( targetX, targetY, shop, world );

            world.shops.push( shop );

            if ( circle === shopsInCircle ) {
                circle = 0;
                circleRadius *= 2.5;
                incrementRadians = ( 270 / shopsInCircle ) * mpi;
            }
        }

        // generate some caves

        var caves         = hash.substr( 6, 8 ), cave;
        var amountOfCaves = HashUtil.charsToNum( caves );

        var cavesInCircle = 2;
        circleRadius = 20;
        incrementRadians = ( 360 / cavesInCircle ) * mpi;
        circle = 0;
        radians = mpi;

        world.caves = [];

        for ( i = 0; i < amountOfCaves; ++i, ++circle )
        {
            x = world.x + Math.sin( radians ) * circleRadius;
            y = world.y + Math.cos( radians ) * circleRadius;

            // keep within bounds of map

            if ( x < maxDistanceFromEdge ) {
                x = maxDistanceFromEdge;
            }
            else if ( x > world.width - maxDistanceFromEdge ) {
                x = world.width - maxDistanceFromEdge;
                circleRadius *= .33;
            }

            if ( y < maxDistanceFromEdge ) {
                y = maxDistanceFromEdge;
            }
            else if ( y > world.height - maxDistanceFromEdge ) {
                y = world.height - maxDistanceFromEdge;
                circleRadius *= .33;
            }

            radians += incrementRadians;

            targetX = Math.round( x );
            targetY = Math.round( y );

            cave = CaveFactory.createCave( targetX, targetY );

            reserveObject( targetX, targetY, cave, world );
            world.caves.push( cave );

            if ( circle === cavesInCircle ) {
                circle = 0;
                circleRadius *= 1.5;
                incrementRadians = ( 90 / cavesInCircle ) * mpi;
            }
        }
    }
};

// convenience methods for world generation

/**
 * reserve a given object obj at the given coordinate (x, y)
 * and registers it in the WorldCache at given id
 *
 * if the requested coordinate isn't free/available, this method
 * will search for the next free position as close as possible to
 * the the requested coordinate
 *
 * @param {number} x preferred x-position of obj
 * @param {number} y preferred y-position of obj
 * @param {*} obj Object with x and y properties so its
 *                position can be updated with the final result
 * @param {World} world the current world the object should fit in
 */
function reserveObject( x, y, obj, world )
{
    if ( !checkIfFree( x, y ))
    {
        let tries = 255;        // fail-safe, let's not recursive forever
        let found = false;

        // which direction we'll try next

        const left  = x > world.width  / 2;
        const up    = y > world.height / 2;

        while ( !found )
        {
            if ( left )
                --x;
            else
                ++x;

            if ( up )
                --y;
            else
                ++y;

            // keep within world bounds

            x = Math.max( 0, Math.min( x, world.width ));
            y = Math.max( 0, Math.min( y, world.height ));

            if ( checkIfFree( x, y ))
                found = true;

            // fail-safe in case we'll never find a spot... :(

            if ( --tries === 0 )
                found = true;
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
 *
 * @return {boolean} whether the position is free
 */
function checkIfFree( x, y ) {
    return WorldCache.getObjectAtPosition( x, y ) === null;
}

/**
 * generate the terrain for the given World aWorld
 * blatantly stolen from code by Igor Kogan
 *
 * @param {string} aHash
 * @param {World} aWorld
 */
function generateTerrain( aHash, aWorld ) {
    const map       = []; // will hold the terrain
    const MAP_WIDTH = aWorld.width, MAP_HEIGHT = aWorld.height;

    function genTerrain()
    {
        let x, y, i, index;
        for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 ) ) : x ) )
        {
            map.push( WORLD_TILES.GRASS );
        }

        // Plant water seeds

        const WS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.001 );

        for ( i = 0; i < WS; i++ ) {
            x = Math.floor( Math.random() * MAP_WIDTH );
            y = Math.floor( Math.random() * MAP_HEIGHT );
            index = y * MAP_WIDTH + x;
            map[ index ] = WORLD_TILES.WATER;
        }
        for ( i = 0; i < 4; i++ ) {
            TerrainUtil.growTerr( map, MAP_WIDTH, MAP_HEIGHT, WORLD_TILES.WATER );
        }

        // Plant mountain seeds

        const MS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.001 );

        for ( i = 0; i < MS; i++ ) {
            x = Math.floor( Math.random() * MAP_WIDTH );
            y = Math.floor( Math.random() * MAP_HEIGHT );
            index = y * MAP_WIDTH + x;
            map[ index ] = WORLD_TILES.MOUNTAIN;
        }
        for ( i = 0; i < 3; i++ ) {
            TerrainUtil.growTerr( map, MAP_WIDTH, MAP_HEIGHT, WORLD_TILES.MOUNTAIN );
        }

        // sandify (creates "beaches" around water)

        for ( x = 0, y = 0; y < MAP_HEIGHT; x = ( ++x === MAP_WIDTH ? ( x % MAP_WIDTH + ( ++y & 0 ) ) : x ) )
        {
            index = y * MAP_WIDTH + x;

            if ( map[ index ] === WORLD_TILES.GRASS ) {
                const around = TerrainUtil.getSurroundingIndicesFor( x, y, MAP_WIDTH, MAP_HEIGHT, true );
                for ( i = 0; i < around.length; i++ ) {
                    if ( map[ around[ i ]] === WORLD_TILES.WATER && Math.random() > .7 ) {
                        map[ index ] = WORLD_TILES.SAND;
                        break;
                    }
                }
            }
        }
        TerrainUtil.growTerr( map, MAP_WIDTH, MAP_HEIGHT, WORLD_TILES.SAND, 0.9 );

        // Plant some trees

        const TS = Math.ceil( MAP_WIDTH * MAP_HEIGHT * 0.1 );

        for ( i = 0; i < TS; i++ )
        {
            x     = Math.floor( Math.random() * MAP_WIDTH );
            y     = Math.floor( Math.random() * MAP_HEIGHT );
            index = y * MAP_WIDTH + x;

            if ( map[ index ] === WORLD_TILES.GRASS ) {
                map[ index ] = WORLD_TILES.TREE;
            }
        }
    }

    genTerrain();   // get crunching !

    aWorld.terrain = map;
}

/**
 * generate an Array of numerical values (floating point values between 0 - 1 )
 * from given aHashOffset - aHashEndOffset range inside the hash. The Array will be
 * the length of given aResultLength
 *
 * @param {string} aHash
 * @param {number} aHashOffset
 * @param {number} aHashEndOffset
 * @param {number} aResultLength
 *
 * @return {Array.<number>}
 */
function generateNumArrayFromSeed( aHash, aHashOffset, aHashEndOffset, aResultLength )
{
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

    while ( hash.length < aResultLength )
        hash += MD5( hash );

    const out = [];

    // generate values

    for ( let i = 0; i < aResultLength; ++i ) {
        const value = 1 / HashUtil.charToNum( hash[ i ]);

        // catch Infinity
        out.push( Math.abs( value ) > 1 ? .95 : value );
    }
    return out;
}
