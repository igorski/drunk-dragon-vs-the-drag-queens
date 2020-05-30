module.exports = AttackCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Copy          = require( "../../definitions/Copy" );
var Notifications = require( "../../definitions/Notifications" );
var PlayerModel   = require( "../../model/PlayerModel" );
var BattleModel   = require( "../../model/BattleModel" );

function AttackCommand()
{

}

Inheritance.extend( AttackCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
AttackCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "ATTACK COMMAND" );

    var playerModel = this.getModel( PlayerModel.NAME );
    var battleModel = this.getModel( BattleModel.NAME );

    var player   = playerModel.getPlayer();
    var opponent = battleModel.getOpponent();

    if ( battleModel.inBattle &&
         battleModel.isPlayerTurn &&
         player )
    {
        if ( opponent )
        {
            battleModel.isPlayerTurn = false;

            if ( aMessageData !== null && opponent.collect( aMessageData )) {
                this.broadcast( Notifications.Battle.ATTACK_OPPONENT_SUCCESS );
            }
            else {
                this.broadcast( Notifications.Battle.ATTACK_OPPONENT_FAILURE );
                this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.ATTACK_FAILURE );
            }
        }
    }
    this.done();
};
