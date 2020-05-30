/**
 * Created by igorzinken on 01-03-15.
 */
module.exports = EnterOvergroundCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var Notifications = require( "../../definitions/Notifications");
var GameModel     = require( "../../model/GameModel" );
var WorldView     = require( "../../view/world/World.View" );
var AudioTracks   = require( "../../definitions/AudioTracks" );
var SpriteCache   = require( "../../utils/SpriteCache" );

/**
 * @constructor
 * @extends {Command}
 */
function EnterOvergroundCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( EnterOvergroundCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
EnterOvergroundCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "ENTER OVERGROUND COMMAND" );

    var gameModel  = this.getModel( GameModel.NAME );
    gameModel.cave = null;  // we have left the Cave (if we were in one to begin with)

    if ( !gameModel.getGameState() )
        return this.done();  // game is over...

    gameModel.setEnemyAI( true );    // ensure AI updates regularly
    gameModel.cave = null;           // there should be no Cave in the model
    SpriteCache.CAVE_LEVEL.src = ""; // reset cave level cache

    // open world page
    this.broadcast( Notifications.Navigation.OPEN_PAGE, WorldView );

    // change music to overground theme
    this.broadcast( Notifications.Audio.PLAY_TRACK, AudioTracks.OVERGROUND_THEME );

    this.done();
};
