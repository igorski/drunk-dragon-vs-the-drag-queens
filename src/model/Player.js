import Character from './Character';
import WorldCache from '../../utils/WorldCache';

import InventoryFactory from '@/model/inventory-factory';

/* class constants */

/** @public @const @type {string} */ Player.MOVE_START           = "P::0";
/** @public @const @type {string} */ Player.MOVE_STOP            = "P::1";
/** @public @const @type {string} */ Player.SWITCH_DIRECTION     = "P::2";
/** @public @const @type {string} */ Player.TILE_MOVE_COMPLETE   = "P::3";
/** @public @const @type {string} */ Player.MOVE_NONE            = -1; // standing still
/** @public @const @type {number} */ Player.MOVE_LEFT            = 0;
/** @public @const @type {number} */ Player.MOVE_RIGHT           = 1;
/** @public @const @type {number} */ Player.MOVE_UP              = 2;
/** @public @const @type {number} */ Player.MOVE_DOWN            = 3;
/** @public @const @type {number} */ Player.SPEED_INCREMENT      = 0.05;

/* class properties */

/** @public @type {number} */    Player.prototype.XP;
/** @public @type {Inventory} */ Player.prototype.inventory;
/** @public @type {boolean} */   Player.prototype.moving          = false;
/** @public @type {boolean} */   Player.prototype.xLocked         = false;
/** @public @type {boolean} */   Player.prototype.yLocked         = false;
/** @public @type {number} */    Player.prototype.xDirection      = Player.MOVE_NONE; // 0 == left, 1 == right
/** @public @type {number} */    Player.prototype.yDirection      = Player.MOVE_NONE; // 2 == up,   3 == down
/** @public @type {number} */    Player.prototype.xSpeed          = 0;
/** @public @type {number} */    Player.prototype.ySpeed          = 0;
/** @public @type {number} */    Player.prototype.MAX_X_SPEED     = 1.25;
/** @public @type {number} */    Player.prototype.MAX_Y_SPEED     = 1.25;

/* public methods */

/**
 * start moving
 *
 * @public
 *
 * @param {number} aDirection
 */
Player.prototype.move = function( aDirection )
{
    var wasMoving = this.moving;
    this.moving   = true;

    var isHorizontal = false, dispatch = false;

    switch ( aDirection )
    {
        case Player.MOVE_LEFT:
        case Player.MOVE_RIGHT:

            isHorizontal = true;

            if ( this.xDirection !== aDirection )
                dispatch = true;

            break;

        case Player.MOVE_UP:
        case Player.MOVE_DOWN:

            if ( this.yDirection !== aDirection )
                dispatch = true;

            break;
    }

    // commit the changes

    if ( isHorizontal )
        this.xDirection = aDirection;
    else
        this.yDirection = aDirection;

    if ( dispatch )
        this.dispatchEvent( new Event( Player.MOVE_START, { "dir" : aDirection, "axis" : isHorizontal ? "x" : "y" }));

    /*
    if ( wasMoving && ( oldDirection !== Player.MOVE_NONE && oldDirection !== aDirection ))
    {
        var wasSideways = oldDirection === Player.MOVE_LEFT || oldDirection === Player.MOVE_RIGHT;
        var isSideWays  = aDirection === Player.MOVE_LEFT || aDirection === Player.MOVE_RIGHT;

        // use existing speeds when switching direction

        if ( !wasSideways && isSideWays ) {
            this.xSpeed = Math.abs( this.ySpeed );
            this.ySpeed = 0;

            if ( aDirection === this.MOVE_LEFT ) this.xSpeed = -this.xSpeed;
        }
        else if ( wasSideways && !isSideWays ) {
            this.ySpeed = Math.abs( this.xSpeed );
            this.xSpeed = 0;

            if ( aDirection === this.MOVE_UP ) this.ySpeed = -this.ySpeed;
        }
        this.dispatchEvent( new Event( Player.SWITCH_DIRECTION,
                           { "dir" : oldDirection, "axis" : isHorizontal ? "x" : "y" }));
    }
*/
};

/**
 * halt movement
 *
 * @public
 * @param {number=} aDirection optional which direction to stop moving in
 *        when not given, both horizontal and vertical directions will stop
 *        their movement (thus player will come to complete stand still)
 */
