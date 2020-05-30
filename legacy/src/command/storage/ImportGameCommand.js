module.exports = ImportGameCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameAssembler = require( "../../model/assemblers/GameAssembler" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var Storage       = require( "store" );

/**
 * @constructor
 * @extends {Command}
 */
function ImportGameCommand()
{

}

Inheritance.extend( ImportGameCommand, Command );

/* class properties */

/** @protected @type {Element} */ ImportGameCommand.prototype._fileBrowser;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
ImportGameCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "IMPORT GAME COMMAND" );

    // aMessageData is FileList

    if ( aMessageData instanceof FileList )
    {
        var file   = aMessageData[ 0 ];
        var reader = new FileReader();

        var gameModel   = this.getModel( GameModel.NAME );
        var playerModel = this.getModel( PlayerModel.NAME );

        reader.onload = function( e )
        {
            var fileData = e.target.result;

            if ( GameAssembler.assemble( gameModel, playerModel, fileData ))
            {
                gameModel.sessionStart  = Date.now();
                gameModel.lastSavedTime = -1;

                this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.GAME_IMPORTED );
                this.broadcast( Notifications.Player.UPDATE_STATUS );
                Storage.set( "game", fileData ); // overwrite existing saved game
            }
            else
            {
                this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.GAME_CORRUPT );
            }
            this.done();

        }.bind( this );
        // start reading file contents
        reader.readAsText( file );
    }
    else {
        this.done();
    }
};
