/**
 * Created by igorzinken on 28-02-15.
 */
module.exports = StartupCommand;

var Inheritance  = require( "zjslib" ).Inheritance;
var MacroCommand = require( "zmvc" ).MacroCommand;

function StartupCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( StartupCommand, MacroCommand );

/* protected methods */

/**
 * @override
 * @public
 */
StartupCommand.prototype.init = function()
{
    console.log( "STARTUP COMMAND" );

    this.addSubCommand( require( "./subcommands/PrepViewCommand" ));
    this.addSubCommand( require( "./subcommands/PrepBrowserCommand" ));
    this.addSubCommand( require( "./subcommands/PreloadAssetsCommand" ));
    this.addSubCommand( require( "./subcommands/PrepAudioCommand" ));
    this.addSubCommand( require( "./subcommands/StartApplicationCommand" ));
};
