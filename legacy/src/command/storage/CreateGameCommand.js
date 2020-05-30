module.exports = CreateGameCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Player        = require( "../../model/vo/Player" );
var WorldFactory  = require( "../../model/factories/WorldFactory" );
var Notifications = require( "../../definitions/Notifications" );
var MD5           = require( "MD5" );

/**
 * @constructor
 * @extends {Command}
 */
function CreateGameCommand()
{

}

Inheritance.extend( CreateGameCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
CreateGameCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "CREATE GAME COMMAND" );

    var gameModel   = this.getModel( GameModel.NAME );
    var playerModel = this.getModel( PlayerModel.NAME );

    // generate unique hash for the world

    gameModel.hash = MD5( Date.now() + Math.random() );

    // set dates

    gameModel.created       = Date.now();
    gameModel.modified      = gameModel.created;
    gameModel.sessionStart  = gameModel.created;
    gameModel.lastSavedTime = -1;
    gameModel.totalTime     = 0;

    // create Player

    playerModel.setPlayer( new Player( "Hero", 1, 10, 10, 0 ));

    // ensure no Cave is left lingering from a previous session!
    gameModel.cave = null;

    // create World

    WorldFactory.create( gameModel, true );

    gameModel.invalidateWorld();
    gameModel.setGameState( true );

    this.done();
};
