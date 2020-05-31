/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 01-03-15
 * Time: 22:33
 */
module.exports = HandleAICommand;

var Notifications = require( "../../definitions/Notifications" );
var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var BattleModel   = require( "../../model/BattleModel" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Opponent      = require( "../../model/vo/Opponent" );
var EnemyFactory  = require( "../../model/factories/EnemyFactory" );
var WorldCache    = require( "../../utils/WorldCache" );
var PathFinder    = require( "../../utils/PathFinder" );

/**
 * @constructor
 * @extends {Command}
 */
function HandleAICommand()
{
    Inheritance.super( this );
}

Inheritance.extend( HandleAICommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
HandleAICommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "HANDLE AI COMMAND" );

    var gameModel = this.getModel( GameModel.NAME );

    // don't execute if game is over

    if ( !gameModel.getGameState() )
        return;

    var environment = gameModel.cave ? gameModel.cave : gameModel.world;

    // create enemies if none existed

    if ( environment.enemies.length === 0 )
    {
        var playerModel = this.getModel( PlayerModel.NAME );
        EnemyFactory.generateEnemies( playerModel.getPlayer(), environment );

        WorldCache.clearPositionsOfType( Opponent );
        WorldCache.cachePositions( environment.enemies ); // cache their positions
    }

    // move enemies in the vicinity of the player towards player
    // left, right, top, bottom describe the rectangle in which
    // enemies should move towards the player

    var playerX = environment.x;
    var playerY = environment.y;
    var left    = playerX - 10;
    var right   = playerX + 10;
    var top     = playerY - 10;
    var bottom  = playerY + 10;

    var i = environment.enemies.length, enemy, moved;
    var updatedEnemies = 0, oldX, oldY;

    while ( i-- )
    {
        enemy = environment.enemies[ i ];
        moved = false;

         // cache current Opponent position

        oldX = enemy.x;
        oldY = enemy.y;

        if ( oldX > left && oldX < right &&
             oldY > top  && oldY < bottom )
        {
            // Opponent has no pending action ? execute path finder

            if ( !enemy.handlingAction )
            {
                if ( !enemy.executeAction() )
                    moved = enemy.setAction( PathFinder.findPath( environment, oldX, oldY, playerX, playerY ), 2 );
                else
                    moved = true;   // is executing
            }

            // validate target position, if it is taken, deny action

            if ( moved )
            {
                if ( !WorldCache.isPositionFree( environment, enemy.x, enemy.y )) {
                    enemy.x = oldX;
                    enemy.y = oldY;
                    moved   = false;
                }
                else {
                    ++updatedEnemies;
                    delete WorldCache.positions[ oldX + "-" + oldY ]; // position will be updated
                }
            }

            // Opponent hit the player ? START BATTLE
            if ( enemy.x === playerX &&
                 enemy.y === playerY )
            {
                var battleModel = this.getModel( BattleModel.NAME );
                battleModel.setOpponent( enemy );
                break;
            }
            else {
                // no interaction with the player ? store new Opponent position
                WorldCache.positions[ enemy.x + "-" + enemy.y ] = enemy;
            }
        }
    }
    this.done();
};
