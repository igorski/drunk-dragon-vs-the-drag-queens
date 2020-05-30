/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 01-03-15
 * Time: 16:41
 */
module.exports = ValidateMoveCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Notifications = require( "../../definitions/Notifications" );
var BattleModel   = require( "../../model/BattleModel" );
var GameModel     = require( "../../model/GameModel" );
var ShopModel     = require( "../../model/ShopModel" );
var Player        = require( "../../model/vo/Player" );
var WorldCache    = require( "../../utils/worldCache" );

/**
 * @constructor
 * @extends {Command}
 */
function ValidateMoveCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( ValidateMoveCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
ValidateMoveCommand.prototype.execute = function( aMessageType, aMessageData )
{
    //console.log( "VALIDATE MOVE COMMAND" );

    // validate whether we can move to the target position

    var player = aMessageData.player;

    if ( this.validateMovement( player, null, aMessageData.axis, true ))
    {
        this.sanitizePosition( player, aMessageData.axis );
        this.hitTest( player );

        // use the StartMoveCommand to sanitize the next position
        this.broadcast( Notifications.Player.START_MOVEMENT, aMessageData );
    }
    this.done();
};

/* protected methods */

/**
 * if the Players movement is invalidated (e.g. trying to move to a blocked
 * position), the movement for the Player is halted
 *
 * @protected
 *
 * @param {Player} aPlayer
 * @param {Environment} aOptEnvironment optional environment to take coordinates from
 * @param {string=} aOptAxis optional axis to halt movement for in case
 *        movement for the Player is invalidated
 * @param {boolean=} checkGivenAxisOnly optional, whether to only check and invalidate
 *                   given axis aOptAxis
 * @return {boolean} whether movement was valid
 */
ValidateMoveCommand.prototype.validateMovement = function( aPlayer, aOptEnvironment, aOptAxis, checkGivenAxisOnly )
{
    // when undefined, the validate method will calculate the new offset
    // from the current Environment offset and the direction the Player is moving in

    var x = aOptEnvironment ? aOptEnvironment.x : undefined;
    var y = aOptEnvironment ? aOptEnvironment.y : undefined;

    // if we are to check against a given axis only we must know WHICH axis-position
    // might lead to an invalidation as we can then simply block that axis' movement
    // while keeping the other axis movement (if existing) intact

    var axisRequested = typeof aOptAxis === "string";
    /* // TODO : doesn't work yet...
    if ( checkGivenAxisOnly && axisRequested )
    {
        var env = this.getEnvironment();

        x = aOptAxis === "x" ? x : env.x;
        y = aOptAxis === "y" ? y : env.x;
    }
    */
    if ( !this.validate( aPlayer, x, y ))
    {
        if ( axisRequested )
        {
            // TODO : a "proposed fix" for the above TODO, it has been noticed that
            // when moving on two axes, the axis that was blocked is the other
            // axis than the one specified in "aOptAxis", is this a coincidence
            // or the golden rule ?

            var blockHorizontal = aOptAxis !== "x"; // basically "inverting" aOptAxis;

            aPlayer.haltMovement( blockHorizontal, true );
        }
        else {
            aPlayer.reset();
        }
        return false;
    }
    return true;
};

/**
 * @protected
 *
 * @param {Player} aPlayer
 * @param {number=} aOptX optional, specifies which x-coordinate to explicitly check
 * @param {number=} aOptY optional, specifies which y-coordinate yo explicitly check
 *
 * @return {boolean} whether the Player can move to this position
 */
ValidateMoveCommand.prototype.validate = function( aPlayer, aOptX, aOptY )
{
    var gameModel = this.getModel( GameModel.NAME );

    if ( !gameModel.getGameState() )
        return false;   // cannot move if game is inactive

    var env     = this.getEnvironment();
    var targetX = env.x, targetY = env.y;

    switch ( aPlayer.xDirection )
    {
        case Player.MOVE_LEFT:
            targetX = Math.max( 0, --targetX );
            break;

        case Player.MOVE_RIGHT:
            targetX = Math.min( env.width - 1, ++targetX );
            break;
    }

    switch ( aPlayer.yDirection )
    {
        case Player.MOVE_UP:
            targetY = Math.max( 0, --targetY );
            break;

        case Player.MOVE_DOWN:
            targetY = Math.min( env.height - 1, ++targetY );
            break;
    }

    if ( typeof aOptX === "number" ) targetX = aOptX;
    if ( typeof aOptY === "number" ) targetY = aOptY;

    // validate whether we can move to the target position

    return WorldCache.positionFree( env, targetX, targetY, true );
};


/* protected methods */

/**
 * @protected
 *
 * @param {Player} aPlayer
 * @return {boolean} whether we hit something
 */
ValidateMoveCommand.prototype.hitTest = function( aPlayer )
{
    // hit test : did we touch something ?
    var gameModel = this.getModel( GameModel.NAME );
    var world     = gameModel.world, cave = gameModel.cave;
    var inCave    = cave !== null && cave !== undefined;    // whether we're inside a cave or in the overground world
    var env       = inCave ? cave : world;

    var enemies = world.enemies;
    var shops   = world.shops;
    var caves   = world.caves;
    var hit;

    // each of these hits will open a new page / change world view

    if ( hit = internalHitTest( env.x, env.y, enemies ))
    {
        // hit an enemy, start battle !!
        var battleModel = this.getModel( BattleModel.NAME );
        battleModel.setOpponent( hit );
    }
    else if ( !inCave )
    {
        if ( hit = internalHitTest( env.x, env.y, shops ))
        {
            // entered shop, open the shop page
            var shopModel = this.getModel( ShopModel.NAME );

            shopModel.enterShop( hit, aPlayer );
        }
        else if ( hit = internalHitTest( env.x, env.y, caves ))
        {
            // entered cave

            gameModel.enterCave( hit, aPlayer );
        }
    }
    else if ( inCave )
    {
        var caveLevel = env.getActiveLevel();

        if ( hit = internalHitTest( env.x, env.y, caveLevel.exits ))
        {
            gameModel.enterCaveTunnel( hit, aPlayer );
        }
    }
    return hit !== null;
};

/**
 * check whether the Player currently has an offset in its given axis
 * (indicating it has been moving and has not completed a full tile)
 *
 * @protected
 *
 * @param {Player} aPlayer
 * @param {string} aAxis either "x" or "y"-axis
 * @return {boolean}
 */
ValidateMoveCommand.prototype.hasAxisMoved = function( aPlayer, aAxis )
{
    if ( aAxis === "x" && aPlayer.x !== 0 )
        return true;

    else if ( aAxis === "y" && aPlayer.y !== 0 )
        return true;

    return false;
};

/**
 * sanitize the Players position into a world coordinate (should only be invoked
 * when given axis has moved a single tile in distance)
 *
 * @protected
 *
 * @param {Player} aPlayer
 * @param {string} aAxis
 */
ValidateMoveCommand.prototype.sanitizePosition = function( aPlayer, aAxis )
{
    var env     = this.getEnvironment();
    var targetX = env.x, targetY = env.y;

    if ( aAxis === "x" )
    {
        switch ( aPlayer.xDirection )
        {
            case Player.MOVE_LEFT:
                targetX = Math.max( 0, --targetX );
                break;

            case Player.MOVE_RIGHT:
                targetX = Math.min( env.width - 1, ++targetX );
                break;
        }
        env.x     = targetX;
        aPlayer.x = 0;
    }
    else if ( aAxis === "y" )
    {
        switch ( aPlayer.yDirection )
        {
            case Player.MOVE_UP:
                targetY = Math.max( 0, --targetY );
                break;

            case Player.MOVE_DOWN:
                targetY = Math.min( env.height - 1, ++targetY );
                break;
        }
        env.y     = targetY;
        aPlayer.y = 0;
    }
};

/**
 * retrieve the Environment the Player is currently moving in
 *
 * @protected
 *
 * @return {Environment}
 */
ValidateMoveCommand.prototype.getEnvironment = function()
{
    var gameModel = this.getModel( GameModel.NAME );
    var world     = gameModel.world, cave = gameModel.cave;
    var inCave    = cave !== null && cave !== undefined;    // whether we're inside a cave or in the overground world

    return inCave ? cave : world;
};


function internalHitTest( x, y, collection )
{
    var i = collection.length, c;

    while ( i-- )
    {
        c = collection[ i ];

        if ( c.x === x && c.y === y )
            return c;
    }
    return null;
}
