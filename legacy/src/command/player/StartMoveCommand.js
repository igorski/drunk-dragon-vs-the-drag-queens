/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 01-03-15
 * Time: 16:41
 */
module.exports = StartMoveCommand;

var Inheritance         = require( "zjslib" ).Inheritance;
var ValidateMoveCommand = require( "./ValidateMoveCommand" );
var Notifications       = require( "../../definitions/Notifications" );
var GameModel           = require( "../../model/GameModel" );
var Player              = require( "../../model/vo/Player" );
var WorldCache          = require( "../../utils/worldCache" );

/**
 * @constructor
 * @extends {ValidateMoveCommand}
 */
function StartMoveCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( StartMoveCommand, ValidateMoveCommand );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
StartMoveCommand.prototype.execute = function( aMessageType, aMessageData )
{
    var player = aMessageData.player;
    var axis   = aMessageData.axis;

    if ( player.axisLocked( axis ))
        return this.done();

    //console.log( "START MOVE COMMAND" );

    var env           = this.getEnvironment();
    var tweenProperty = axis;
    var targetX       = env.x, targetY = env.y;
    var isHorizontal  = tweenProperty === "x";

    // pre-calculate the request position

    if ( isHorizontal )
    {
        switch ( player.xDirection )
        {
            case Player.MOVE_LEFT:
                targetX = Math.max( 0, --targetX );
                break;

            case Player.MOVE_RIGHT:
                targetX = Math.min( env.width - 1, ++targetX );
                break;
        }
    }
    else
    {
        switch ( player.yDirection )
        {
            case Player.MOVE_UP:
                targetY = Math.max( 0, --targetY );
                break;

            case Player.MOVE_DOWN:
                targetY = Math.min( env.height - 1, ++targetY );
                break;
        }
    }

    // can we move to the requested position ?

    if ( !this.validate( player, targetX, targetY ))
    {
        // deny request to move
        player.haltMovement( isHorizontal );
    }
    else {
        // add minimum offset (ensures StopMoveCommand can complete a single tile movement on quick releases)
        if ( isHorizontal )
            player.x = 0.0001;
        else
            player.y = 0.0001;
    }
    this.done();
};
