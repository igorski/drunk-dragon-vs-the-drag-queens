/**
 * Created by igorzinken on 28-02-15.
 */
module.exports = World;

var Inheritance = require( "zjslib" ).Inheritance;
var Environment = require( "./Environment" );

/**
 * @constructor
 * @extends {Environment}
 */
function World()
{
    Inheritance.super( this );

    // overworld dimensions

    this.width  = 8;
    this.height = 8;

    // player coordinates and depth level

    this.x     = this.width  / 2;
    this.y     = this.height / 2;
    this.level = 0;

    this.caves   = [];
    this.shops   = [];
}

Inheritance.extend( World, Environment );

/* class constants */

/**
 * the tile types for rendering a World
 *
 * @public
 * @const
 * @type {Object}
 */
World.Tiles = { GRASS    : 0,
                SAND     : 1,
                WATER    : 2,
                MOUNTAIN : 3,
                TREE     : 4 };

/* class properties */

/** @public @type {Array.<Cave>} */ World.prototype.caves;
/** @public @type {Array.<Shop>} */ World.prototype.shops;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
World.prototype.positionFree = function( x, y )
{
    var terrain = this.terrain[ y * this.width + x] , enumeration = World.Tiles;

    switch ( terrain )
    {
        default:
        case enumeration.GRASS: // grass
        case enumeration.SAND: // sand
            return true;

        case enumeration.WATER: // water
        case enumeration.MOUNTAIN: // mountain
        case enumeration.TREE: // tree
            return false;
    }
};
