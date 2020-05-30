module.exports = Opponent;

var Inheritance = require( "zjslib" ).Inheritance;
var Character   = require( "./Character" );
var Inventory   = require( "./Inventory" );

/**
 * @constructor
 * @extends {Character}
 *
 * @param {string=} aName
 * @param {number=} aHP health power
 * @param {number=} aMP magic power
 * @param {Inventory=} aInventory optional inventory
 */
function Opponent( aName, aLevel, aHP, aMP, aInventory )
{
    Inheritance.super( this, "OGRE", aName, aLevel, aHP, aHP, aMP, aMP, 0, 0 );

    if ( aInventory instanceof Inventory ) {
        this.inventory = aInventory;
    }
}

Inheritance.extend( Opponent, Character );

/* class properties */

/**
 * An Opponent can carry an Inventory
 *
 * @public
 * @type {Inventory}
 */
Opponent.prototype.inventory;

/**
 * An Opponent can have a actionQueue describing
 * the path it will walk (see AI path finding)
 *
 * @public
 * @type {Array.<{x: number, y:number }>}
 */
Opponent.prototype.actionQueue;

/**
 * @public
 * @type {boolean}
 */
Opponent.prototype.handlingAction = false;

/* public methods */

/**
 * set a new action queue for the Opponent and
 * automatically execute the first pending action
 *
 * @public
 *
 * @param {Array.<{x: number, y:number }>} aActionQueue
 * @param {number=} aOptMaxActionAmount optional cap in actions (if for instance an
 *        Opponent has to execute 20 actions to go from a to b, we might
 *        want to limit this to 3 actions, so the Opponent can re-evaluate
 *        its course (b might have moved or the environment has changed in
 *        such a way that a newer, more efficient route has presented itself)
 *
 * @return {boolean} whether an action has been set and taken
 */
Opponent.prototype.setAction = function( aActionQueue, aOptMaxActionAmount )
{
    this.actionQueue = aActionQueue.splice( 0,
                       typeof aOptMaxActionAmount === "number" ? aOptMaxActionAmount : aActionQueue.length );

    return this.executeAction();
};

/**
 * execute the first pending action
 *
 * @public
 *
 * @return {boolean} whether an action is taken
 */
Opponent.prototype.executeAction = function()
{
    if ( this.handlingAction || !this.actionQueue || this.actionQueue.length === 0 )
        return false;

    this.handlingAction = true;

    var action = this.actionQueue.shift();

    // action is currently only a change in movement

    this.x = action.x;
    this.y = action.y;

    this.handlingAction = false; // in case of animation, this is a delayed reset

    return true;
};

/**
 * remove all pending actions in the Action Queue
 *
 * @public
 */
Opponent.prototype.resetActions = function()
{
    this.handlingAction = false;
    console.log("RESET");
    this.setAction( [] );
};
