/**
 * Created by igorzinken on 28-02-15.
 */
module.exports = StartApplicationCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var GameModel     = require( "../../../model/GameModel" );
var Notifications = require( "../../../definitions/Notifications" );
var Storage       = require( "store" );

function StartApplicationCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( StartApplicationCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*} aMessageData optional
 */
StartApplicationCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "START APPLICATION COMMAND" );

    if ( !Storage.get( "game" ))
    {
        // first run, create game
        this.broadcast( Notifications.Storage.CREATE_NEW_GAME );
    }
    else {
        // returning user, restore game
        this.broadcast( Notifications.Storage.RESTORE_GAME );
    }

    var gameModel = this.getModel( GameModel.NAME );
    gameModel.setAutoSave( true );

    // exit battle really being "enter world" in this case ...

    this.broadcast( Notifications.Game.RETURN_TO_WORLD );

    this.done();
};
