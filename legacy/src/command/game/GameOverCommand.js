/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 08-03-15
 * Time: 12:32
 */
module.exports = GameOverCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameModel     = require( "../../model/GameModel" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var Overlay       = require( "../../view/components/Overlay" );
var Storage       = require( "store" );

/**
 * @constructor
 * @extends {Command}
 */
function GameOverCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( GameOverCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
GameOverCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "GAME OVER COMMAND" );

    var gameModel = this.getModel( GameModel.NAME );
    gameModel.setGameState( false );

    var overlay = new Overlay( Copy.STATUS.GAME_OVER,
                               Storage.get( "game" ) ? this.handleHPup.bind( this ) : null,
                               this.handleMPup.bind( this ),
                               Copy.GENERAL.RES, Copy.GENERAL.CNG );

    this.broadcast( Notifications.Navigation.OPEN_OVERLAY, overlay );
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
GameOverCommand.prototype.handleHPup = function( aEvent )
{
    this.broadcast( Notifications.Storage.RESTORE_GAME );
    this.returnToGame();
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
GameOverCommand.prototype.handleMPup = function( aEvent )
{
    this.broadcast( Notifications.Storage.CREATE_NEW_GAME );
    this.returnToGame();
};

/* protected methods */

/**
 * @protected
 */
GameOverCommand.prototype.returnToGame = function()
{
    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );
    this.broadcast( Notifications.Game.RETURN_TO_WORLD );
    this.broadcast( Notifications.Player.UPDATE_STATUS );
    this.done();
};

