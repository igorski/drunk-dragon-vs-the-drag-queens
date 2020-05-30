/**
 * Created by igorzinken on 01-03-15.
 */
module.exports = EnterCaveCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var AudioTracks   = require( "../../definitions/AudioTracks");
var Notifications = require( "../../definitions/Notifications");
var GameModel     = require( "../../model/GameModel" );

/**
 * @constructor
 * @extends {Command}
 */
function EnterCaveCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( EnterCaveCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
EnterCaveCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "ENTER CAVE COMMAND" );

    var gameModel = this.getModel( GameModel.NAME );

    // enter cave at the right level
    this.broadcast( Notifications.Game.ENTER_CAVE_LEVEL, gameModel.cave.level );

    // change music to cave theme
    this.broadcast( Notifications.Audio.PLAY_TRACK, AudioTracks.CAVE_THEME );

    this.done();
};
