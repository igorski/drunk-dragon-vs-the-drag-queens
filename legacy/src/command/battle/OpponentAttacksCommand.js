module.exports = OpponentAttacksCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var PlayerModel   = require( "../../model/PlayerModel" );
var BattleModel   = require( "../../model/BattleModel" );

function OpponentAttacksCommand()
{

}

Inheritance.extend( OpponentAttacksCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
OpponentAttacksCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "OPPONENT ATTACKS COMMAND" );

    var playerModel = this.getModel( PlayerModel.NAME );
    var battleModel = this.getModel( BattleModel.NAME );

    var player = playerModel.getPlayer();

    if ( battleModel.inBattle &&
         !battleModel.isPlayerTurn )
    {
        battleModel.isPlayerTurn = true;

        // aMessageData is an Attack

        if ( aMessageData !== null && player.collect( aMessageData )) {
            this.broadcast( Notifications.Battle.OPPONENT_ATTACK_SUCCESS );
            this.broadcast( Notifications.Player.UPDATE_STATUS );
        }
        else {
            this.broadcast( Notifications.Battle.OPPONENT_ATTACK_FAILURE );
            this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.DEFEND_SUCCESS );
        }
    }
    this.done();
};
