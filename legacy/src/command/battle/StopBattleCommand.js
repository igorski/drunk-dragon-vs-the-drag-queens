module.exports = StopBattleCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var DOM           = require( "zjslib" ).DOM;
var ArrayUtil     = require( "zjslib" ).utils.ArrayUtil;
var Command       = require( "zmvc" ).Command;
var BattleModel   = require( "../../model/BattleModel" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Notifications = require( "../../definitions/Notifications" );
var WorldCache    = require( "../../utils/WorldCache" );

/**
 * @constructor
 * @extends {Command}
 */
function StopBattleCommand()
{

}

Inheritance.extend( StopBattleCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
StopBattleCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "STOP BATTLE COMMAND" );

    var battleModel = this.getModel( BattleModel.NAME );
    var gameModel   = this.getModel( GameModel.NAME );
    var playerModel = this.getModel( PlayerModel.NAME );

    this.broadcast( Notifications.UI.HIDE_BATTLE_UI );
    this.broadcast( Notifications.Navigation.OPEN_PAGE, null );

    // calculate the battle results

    var opponent = battleModel.getOpponent();
    var player   = playerModel.getPlayer();
    var levelup  = false;

    // what was the battle outcome ?

    if ( player.isAlive() )
    {
        if ( !opponent.isAlive() )
        {
            // player slaughtered opponent, remove from world...
            var world     = gameModel.world, cave = gameModel.cave;
            var inCave    = cave !== null && cave !== undefined;    // whether we're inside a cave or in the overground world

            ArrayUtil.removeItem( inCave ? cave.enemies : world.enemies, opponent );

            // ...and YAY! \o/ award some XP !

            var xp = Math.round(( opponent.level / player.level ) * 5 );

            // award at least ONE point (scenario is player has a much higher level than opponent)
            xp = Math.max( xp, 1 );

            // award gained experience points

            this.broadcast( Notifications.Player.EXPERIENCE_POINTS_AWARDED, xp );

            levelup = ( player.XP + xp ) >= 100;

            if ( levelup )
            {
                ++player.level; // level up !
                this.broadcast( Notifications.Player.LEVEL_UP, player.level );
            }

            player.XP = ( player.XP + xp ) % 100;

            // opponent had something to steal ?

            if ( opponent.inventory )
            {
                var merged = player.inventory.merge( opponent.inventory );

                if ( merged !== null ) {
                    this.broadcast( Notifications.Player.STOLE_INVENTORY_ITEMS, merged );
                }
            }
        }
        else {
            // player likely ran away / forfeit, reposition opponent as it is
            // still in the world and we don't want it sharing a tile with the player

            WorldCache.reserveAtNearestPosition( gameModel.world, opponent.x, opponent.y, opponent, 1 );
        }
    }
    else {
        // opponent won. DARN.
        this.broadcast( Notifications.Game.GAME_OVER );
    }

    if ( !levelup )
    {
        this.broadcast( Notifications.Game.RETURN_TO_WORLD );
        this.broadcast( Notifications.Player.UPDATE_STATUS );
    }
    // reset battle state
    battleModel.resetBattleState();

    DOM.removeClass( document.body, "battle" );
    this.done();
};
