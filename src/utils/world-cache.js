import EnvironmentFactory from '@/model/factories/environment-factory';

const WorldCache =
{
    tileWidth  : 20,
    tileHeight : 20,
    positions  : {},            // cached position of all enemies

    /**
     * cache all enemy positions
     *
     * @param {Array<Object>} enemies
     */
    cachePositions( enemies ) {
        const positions = WorldCache.positions;
        enemies.forEach(enemy => {
            positions[ `${enemy.x}-${enemy.y}` ] = enemy;
        });
    },

    /**
     * clear all cached positions for Objects of given aType
     * (for instance to clear only enemies or shops, but leave
     * everything else in place)
     *
     * @param {function(new: *)} type
     */
    clearPositionsOfType( type ) {
        const positions = WorldCache.positions;
throw new Error('TODO instanceof wont wrk');
        Object.keys( positions ).forEach( key => {
            if ( positions[ key ] instanceof type ) {
                delete positions[ key ];
            }
        });
    },

    /**
     * verify whether given x- and y coordinate for given world
     * is free to position an object
     *
     * @param {Object} environment
     * @param {number} positionX
     * @param {number} positionY
     * @param {boolean=} terrainOnly optional, whether to only check whether the position
     *        is free at the terrain level (defaults to false), this can be used to allow
     *        the player to intersect certain Objects, but not traverse incompatible terrain types)
     *
     * @return {boolean} whether the position is free for allocation
     */
    isPositionFree( environment, positionX, positionY, terrainOnly ) {
        if ( typeof terrainOnly !== 'boolean' ) terrainOnly = false;

        if ( !terrainOnly &&
             typeof WorldCache.positions[ `${positionX}-${positionY}` ] !== 'undefined' ) {
            return false;
        }
        return EnvironmentFactory.isPositionFree( environment, positionX, positionY );
    },

    /**
     * retrieve an Object at given coordinate
     *
     * @param {number} x
     * @param {number} y
     * @return {*|null}
     */
    getObjectAtPosition( x, y ) {
        const id = `${x}-${y}`;

        if ( !WorldCache.positions[ id ])
            return null;

        return WorldCache.positions[ id ];
    },

    /**
     * reserve given aObject at given coordinates
     *
     * @param {number} aTargetX
     * @param {number} aTargetY
     * @param {*} aObject
     */
    reserve( aTargetX, aTargetY, aObject ) {
        WorldCache.positions[ `${aTargetX}-${aTargetY}` ] = aObject;
    },

    /**
     * reserve given aObject at a position nearest
     * to aTargetX, aTargetY (without BEING aTargetX at aTargetY !)
     *
     * @param {Object} aWorld
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
    reserveAtNearestPosition( aWorld, aTargetX, aTargetY, aObject, aMargin, aTries ) {
        aMargin = typeof aMargin === 'number' ? aMargin : 1;
        aTries  = typeof aTries  === 'number' ? aTries  : 0;

        const positions = WorldCache.positions;
        let pos;

        // internal check whether given position is free, and
        // if so, register it to given aObject

        function isFree( positionX, positionY ) {
            let free = false;
            if ( free = WorldCache.isPositionFree( aWorld, positionX, positionY )) {
              throw new Error('TODO WHAT IS POS HERE?');
                positions[ pos ] = aObject;
                aObject.x = positionX;
                aObject.y = positionY;
            }
            return free;
        }

        // try closest positions first (from -1 x to x + aMargin, at default
        // settings that is 3 tiles)

        for ( let i = aTargetX - aMargin, l = aTargetX + aMargin; i < l; ++i )
        {
            // check x position at given aTargetY first

            if ( isFree( i, aTargetY ))
                return true;

            // check with y position

            for ( let j = aTargetY - aMargin, jl = aTargetY + aMargin; j < jl; ++j )
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
     */
    flush() {
        WorldCache.positions = {};
    }
};

export default WorldCache;