Player.prototype.stop = function( aDirection )
{
    var oldX = this.xDirection, oldY = this.yDirection;

    if ( typeof aDirection !== "number" )
    {
        this.xDirection = Player.MOVE_NONE;
        this.yDirection = Player.MOVE_NONE;
    }
    else
    {
        if ( aDirection === Player.MOVE_LEFT || aDirection === Player.MOVE_RIGHT )
            this.xDirection = Player.MOVE_NONE;

        else if ( aDirection === Player.MOVE_UP || aDirection === Player.MOVE_DOWN )
            this.yDirection = Player.MOVE_NONE;
    }

    this.moving = this.axisMoving( "x" ) || this.axisMoving( "y" );

    // only dispatch if player was actually moving in given direction

    if ( oldX !== this.xDirection || oldY !== this.yDirection )
    {
        var isHorizontal = aDirection === Player.MOVE_LEFT || aDirection === Player.MOVE_RIGHT;
        this.dispatchEvent( new Event( Player.MOVE_STOP, { "dir" : aDirection, "axis" : isHorizontal ? "x" : "y" }));
    }
};

/**
 * resets the properties of the Players movement
 *
 * @public
 */
Player.prototype.reset = function()
{
    this.haltMovement( true,  true );
    this.haltMovement( false, true );
};

/**
 * halt all movement in given direction
 *
 * @param {boolean} isHorizontal whether tho halt horizontal
 *        movement, when false halts vertical movement
 * @param {boolean=} resetOffset optional, whether to reset the
 *        Players default offset for the given axis
 */
Player.prototype.haltMovement = function( isHorizontal, resetOffset )
{
    if ( isHorizontal )
    {
        this.xSpeed     = 0;
        this.xDirection = Player.MOVE_NONE;

        if ( resetOffset ) this.x = 0;
    }
    else {
        this.ySpeed     = 0;
        this.yDirection = Player.MOVE_NONE;

        if( resetOffset ) this.y = 0;
    }

    this.moving = this.axisMoving( "x" ) || this.axisMoving( "y" );
};

/**
 * query whether the players movement is
 * locked for the given axis
 *
 * @public
 *
 * @param {string} axis either "x" or "y"
 * @return {boolean}
 */
Player.prototype.axisLocked = function( axis )
{
    if ( axis === "x" )
        return this.xLocked;

    return this.yLocked;
};

/**
 * query whether the player is moving
 * on the given axis
 *
 * @public
 *
 * @param {string} axis either "x" or "y"
 * @return {boolean}
 */
Player.prototype.axisMoving = function( axis )
{
    if ( axis === "x" )
        return this.xDirection !== Player.MOVE_NONE;

    return this.yDirection !== Player.MOVE_NONE;
};

/**
 * update the players speed and position
 * (invoke from a game loops update cycle)
 *
 * @public
 * @return {boolean} whether the player has moved
 */
Player.prototype.update = function()
{
    // update speed and position

    if ( this.moving )
    {
        var increment = Player.SPEED_INCREMENT;

        if ( !this.xLocked )
        {
            switch ( this.xDirection )
            {
                case Player.MOVE_LEFT:

                    if ( this.xSpeed > -this.MAX_X_SPEED )
                        this.xSpeed -= increment;
                    break;

                case Player.MOVE_RIGHT:

                    if ( this.xSpeed < this.MAX_X_SPEED )
                        this.xSpeed += increment;
                    break;
            }
        }

        if ( !this.yLocked )
        {
            switch ( this.yDirection )
            {
                case Player.MOVE_UP:

                    if ( this.ySpeed > -this.MAX_Y_SPEED )
                        this.ySpeed -= increment;
                    break;

                case Player.MOVE_DOWN:

                    if ( this.ySpeed < this.MAX_Y_SPEED )
                        this.ySpeed += increment;
                    break;
            }
        }
    }
    else
    {
        // slowly reduce the Players speed if movement has halted

        if ( this.xSpeed < 0 )
            this.xSpeed += .25;

        else if ( this.xSpeed > 0 )
            this.xSpeed -= .25;

        if ( this.ySpeed < 0 )
            this.ySpeed += .25;

        else if ( this.ySpeed > 0 )
            this.ySpeed -= .25;
    }

    var moved = false;

    // are we moving horizontally ?

    if ( this.xSpeed !== 0 )
    {
        this.x += Math.round( this.xSpeed );
        moved   = true;
    }

    // are we moving vertically ?

    if ( this.ySpeed !== 0 )
    {
        this.y += Math.round( this.ySpeed );
        moved   = true;
    }

    if ( moved )
    {
        var x = this.x, y = this.y, tileWidth = WorldCache.tileWidth, tileHeight = WorldCache.tileHeight;

        // dispatch an Event stating a single tile has been travelled ?

        if ( x <= -tileWidth || x >= tileWidth )
            this.dispatchEvent( new Event( Player.TILE_MOVE_COMPLETE, { "axis" : "x" }));

        if ( y <= -tileHeight || y >= tileHeight )
            this.dispatchEvent( new Event( Player.TILE_MOVE_COMPLETE, { "axis" : "y" }));
    }
};
