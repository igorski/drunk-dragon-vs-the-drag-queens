/**
 * Created by izinken on 24/03/15.
 */
var CaveLevelAssembler = require( "./CaveLevelAssembler" );
var Cave               = require( "../vo/Cave" );
import CaveFactory from '@/model/cave-factory';

var CaveAssembler = module.exports =
{
    toJSON : function( aCave )
    {
        var levels = [];

        aCave.levels.forEach( function( aCaveLevel )
        {
            levels.push( CaveLevelAssembler.toJSON( aCaveLevel ));
        });
        return {
            "x"   : aCave.x,
            "y"   : aCave.y,
            "w"   : aCave.width,
            "h"   : aCave.height,
            "l"   : aCave.level,
            "lvl" : levels
        }
    },

    fromJSON : function( aJSON )
    {
        var out = CaveFactory.createCave( aJSON.x, aJSON.y );

        var levels = [];

        aJSON.lvl.forEach( function( aJSONLevel )
        {
            levels.push( CaveLevelAssembler.fromJSON( aJSONLevel ));
        });

        out.levels = levels;
        out.level  = aJSON.l;
        out.width  = aJSON.w;
        out.height = aJSON.h;

        return out;
    }
};
