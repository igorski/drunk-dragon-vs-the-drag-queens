import { findPath }      from "@/utils/path-finder";
import { random, randomInRangeInt } from "@/utils/random-util";
import ExecuteWithRetry from "@/utils/execute-with-retry";

/**
 * grow the amount of terrain of given type on the given map
 * blatantly stolen from code by Igor Kogan
 *
 * @param {Array<number>} map the terrain map
 * @param {number} mapWidth the width of the map
 * @param {number} mapHeight the height of the map
 * @param {number} type the terrain type to grow
 * @param {number=} threshold optional chance threshold for final terrain size
 */
export const growTerrain = ( map, mapWidth, mapHeight, type, chanceThreshold = 0.7 ) => {
    let x, y, i, index;

    for ( x = 0, y = 0; y < mapHeight; x = ( ++x === mapWidth ? ( x % mapWidth + ( ++y & 0 ) ) : x )) {
        index = coordinateToIndex( x, y, { width: mapWidth });
        if ( map[ index ] === type ) {
            const pi = getSurroundingIndices( x, y, mapWidth, mapHeight, random() > 0.7, 3 );
            for ( i = 0; i < pi.length; i++ ) {
                if ( random() > chanceThreshold ) {
                    map[ pi[ i ] ] = type;
                }
            }
        }
    }
};

/**
 * collect surrounding indices for a given coordinate
 * (blatantly stolen from code by Igor Kogan)
 *
 * @param {number} x coordinate of the start point
 * @param {number} y coordinate of the point point
 * @param {number} mapWidth width of the total terrain map
 * @param {number} mapHeight height of the total terrain map
 * @param {boolean} inclDiagonals whether to include diagonals
 * @param {number=} size of the surrounding area (in tiles)
 * @return {Array<number>} of possible indices
 */
export const getSurroundingIndices = ( x, y, mapWidth, mapHeight, inclDiagonals, size = 1 ) => {
    const possibleIndices = [];
    let tx, ty, nx, ny;

    for ( tx = 0, ty = 0; ty < size; tx = ( ++tx === size ? ( tx % size + ( ++ty & 0 ) ) : tx )) {
        nx = x + tx - 1;
        ny = y + ty - 1;

        if ( nx >= 0 && ny >= 0 && nx < mapWidth && ny < mapHeight ) {
            if ( inclDiagonals ||
               (( nx == x && ny != y ) || ( ny == y && nx != x )) ) {
                possibleIndices.push( ny * mapWidth + nx );
            }
        }
    }
    return possibleIndices;
};

/**
 * Gets the bounding box coordinates described by a list of indices
 *
 * @param {Array<number>} indices
 * @param {Object} environment
 * @return {{ left: number, right: number, top: number, bottom: number }}
 */
export const getRectangleForIndices = ( indices, environment ) => {
    let left   = Infinity;
    let right  = -Infinity;
    let top    = Infinity;
    let bottom = -Infinity;
    indices.forEach( index => {
        const { x, y } = indexToCoordinate( index, environment );
        left   = Math.min( left, x );
        right  = Math.max( right, x );
        top    = Math.min( top, y );
        bottom = Math.max( bottom, y );
    });
    return { left, right, top, bottom };
};

/**
 * returns the first available position in the terrain
 * where the underlying tile is of given tileType and is free
 *
 * @param {Array<number>} terrain
 * @param {number} tileType
 * @return {number} free index in the terrain for given operation
 */
