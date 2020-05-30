module.exports = RunComand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Copy          = require( "../../definitions/Copy" );
var Notifications = require( "../../definitions/Notifications" );
var PlayerModel   = require( "../../model/PlayerModel" );
var BattleModel   = require( "../../model/BattleModel" );
var Random        = require( "random-seed" );

function RunComand()
{

}

Inheritance.extend( RunComand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
RunComand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "RUN COMMAND" );

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

            // players at level below 10 have a higher chance of running

            // TODO : evaluate player state for dizziness, etc... to change run odds

            if ( ( player.level < 10 && Random.create().intBetween( 0, 5 ) < 3 ) ||
                 Random.create().intBetween( 0, 10 ) < 3 )
            {
                this.broadcast( Notifications.Battle.BATTLE_END );
                this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.RUN_SUCCESS );
                return this.done();
            }
            else {
                this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.RUN_FAILURE );
            }
            // steps battle to next turn
            this.broadcast( Notifications.Battle.ATTACK_OPPONENT_SUCCESS );
        }
    }
    this.done();
};
