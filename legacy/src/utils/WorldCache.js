/**
 * Created by igorzinken on 04-03-15.
 */
var Cave = require( "../model/vo/Cave" );
// note we declare it onto window to declare it only once

var WorldCache = module.exports = window[ "WorldCache" ] || ( window[ "WorldCache" ] =
{
    tileWidth  : 20,
    tileHeight : 20,
    positions  : {},            // cached position of all enemies

    /**
     * cache all enemy positions
     *
     * @public
     * @param {Array.<Opponent>} aEnemies
     */
    cachePositions : function( aEnemies )
    {
        var positions = WorldCache.positions;

        aEnemies.forEach( function( enemy )
        {
            positions[ enemy.x + "-" + enemy.y ] = enemy;
        });
    },

    /**
     * clear all cached positions for Objects of given aType
     * (for instance to clear only enemies or shops, but leave
     * everything else in place)
     *
     * @public
     * @param {function(new: *)} aType
     */
    clearPositionsOfType : function( aType )
    {
        var positions = WorldCache.positions;

        Object.keys( positions ).forEach( function( key )
        {
            if ( positions[ key ] instanceof aType ) {
                delete positions[ key ];
            }
        });
    },

    /**
     * verify whether given x- and y coordinate for given world
     * is free to position an object
     *
     * @param {Environment} environment
     * @param {number} positionX
     * @param {number} positionY
     * @param {boolean=} terrainOnly optional, whether to only check whether the position
     *        is free at the terrain level (defaults to false), this can be used to allow
     *        the player to intersect certain Objects, but not traverse incompatible terrain types)
     *
     * @return {boolean} whether the position is free for allocation
     */
    positionFree : function( environment, positionX, positionY, terrainOnly )
    {
        if ( typeof terrainOnly !== "boolean" ) terrainOnly = false;

        if ( !terrainOnly &&
             typeof WorldCache.positions[ positionX + "-" + positionY ] !== "undefined" )
        {
            return false;
        }
        return environment.positionFree( positionX, positionY );
    },

    /**
     * retrieve an Object at given coordinate
     *
     * @public
     *
     * @param {number} x
     * @param {number} y
     * @return {*|null}
     */
    getObjectAtPosition : function( x, y )
    {
        var id = x + "-" + y;

        if ( !WorldCache.positions[ id ])
            return null;

        return WorldCache.positions[ id ];
    },

    /**
     * reserve given aObject at given coordinates
     *
     * @public
     *
     * @param {number} aTargetX
     * @param {number} aTargetY
     * @param {*} aObject
     */
    reserve : function( aTargetX, aTargetY, aObject )
    {
        WorldCache.positions[ aTargetX + "-" + aTargetY ] = aObject;
    },

    /**
     * reserve given aObject at a position nearest
     * to aTargetX, aTargetY (without BEING aTargetX at aTargetY !)
     *
     * @public
     *
     * @param {World} aWorld
     * @param {number} aTargetX
     * @param {number} aTargetY
     * @param {*} aObject
     * @param {number=} aMargin preferred distance around given coordinate
     *        (optional, defaults to 1)
     * @param {number=} aTries the amount of tries this function has resolved to
     *        in case requested aMargin yields no results (increases margin iteratively)
     *
     * @return {boolean} whether position could be resolved
     */
    reserveAtNearestPosition : function( aWorld, aTargetX, aTargetY, aObject, aMargin, aTries )
    {
        aMargin = typeof aMargin === "number" ? aMargin : 1;
        aTries  = typeof aTries  === "number" ? aTries  : 0;

        var positions = WorldCache.positions, pos;

        // internal check whether given position is free, and
        // if so, register it to given aObject

        function isFree( positionX, positionY )
        {
            var free = false;

            if ( free = WorldCache.positionFree( aWorld, positionX, positionY ))
            {
                positions[ pos ] = aObject;
                aObject.x = positionX;
                aObject.y = positionY;
            }
            return free;
        }

        // try closest positions first (from -1 x to x + aMargin, at default
        // settings that is 3 tiles)

        for ( var i = aTargetX - aMargin, l = aTargetX + aMargin; i < l; ++i )
        {
            // check x position at given aTargetY first

            if ( isFree( i, aTargetY ))
                return true;

            // check with y position

            for ( var j = aTargetY - aMargin, jl = aTargetY + aMargin; j < jl; ++j )
            {
                if ( isFree( i, j ))
                    return true;
            }
        }

        // no free position found ? increase margins range and try again

        if ( aTries < 5 )
            return WorldCache.reserveAtNearestPosition( aWorld, aTargetX, aTargetY, aObject, ++aMargin, ++aTries );

        // exceeded all tries ? give up

        return false;
    },

    /**
     * clear all cached positions
     *
     * @public
     */
    flush : function()
    {
        WorldCache.positions = {};
    }
});