export const positionAtFirstFreeTileType = ( terrain, tileType ) => {
    for ( let i = 0; i < terrain.length; ++i ) {
        if ( terrain[ i ] === tileType ) {
            return i;
        }
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
};

/**
 * returns the first available position in the terrain
 * where the underlying tile is of given tileType and is free
 *
 * @param {Array<number>} terrain
 * @param {number} tileType
 * @return {number} free index in the terrain for given operation
 */
export const positionAtLastFreeTileType = ( terrain, tileType ) => {
    let i = terrain.length;
    while ( i-- ) {
        if ( terrain[ i ] === tileType ) {
            return i;
        }
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
};

/**
 * returns a random position in the terrain
 * where the underlying tile is of given tileType and is free
 *
 * @param {Array<number>} terrain
 * @param {number} tileType
 * @return {number} free index in the terrain for given operation
 */
export const positionAtRandomFreeTileType = ( terrain, tileType ) => {
    let i;
    const success = ExecuteWithRetry(() => {
        i = Math.round( random() * terrain.length );
        while ( i-- ) {
            if ( terrain[ i ] === tileType ) {
                return true;
            }
        }
        return false;
    });
    if ( success ) {
        return i;
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
};

/**
 * Retrieves all eight tiles surrounding the given coordinate
 * TODO: there is no bounds checking here, so coordinate must not be at world edge
 */
export const getSurroundingTiles = ( x, y, environment ) => {
    const { terrain } = environment;
    const out = getSurroundingIndicesForPoint( x, y, environment );
    Object.entries( out ).forEach(([ key, value ]) => {
        out[ key ] = terrain[ value ];
    });
    return out;
};

/**
 * Asserts whether the tiles surrounding given coordinate for given environment
 * are all of the given tileType
 */
export const assertSurroundingTilesOfTypeAroundPoint = ( x, y, environment, tileType ) => {
    const { terrain } = environment;
    const surrounding = Object.values( getSurroundingIndicesForPoint( x, y, environment ));
    return !surrounding.some( tile => terrain[ tile ] !== tileType );
};

/**
 * Retrieves indices of all eight points surrounding the given coordinate
 * TODO: there is no bounds checking here, so coordinate must not be at world edge
 */
export const getSurroundingIndicesForPoint = ( x, y, environment ) => ({
    above      : coordinateToIndex( x, y - 1, environment ),
    aboveLeft  : coordinateToIndex( x - 1, y - 1, environment ),
    aboveRight : coordinateToIndex( x + 1, y - 1, environment ),
    left       : coordinateToIndex( x - 1, y, environment ),
    right      : coordinateToIndex( x + 1, y, environment ),
    below      : coordinateToIndex( x, y + 1, environment ),
    belowLeft  : coordinateToIndex( x - 1, y + 1, environment ),
    belowRight : coordinateToIndex( x + 1, y + 1, environment )
});

export const getFirstFreeTileOfTypeAroundPoint = ( x, y, environment, tileType ) => {
    const { terrain } = environment;
    const surroundingTiles = Object.values( getSurroundingIndicesForPoint( x, y, environment ));
    for ( let i = 0; i < surroundingTiles.length; ++i ) {
        const index = surroundingTiles[ i ];
        if ( terrain[ index ] === tileType ) {
            return indexToCoordinate( index, environment );
        }
    }
    return null;
};

export const getRandomFreeTilePosition = ( environment, tileType = 0 ) => {
    try {
        const index = positionAtRandomFreeTileType( environment.terrain, tileType );
        return indexToCoordinate( index, environment );
    } catch {
        return null;
    }
};

/**
 * Translates an x/y coordinate to the corresponding index in an environments terrain list
 *
 * @param {number} x
 * @param {number} y
 * @param {Object} environment
 */
export const coordinateToIndex = ( x, y, { width }) => x + ( width * y );

/**
 * Translates an index from an environments terrain list to
 * the corresponding x/y coordinate
 *
 * @param {number} x
 * @param {number} y
 * @param {Object} environment
 */
export const indexToCoordinate = ( index, { width, height }) => ({
    x: index % width,
    y: Math.round( index / width )
});

/**
 * Calculate the distance between the two provided points
 */
export const distance = ( x1, y1, x2, y2 ) => Math.sqrt( Math.pow(( x1 - x2 ), 2) + Math.pow(( y1 - y2 ), 2 ));

/**
 * Request to position an object within given minDistance from given coordinate (within a
 * circular radius). This position is subsequently tested to verify whether a valid path can be
 * traversed from the start to calculated target coordinates. This keeps retrying until a navigateable
 * path is found, otherwise null is returned.
 *
 * @return {Object|null}
 */
export const positionInReachableDistanceFromPoint = ( env, startX, startY, minDistance, maxWalkableTile ) => {
    const width = minDistance;
    const height = minDistance;
    const halfWidth = Math.round( width  / 2 );
    const degToRad = Math.PI / 180;
    let incrementRadians = (( 360 / 8 /* points around player center */ ) * degToRad );
    let distance = minDistance;
    let radians  = degToRad + ( incrementRadians * randomInRangeInt( 0, 5 ));

    let tries = 64;  // fail-safe, let's not recursive forever
    while ( tries-- ) {
        const circleRadius = Math.round( distance );

        const targetX = Math.round( startX + Math.sin( radians ) * circleRadius );
        const targetY = Math.round( startY + Math.cos( radians ) * circleRadius );

        if (( targetX < 0 || targetX > env.width ) || ( targetY < 0 || targetY > env.height )) {
            // out of bounds, shrink circle again
            radians   = degToRad;
            distance  = minDistance;
            // TODO: starting from center, should this be an argument ?
            startX = env.width / 2;
            startY = env.height / 2;
        } else if ( checkIfCanReach( env, startX, startY, targetX, targetY, maxWalkableTile )) {
            return { x: targetX, y: targetY };
        }
        radians  += incrementRadians;
        distance *= 1.2;
    }
    return null;
}

 /**
  * Verify whether given coordinates can be connected via a path of waypoints
  */
export const checkIfCanReach = ( env, startX, startY, targetX, targetY, maxWalkableTile ) => findPath( env, startX, startY, targetX, targetY, maxWalkableTile )?.length > 0;
