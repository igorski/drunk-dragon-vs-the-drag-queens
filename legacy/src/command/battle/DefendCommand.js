module.exports = DefendCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Notifications = require( "../../definitions/Notifications" );
var PlayerModel   = require( "../../model/PlayerModel" );
var BattleModel   = require( "../../model/BattleModel" );
var Random        = require( "random-seed" );

function DefendCommand()
{

}

Inheritance.extend( DefendCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
DefendCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "DEFEND COMMAND" );

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

            // if player HP is above half the max HP, defense is 100 % accurate, when
            // HP is low, it is more randomized...

            // TODO : evaluate player state for dizziness, etc... to change defense odds

            if ( player.HP > ( player.maxHP / 2 ) ||
                 Random.create().intBetween( 0, 5 ) < 2 )
            {
                player.isDefending = true;
            }

            // steps battle to next turn
            this.broadcast( Notifications.Battle.ATTACK_OPPONENT_SUCCESS );
        }
    }
    this.done();
};
