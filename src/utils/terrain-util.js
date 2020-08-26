/**
 * grow the amount of terrain of given type on the given map
 * blatantly stolen from code by Igor Kogan
 *
 * @param {Array<number>} map the terrain map
 * @param {number} mapWidth the width of the map
 * @param {number} mapHeight the height of the map
 * @param {number} type the terrain type to grow
 * @param {number=} optChanceThreshhold optional chance threshold for final terrain size
 */
export const growTerrain = ( map, mapWidth, mapHeight, type, optChanceThreshhold ) => {
    const threshold = optChanceThreshhold ? optChanceThreshhold : 0.7;
    let x, y, i, index;

    for ( x = 0, y = 0; y < mapHeight; x = ( ++x === mapWidth ? ( x % mapWidth + ( ++y & 0 ) ) : x )) {
        index = coordinateToIndex( x, y, { width: mapWidth });
        if ( map[ index ] === type ) {
            const pi = getSurroundingIndices( x, y, mapWidth, mapHeight, Math.random() > .7, 3 );
            for ( i = 0; i < pi.length; i++ ) {
                if ( Math.random() > threshold ) {
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
    let tries = 255, i;

    while ( tries-- ) {
        i = Math.round( Math.random() * terrain.length );
        while ( i-- ) {
            if ( terrain[ i ] === tileType ) {
                return i;
            }
        }
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
