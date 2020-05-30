module.exports = RestoreGameCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameAssembler = require( "../../model/assemblers/GameAssembler" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Opponent      = require( "../../model/vo/Opponent" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var Storage       = require( "store" );

/**
 * @constructor
 * @extends {Command}
 */
function RestoreGameCommand()
{

}

Inheritance.extend( RestoreGameCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
RestoreGameCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "RESTORE GAME COMMAND" );

    var gameModel   = this.getModel( GameModel.NAME );
    var playerModel = this.getModel( PlayerModel.NAME );

    var gameData = Storage.get( "game" );

    gameModel.sessionStart  = Date.now();
    gameModel.lastSavedTime = -1;

    if ( GameAssembler.assemble( gameModel, playerModel, gameData ))
    {
        this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.GAME_RESTORED );

        // resets enemies when returning / entering the world

        WorldCache.clearPositionsOfType( Opponent );

        this.broadcast( Notifications.Player.UPDATE_STATUS );
    }
    else
    {
        this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.GAME_CORRUPT );
        this.broadcast( Notifications.Storage.CREATE_NEW_GAME );
    }

    this.done()
};
