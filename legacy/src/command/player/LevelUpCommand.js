/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 09-03-15
 * Time: 19:09
 */
module.exports = LevelUpCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Overlay       = require( "../../view/components/Overlay" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var TimeUtil      = require( "../../utils/TimeUtil" );

/**
 * @constructor
 * @extends {Command}
 */
function LevelUpCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( LevelUpCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
LevelUpCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "LEVEL UP COMMAND" );

    var gameModel = this.getModel( GameModel.NAME );
    gameModel.setEnemyAI( false );  // halt enemy movement

    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    var hp = player.maxHP + 5;
    var mp = player.maxMP + 5;

    var overlay = new Overlay( Copy.STATUS.LEVEL_UP,
                               this.handleHPup.bind( this ),
                               this.handleMPup.bind( this ),
                               Copy.PLAYER.HP_UP.replace( "{0}", hp.toString() ),
                               Copy.PLAYER.MP_UP.replace( "{0}", mp.toString() ));

    this.broadcast( Notifications.Navigation.OPEN_OVERLAY, overlay );
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
LevelUpCommand.prototype.handleHPup = function( aEvent )
{
    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    player.maxHP += 5;

    this.returnToGame();
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
LevelUpCommand.prototype.handleMPup = function( aEvent )
{
    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    player.maxMP += 5;

    this.returnToGame();
};

/* protected methods */

/**
 * @protected
 */
LevelUpCommand.prototype.returnToGame = function()
{
    // maximize all powers
    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    player.HP = player.maxHP;
    player.MP = player.maxMP;
    player.SP = player.maxSP;

    // restore enemy movement
    var gameModel = this.getModel( GameModel.NAME );
    gameModel.setEnemyAI( true );

    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );
    this.broadcast( Notifications.Player.UPDATE_STATUS );
    this.broadcast( Notifications.Game.RETURN_TO_WORLD );

    // social media message share ?

    var time      = gameModel.lastSavedTime > -1 ? gameModel.lastSavedTime : gameModel.sessionStart;
    var totalTime = gameModel.totalTime + ( Date.now() - time );

    var message = Copy.SOCIAL.LEVEL_UP.replace( "{0}", player.level.toString() );
    message     = message.replace( "{TIME}", TimeUtil.msToString( totalTime ));

    // timeout is a very cheap way to ensure the enemy AI is off when the social share popup opens

    setTimeout( function()
    {
        this.broadcast( Notifications.Social.SHARE, message );
        this.done();

    }.bind( this ), 250 );
};
