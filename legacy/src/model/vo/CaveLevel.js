/**
 * Created by igorzinken on 12-03-15.
 */
module.exports = CaveLevel;

var Cave = require( "./Cave" );

/**
 * @constructor
 *
 * @param {number} aWidth
 * @param {number} aHeight
 * @param {Array.<number>} aTerrain
 */
function CaveLevel( aWidth, aHeight, aTerrain )
{
    this.width   = aWidth;
    this.height  = aHeight;
    this.terrain = aTerrain;

    this.exits     = [];
    this.treasures = [];

    // cache treasures and exits for level

    for ( var x = 0, y = 0; y < aHeight; x = ( ++x === aWidth ? ( x % aWidth + ( ++y & 0 ) ) : x ) )
    {
        // found the exit ?
        if ( aTerrain[ y * aWidth + x ] === Cave.Tiles.TUNNEL ) {
            this.exits.push({ "x" : x, "y" : y });
        }
    }

    // TODO : no treasures yet

    // determine Players begin offset

    for ( x = 0, y = 0; y < aHeight; x = ( ++x === aWidth ? ( x % aWidth + ( ++y & 0 ) ) : x ) )
    {
        // use first instance of ground as the start offset
        if ( aTerrain[ y * aWidth + x ] === Cave.Tiles.GROUND ) {
            this.startX = x;
            this.startY = y;
            break;
        }
    }
    // QQQ
    this.startX = Math.round( this.width / 2 );
    this.startY = Math.round( this.height / 2 );
}

/* class properties */

/** @public @type {number} */         CaveLevel.prototype.startX;
/** @public @type {number} */         CaveLevel.prototype.startY;
/** @public @type {number} */         CaveLevel.prototype.width;
/** @public @type {number} */         CaveLevel.prototype.height;
/** @public @type {Array.<number>} */ CaveLevel.prototype.terrain;

/** @public @type {Array.<Object>} */ CaveLevel.prototype.exits;
/** @public @type {Array.<Object>} */ CaveLevel.prototype.treasures;
