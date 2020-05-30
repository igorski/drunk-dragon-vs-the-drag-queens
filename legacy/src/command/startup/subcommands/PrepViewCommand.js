module.exports = PrepViewCommand;

var Inheritance = require( "zjslib" ).Inheritance;
var Command     = require( "zmvc" ).Command;
var MVC         = require( "zmvc" ).MVC;
var MenuView    = require( "../../../view/Menu/Menu.View" );
var WorldView   = require( "../../../view/world/World.View" );
var StatusView  = require( "../../../view/Status/Status.View" );

/**
 * @constructor
 * @extends {Command}
 */
function PrepViewCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( PrepViewCommand, Command );

/* class properties */

/** @protected @type {Array.<string>} */ PrepViewCommand.prototype._scripts;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*} aMessageData optional
 */
PrepViewCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "PREP VIEW COMMAND" );

    // prepare UI

    MVC.stage.addChild( new MenuView() );
    MVC.stage.addChild( new StatusView() );

    this.done();
};
