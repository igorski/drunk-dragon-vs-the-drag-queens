/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 01-03-15
 * Time: 16:41
 */
module.exports = StopMoveCommand;

var Inheritance         = require( "zjslib" ).Inheritance;
var ValidateMoveCommand = require( "./ValidateMoveCommand" );
var GameModel           = require( "../../model/GameModel" );
var Player              = require( "../../model/vo/Player" );
var WorldCache          = require( "../../utils/worldCache" );

/**
 * @constructor
 * @extends {ValidateMoveCommand}
 */
function StopMoveCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( StopMoveCommand, ValidateMoveCommand );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
StopMoveCommand.prototype.execute = function( aMessageType, aMessageData )
{
    var player = aMessageData.player;
    var axis   = aMessageData.axis;

    if ( player.axisLocked( axis ) || !this.validate( player ))
        return this.done();

    //console.log( "STOP MOVE COMMAND" );

    var oldDirection  = aMessageData.dir;
    var env           = this.getEnvironment();
    var tweenProperty = axis,  tweenValue = -WorldCache.tileWidth;
    var targetX       = env.x, targetY = env.y;
    var oldX          = targetX, oldY = targetY;

    switch ( oldDirection )
    {
        case Player.MOVE_LEFT:
            targetX = Math.max( 0, --targetX );
            break;

        case Player.MOVE_RIGHT:
            targetX    = Math.min( env.width - 1, ++targetX );
            tweenValue = Math.abs( tweenValue );
            break;

        case Player.MOVE_UP:
            targetY    = Math.max( 0, --targetY );
            tweenValue = -WorldCache.tileHeight;
            break;

        case Player.MOVE_DOWN:
            targetY    = Math.min( env.height - 1, ++targetY );
            tweenValue = WorldCache.tileHeight;
            break;
    }

    var commitChanges = function()
    {
        // commit the changes in position

        if ( axis === "x" )
        {
            env.x     = targetX;
            player.x = 0; //player.x -= tweenValue;

            player.xLocked = false;
        }
        else if ( axis === "y" )
        {
            env.y     = targetY;
            player.y = 0;//player.y -= tweenValue;

            player.yLocked = false;
        }

        // unlock player and complete command

        this.hitTest( player );
        this.validateMovement( player, env, axis );
        this.done();  // complete command

    }.bind( this );

    if ( this.hasAxisMoved( player, axis ))
    {
        //console.log( "MOVE STOP TWEEN" );

        player.haltMovement( axis === "x" ); // halt movement for given axis

        // if the Player pressed a direction and released it, complete a single step

        var tweenOptions =
        {
            "ease" : Linear.easeNone,//Cubic.easeOut,
            "onComplete" : commitChanges
        };

        tweenOptions[ tweenProperty ] = tweenValue; // the "final resting position"

        var totalTime = .35;
        var delta     = Math.abs( player[ tweenProperty ] - tweenValue );

        // we'll temporarily lock the movement of the player
        // until the move in the old direction has finished

        if ( axis === "x" )
            player.xLocked = true;
        else
            player.yLocked = true;

        TweenLite.to( player, Math.abs( totalTime / tweenValue * delta ), tweenOptions );
    }
    else {
        player.haltMovement( axis === "x" ); // halt movement for given axis
        this.done();
    }
};
