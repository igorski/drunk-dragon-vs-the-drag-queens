/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 02-05-15
 * Time: 10:39
 */
module.exports = ShareStatusCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Overlay       = require( "../../view/components/Overlay" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var SocialSharer  = require( "../../utils/SocialSharer" );
var GameModel     = require( "../../model/GameModel" );

/**
 * @constructor
 * @extends {Command}
 */
function ShareStatusCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( ShareStatusCommand, Command );

/* class properties */

/** @protected @type {string} */  ShareStatusCommand.prototype._message;
/** @protected @type {boolean} */ ShareStatusCommand.prototype._restoreGameState;
/** @protected @type {boolean} */ ShareStatusCommand.prototype._restoreEnemyAI;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
ShareStatusCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "SHARE STATUS COMMAND" );

    this._message = aMessageData;

    var overlay = new Overlay( Copy.SOCIAL.SHARE_TITLE,
                               this.postFacebook.bind( this ),
                               this.postTwitter.bind( this ),
                               Copy.SOCIAL.BUTTONS.FB,
                               Copy.SOCIAL.BUTTONS.TW,
                               true );

    this.broadcast( Notifications.Navigation.OPEN_OVERLAY, overlay );

    // halt AI when overlay is opened

    var gameModel          = this.getModel( GameModel.NAME );
    this._restoreGameState = gameModel.getGameState();
    this._restoreEnemyAI   = gameModel.getEnemyAI();
    gameModel.setGameState( false );

    overlay.addEventListener( Overlay.CLOSE, this.closeOverlay.bind( this ));
};

/* event handlers */

ShareStatusCommand.prototype.postFacebook = function()
{
    SocialSharer.facebook( Copy.GENERAL.GAME_URL, "", this._message );
};

ShareStatusCommand.prototype.postTwitter = function()
{
    SocialSharer.twitter( Copy.GENERAL.GAME_URL, this._message );
};

/* protected methods */

ShareStatusCommand.prototype.closeOverlay = function()
{
    // restore enemy AI

    var gameModel = this.getModel( GameModel.NAME );

    gameModel.setGameState( this._restoreGameState );
    gameModel.setEnemyAI  ( this._restoreEnemyAI );

    // close overlay, complete command

    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY ); // will dispose listeners
    this.done();
};
