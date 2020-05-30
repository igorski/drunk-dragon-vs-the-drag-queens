/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = PlayerModel;

var Inheritance   = require( "zjslib" ).Inheritance;
var EventHandler  = require( "zjslib" ).EventHandler;
var Model         = require( "zmvc" ).Model;
var Player        = require( "./vo/Player" );
var Notifications = require( "../definitions/Notifications" );

/**
 * PlayerModel holds the current state of the Player
 *
 * @constructor
 * @extends {Model}
 */
function PlayerModel()
{
    Inheritance.super( this, PlayerModel.NAME );
}

Inheritance.extend( PlayerModel, Model );

/* class constants */

/** @public @const @type {string} */ PlayerModel.NAME = "PlayerModel";

/* class properties */

/** @protected @type {Player} */       PlayerModel.prototype._player;
/** @protected @type {EventHandler} */ PlayerModel.prototype._playerHandler;

/* public methods */

/**
 * convenience method to return all public player data in
 * a single Object
 *
 * @public
 * @return {Player}
 */
PlayerModel.prototype.getPlayer = function()
{
    return this._player;
};

/**
 * @public
 *
 * @param {Player} aPlayer
 */
PlayerModel.prototype.setPlayer = function( aPlayer )
{
    if ( this._player )
        this._player.dispose();

    if ( this._playerHandler )
        this._playerHandler.dispose();

    this._player = aPlayer;

    // listen to changes in player movement

    var h = this._playerHandler = new EventHandler();

    var moveHandler = this.handleMove.bind( this );

    h.addEventListener( this._player, Player.MOVE_START,         moveHandler );
    h.addEventListener( this._player, Player.MOVE_STOP,          moveHandler );
    h.addEventListener( this._player, Player.SWITCH_DIRECTION,   moveHandler );
    h.addEventListener( this._player, Player.TILE_MOVE_COMPLETE, moveHandler );
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
PlayerModel.prototype.handleMove = function( aEvent )
{
    var data    = aEvent.value || {};
    data.player = this._player;

    switch ( aEvent.type )
    {
        case Player.MOVE_START:
            this.broadcast( Notifications.Player.START_MOVEMENT, data );
            break;

        case Player.MOVE_STOP:
            this.broadcast( Notifications.Player.STOP_MOVEMENT, data );
            break;

        case Player.SWITCH_DIRECTION:
            this.broadcast( Notifications.Player.SWITCH_DIRECTION, data );
            break;

        case Player.TILE_MOVE_COMPLETE:
            this.broadcast( Notifications.Player.VALIDATE_PLAYER_MOVE, data );
            break;
    }
};
