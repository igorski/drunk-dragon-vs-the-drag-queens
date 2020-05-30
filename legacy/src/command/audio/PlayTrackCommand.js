/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 22-03-15
 * Time: 11:18
 */
module.exports = PlayTrackCommand;

var Inheritance = require( "zjslib" ).Inheritance;
var Command     = require( "zmvc" ).Command;
var AudioModel  = require( "../../model/AudioModel" );

/**
 * @constructor
 * @extends {Command}
 */
function PlayTrackCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( PlayTrackCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
PlayTrackCommand.prototype.execute = function( aMessageType, aMessageData )
{
    var audioModel = this.getModel( AudioModel.NAME );

    if ( !audioModel.muted )
    {
        console.log( "PLAY TRACK COMMAND" );

        audioModel.playTrack( aMessageData ); // track Id is in the message data
    }
    this.done();
};
