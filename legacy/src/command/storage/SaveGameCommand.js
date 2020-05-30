module.exports = SaveGameCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameAssembler = require( "../../model/assemblers/GameAssembler" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var TimeUtil      = require( "../../utils/TimeUtil" );
var Storage       = require( "store" );

/**
 * @constructor
 * @extends {Command}
 */
function SaveGameCommand()
{

}

Inheritance.extend( SaveGameCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
SaveGameCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "SAVE GAME COMMAND" );

    var gameModel   = this.getModel( GameModel.NAME );
    var playerModel = this.getModel( PlayerModel.NAME );

    // don't save if the game is over!

    if ( !gameModel.getGameState() )
        return this.cancel();

    var time = gameModel.lastSavedTime > -1 ? gameModel.lastSavedTime : gameModel.sessionStart;

    gameModel.modified      = Date.now();
    gameModel.totalTime    += ( gameModel.modified - time );
    gameModel.lastSavedTime = gameModel.modified;

    console.log( "total play time > " + TimeUtil.msToString( gameModel.totalTime ));

    var gameData = GameAssembler.disassemble( gameModel, playerModel );

    Storage.set( "game", gameData );

    this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.GAME_SAVED );
    this.done();
};
