/**
 * Created by igorzinken on 12-03-15.
 *
 * HashUtil contains convenience methods to use the game's unique hash
 * values to generate numerical values (to be used when generating the world)
 */
var HashUtil = module.exports =
{
    // convenience methods to turn (parts of) the worlds String hash into numerical values

    charsToNum : function( characters )
    {
        var num = 0;

        for ( var i = 0, l = characters.length; i < l; ++i )
            num += HashUtil.charToNum( characters.charAt( i ));

        return num;
    },

    charToNum : function( character )
    {
        return parseInt( character, 16 );
    }
};
