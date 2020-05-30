module.exports = Cave;

var Inheritance = require( "zjslib" ).Inheritance;
var Environment = require( "./Environment" );

/**
 * @constructor
 * @extends {Environment}
 *
 * @param {number} aX x-position of the Cave within the world
 * @param {number} aY y-position of the Cave within the world
 */
function Cave( aX, aY )
{
    Inheritance.super();

    this.x       = aX;
    this.y       = aY;
    this.level   = NaN;
    this.levels  = [];
    this.enemies = this.enemies || [];
}

Inheritance.extend( Cave, Environment );

/* class constants */

/**
 * the tile types for rendering a Cave
 *
 * @public
 * @const
 * @type {Object}
 */
Cave.Tiles = { GROUND  : 0,
               WALL    : 1,
               TUNNEL  : 2,
               NOTHING : 3 };

/* class properties */

/** @public @type {number} */            Cave.prototype.level;     // the current level
/** @public @type {Array.<CaveLevel>} */ Cave.prototype.levels;    // the terrains for all levels

/* public methods */

/**
 * return the level the Player is currently on
 *
 * @public
 *
* @return {CaveLevel}
 */
Cave.prototype.getActiveLevel = function()
{
    return this.levels[ this.level ];
};

/* public methods */

/**
 * @override
 * @public
 *
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Cave.prototype.positionFree = function( x, y )
{
    if ( !this.terrain ) return false;  // likely still generating for the active level / depth

    var terrain = this.terrain[ y * this.width + x], enumeration = Cave.Tiles;

    switch ( terrain )
    {
        case enumeration.GROUND: // ground
        case enumeration.TUNNEL: // tunnel
            return true;

        default:
        case enumeration.NOTHING: // nothingness
        case enumeration.WALL:    // wall
            return false;
    }
};
