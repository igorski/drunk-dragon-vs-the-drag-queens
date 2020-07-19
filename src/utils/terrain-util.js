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
            const pi = getSurroundingIndices( x, y, mapWidth, mapHeight, Math.random() > .7 );
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
 * blatantly stolen from code by Igor Kogan
 *
 * @param {number} x coordinate of the start point
 * @param {number} y coordinate of the point point
 * @param {number} mapWidth width of the total terrain map
 * @param {number} mapHeight height of the total terrain map
 * @param {boolean} inclDiagonals whether to include diagonals
 * @return {Array<number>} of possible indices
 */
export const getSurroundingIndices = ( x, y, mapWidth, mapHeight, inclDiagonals ) => {
    const possibleIndices = [];
    let tx, ty, nx, ny;

    for ( tx = 0, ty = 0; ty < 3; tx = ( ++tx === 3 ? ( tx % 3 + ( ++ty & 0 ) ) : tx )) {
        nx = x + tx - 1;
        ny = y + ty - 1;

        if ( nx >= 0 && ny >= 0 && nx < mapWidth && ny < mapHeight ) {
            if ( inclDiagonals ||
               ( !inclDiagonals && ( ( nx == x && ny != y ) || ( ny == y && nx != x ) ) )) {
                possibleIndices.push( ny * mapWidth + nx );
            }
        }
    }
    return possibleIndices;
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
        i = Math.floor( Math.random() * terrain.length );
        while ( i-- ) {
            if ( terrain[ i ] === tileType ) {
                return i;
            }
        }
    }
    throw new Error( `could not find terrain of type "${tileType}"` );
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
