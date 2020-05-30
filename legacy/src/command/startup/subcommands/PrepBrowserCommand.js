module.exports = PrepBrowserCommand;

var Inheritance  = require( "zjslib" ).Inheritance;
var ScriptLoader = require( "zjslib" ).loaders.ScriptLoader;
var Command      = require( "zmvc" ).Command;

/**
 * @constructor
 * @extends {Command}
 */
function PrepBrowserCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( PrepBrowserCommand, Command );

/* class properties */

/** @protected @type {Array.<string>} */ PrepBrowserCommand.prototype._scripts;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*} aMessageData optional
 */
PrepBrowserCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "PREP BROWSER COMMAND" );

    this._scripts = []; // will hold optionally external scripts to patch missing functionalities

    this.processQueue();
};

/**
 * @protected
 */
PrepBrowserCommand.prototype.handleScriptError = function()
{
    console.log( "could not load script, halting startup..." );
};

/* protected methods */

/**
 * @protected
 */
PrepBrowserCommand.prototype.processQueue = function()
{
    if ( this._scripts.length > 0 )
    {
        ScriptLoader.load( this._scripts.shift(),
                           this.processQueue.bind( this ),
                           this.handleScriptError.bind( this ));
    }
    else {
        this.done();
    }
};
