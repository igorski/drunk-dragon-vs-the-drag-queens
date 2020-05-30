/**
 * Created by izinken on 24/03/15.
 */
var CaveLevel = require( "../vo/CaveLevel" );

var CaveLevelAssembler = module.exports =
{
    toJSON : function( aCaveLevel )
    {
        return {
            "x" : aCaveLevel.startX,
            "y" : aCaveLevel.startY,
            "w" : aCaveLevel.width,
            "h" : aCaveLevel.height,
            "t" : aCaveLevel.terrain.join( "" ) // (int values)
        };
    },

    fromJSON : function( aJSON )
    {
        var terrain = aJSON.t.split( "" ); // split integer values to Array
        var i       = terrain.length;
        while ( i-- )
        {
            terrain[ i ] = parseInt( terrain[ i ], 10 );    // String to numerical
        }

        var out = new CaveLevel( aJSON.w, aJSON.h, terrain );

        out.startX = aJSON.x;
        out.startY = aJSON.y;

        // exits and treasures are part from the terrain and generated by the CaveLevel constructor

        return out;
    }
};
