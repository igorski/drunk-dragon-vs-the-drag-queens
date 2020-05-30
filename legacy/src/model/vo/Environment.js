/**
 * Created by izinken on 13/03/15.
 */
module.exports = Environment;

/**
 * an Environment describes an area the player can
 * navigate through (e.g. derived Environments are the overground
 * world or Caves) an environment can also contain enemies, yikes!
 *
 * @constructor
 */
function Environment()
{
    this.enemies = [];
    this.terrain = [];
}

/** @public @type {number} */         Environment.prototype.width;    // total tiles this Environment occupies in its width
/** @public @type {number} */         Environment.prototype.height;   // total tiles this Environment occupies in its height
/** @public @type {number} */         Environment.prototype.x;        // player x-position
/** @public @type {number} */         Environment.prototype.y;        // player y-position
/** @public @type {Array.<Object>} */ Environment.prototype.enemies;  // enemies in this Environment
/** @public @type {Array.<number>} */ Environment.prototype.terrain;  // terrain describing the Environment

/* public methods */

/**
 * check whether the terrain position at the given coordinate is
 * free for movement (either by Player or Opponent)
 *
 * @public
 *
 * @param {number} x x-coordinate to check
 * @param {number} y y-coordinate to check
 * @return {boolean}
 */
Environment.prototype.positionFree = function( x, y )
{
    throw new Error( "implement in derived prototypes" );
};
