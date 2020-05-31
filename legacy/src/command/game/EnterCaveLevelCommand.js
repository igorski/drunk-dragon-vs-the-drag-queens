/**
 * Created by igorzinken on 01-03-15.
 */
module.exports = EnterCaveLevelCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Notifications = require( "../../definitions/Notifications");
var GameModel     = require( "../../model/GameModel" );
var CaveView      = require( "../../view/cave/Cave.View" );

/**
 * @constructor
 * @extends {Command}
 */
function EnterCaveLevelCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( EnterCaveLevelCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
EnterCaveLevelCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "ENTER CAVE LEVEL COMMAND" );

    var gameModel = this.getModel( GameModel.NAME );

    if ( !gameModel.getGameState() )
        return this.done();  // game is over...

    var cave = gameModel.cave;

    // validate requested level

    var requestedLevel = typeof aMessageData === "number" ? Math.abs( aMessageData ) : 0;

    if ( isNaN( requestedLevel ))
        requestedLevel = 0;

    if ( requestedLevel >= cave.levels.length )
        requestedLevel = cave.levels.length - 1;

    gameModel.setEnemyAI( true );   // ensure AI updates regularly

    // get the coordinates of the current requestedLevel

    var currentLevel = cave.level;

    // if the requestedLevel has changed, set the requestedLevel

    if ( currentLevel !== requestedLevel )
    {
        cave.level = requestedLevel;

        var activeLevel = cave.levels[ cave.level ];

        // update the Caves properties to match the terrain dimensions of the current level

        cave.terrain = activeLevel.terrain;
        cave.width   = activeLevel.width;
        cave.height  = activeLevel.height;
        cave.x       = activeLevel.startX;
        cave.y       = activeLevel.startY;
    }

    // pre-render the caves terrain
    this.broadcast( Notifications.UI.RENDER_CAVE_LEVEL );

    // open cave page
    this.broadcast( Notifications.Navigation.OPEN_PAGE, CaveView );

    this.done();
};
