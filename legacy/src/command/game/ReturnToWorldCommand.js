/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 09-03-15
 * Time: 19:28
 */
module.exports = ReturnToWorldCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Notifications = require( "../../definitions/Notifications" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );

/**
 * @constructor
 * @extends {Command}
 */
function ReturnToWorldCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( ReturnToWorldCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
ReturnToWorldCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "RETURN TO WORLD COMMAND" );

    // reset player movement

    var player = this.getModel( PlayerModel.NAME ).getPlayer();
    player.reset();

    // determine whether we're going to the overground or are inside a cave !!

    var model = this.getModel( GameModel.NAME );

    if ( model.cave )
    {
        this.broadcast( Notifications.Game.ENTER_CAVE );
    }
    else {
        this.broadcast( Notifications.Game.ENTER_OVERGROUND );
    }
    this.done();
};
