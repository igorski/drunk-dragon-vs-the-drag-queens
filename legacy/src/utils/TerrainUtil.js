var TerrainUtil = module.exports =
{
    /**
     * grow the amount of terrain of given type on the given map
     * blatantly stolen from code by Igor Kogan
     *
     * @public
     *
     * @param {Array.<number>} map the terrain map
     * @param {number} mapWidth the width of the map
     * @param {number} mapHeight the height of the map
     * @param {number} type the terrain type to grow
     * @param {number=} optChanceThreshhold optional chance threshold for final terrain size
     */
    growTerr : function( map, mapWidth, mapHeight, type, optChanceThreshhold )
    {
        var threshold = optChanceThreshhold ? optChanceThreshhold : 0.7;
        var x, y, i, index;

        for ( x = 0, y = 0; y < mapHeight; x = ( ++x === mapWidth ? ( x % mapWidth + ( ++y & 0 ) ) : x ) )
        {
            index = y * mapWidth + x;

            if ( map[ index ] === type )
            {
                var pi = TerrainUtil.getSurroundingIndicesFor( x, y, mapWidth, mapHeight, Math.random() > .7 );

                for ( i = 0; i < pi.length; i++ )
                {
                    if ( Math.random() > threshold ) {
                        map[ pi[ i ] ] = type;
                    }
                }
            }
        }
    },

    /**
     * collect surrounding indices for a given coordinate
     * blatantly stolen from code by Igor Kogan
     *
     * @public
     *
     * @param {number} x coordinate of the start point
     * @param {number} y coordinate of the point point
     * @param {number} mapWidth width of the total terrain map
     * @param {number} mapHeight height of the total terrain map
     * @param {boolean} inclDiagonals whether to include diagonals
     * @return {Array.<number>} of possible indices
     */
    getSurroundingIndicesFor : function( x, y, mapWidth, mapHeight, inclDiagonals )
    {
        var possibleIndices = [];
        var tx, ty, nx, ny;

        for ( tx = 0, ty = 0; ty < 3; tx = ( ++tx === 3 ? ( tx % 3 + ( ++ty & 0 ) ) : tx ) )
        {
            nx = x + tx - 1;
            ny = y + ty - 1;

            if ( nx >= 0 && ny >= 0 && nx < mapWidth && ny < mapHeight )
            {
                if ( inclDiagonals ||
                   ( !inclDiagonals && ( ( nx == x && ny != y ) || ( ny == y && nx != x ) ) ))
                {
                    possibleIndices.push( ny * mapWidth + nx );
                }
            }
        }
        return possibleIndices;
    },

    /**
     * returns a random position in the terrain
     * where the underlying tile is of given tileType and is free
     *
     * @param {Array.<number>} terrain
     * @param {number} tileType
     *
     * @return {number} free index in the terrain for given operation
     */
    positionAtRandomFreeTileType : function( terrain, tileType )
    {
        var tries = 255, i;

        while ( tries-- )
        {
            i = Math.round( Math.random() * terrain.length );

            while ( i-- )
            {
                if ( terrain[ i ] === tileType ) {
                    return i;
                }
            }
        }
        throw new Error( "could not find terrain of type '" + tileType + "'" );
    }
};
