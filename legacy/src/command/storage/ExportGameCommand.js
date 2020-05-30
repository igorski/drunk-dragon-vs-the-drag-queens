module.exports = ExportGameCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameAssembler = require( "../../model/assemblers/GameAssembler" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );

/**
 * @constructor
 * @extends {Command}
 */
function ExportGameCommand()
{

}

Inheritance.extend( ExportGameCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
ExportGameCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "EXPORT GAME COMMAND" );

    var gameModel   = this.getModel( GameModel.NAME );
    var playerModel = this.getModel( PlayerModel.NAME );

    var data = GameAssembler.disassemble( gameModel, playerModel );

    // download file to disk

    var pom = document.createElement( "a" );
    pom.setAttribute( "href", "data:text/plain;charset=utf-8," + encodeURIComponent( data ));
    pom.setAttribute( "download", "savegame.rpg" );
    pom.click();

    this.done();
};
