module.exports = PrepAudioCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var ScriptLoader  = require( "zjslib" ).loaders.ScriptLoader;
var Command       = require( "zmvc" ).Command;
var AudioModel    = require( "../../../model/AudioModel" );
var Notifications = require( "../../../definitions/Notifications" );

/**
 * @constructor
 * @extends {Command}
 */
function PrepAudioCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( PrepAudioCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*} aMessageData optional
 */
PrepAudioCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "PREP AUDIO COMMAND" );

    // load SoundCloud SDK

    ScriptLoader.load( "https://connect.soundcloud.com/sdk.js",

        // success handler

        function()
        {
            console.log( "SoundCloud SDK loaded successfully" );
            this.broadcast( Notifications.System.BUSY_STATE_END );
            this.done();

        }.bind( this ),

        // error handler

        function()
        {
            console.log( "Error occurred during loading of SoundCloud SDK, continuing without sound" );
            this.broadcast( Notifications.System.BUSY_STATE_END );
            this.done();

        }.bind( this )
    );
    this.broadcast( Notifications.System.BUSY_STATE_START );
};
