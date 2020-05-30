module.exports = StartBattleCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var DOM           = require( "zjslib" ).DOM;
var Command       = require( "zmvc" ).Command;
var BattleModel   = require( "../../model/BattleModel" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var AudioTracks   = require( "../../definitions/AudioTracks" );
var Notifications = require( "../../definitions/Notifications" );
var BattleView    = require( "../../view/battle/Battle.View" );
/**
 * @constructor
 * @extends {Command}
 */
function StartBattleCommand()
{

}

Inheritance.extend( StartBattleCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
StartBattleCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "START BATTLE COMMAND" );

    var playerModel = this.getModel( PlayerModel.NAME );
    var battleModel = this.getModel( BattleModel.NAME );
    var gameModel   = this.getModel( GameModel.NAME );

    var player   = playerModel.getPlayer();
    var opponent = battleModel.getOpponent();

    if ( player && opponent )
    {
        battleModel.inBattle     = true;
        battleModel.isPlayerTurn = true;

        gameModel.setEnemyAI( false ); // no updates of world-related AI during battle!

        this.broadcast( Notifications.UI.SHOW_BATTLE_UI );
        this.broadcast( Notifications.Player.UPDATE_STATUS );
        this.broadcast( Notifications.Navigation.OPEN_PAGE, BattleView );
    }

    this.broadcast( Notifications.Audio.PLAY_TRACK, AudioTracks.BATTLE_THEME );

    DOM.addClass( document.body, "battle" );
    this.done();
};
