/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 08-03-15
 * Time: 10:13
 */
module.exports = RenderWorldCommand;

var Inheritance     = require( "zjslib" ).Inheritance;
var Command         = require( "zmvc" ).Command;
var zThreader       = require( "zThreader" ).zThreader;
var zThread         = require( "Zthreader" ).zThread;
var GameModel       = require( "../../model/GameModel" );
var World           = require( "../../model/vo/World" );
var Notifications   = require( "../../definitions/Notifications" );
var SpriteCache     = require( "../../utils/SpriteCache" );
var TerrainRenderer = require( "../../utils/TerrainRenderer" );
var WorldCache      = require( "../../utils/WorldCache" );
var ImageUtil       = require( "../../utils/ImageUtil" );

/**
 * @constructor
 * @extends {Command}
 */
function RenderWorldCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( RenderWorldCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
RenderWorldCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "RENDER WORLD COMMAND" );

    var gameModel  = this.getModel( GameModel.NAME );
    var world      = gameModel.world;
    var worldWidth = world.width, worldHeight = world.height;
    var tileWidth  = WorldCache.tileWidth;
    var tileHeight = WorldCache.tileHeight;
    var terrain    = world.terrain;

    this.broadcast( Notifications.UI.STATE_RENDER_START );
    this.broadcast( Notifications.System.BUSY_STATE_START );

    // setup Canvas for rendering
    
    var cvs = document.createElement( "canvas" );
    var ctx = cvs.getContext( "2d" );

    cvs.width  = tileWidth  * worldWidth;
    cvs.height = tileHeight * worldHeight;

    // we render the above coordinates, with addition of one extra
    // tile outside of the tiles (prevents blank screen during movement)

    var rl = 0, rr = worldWidth;
    var rt = 0, rb = worldHeight;

    var i, j, l, x, y, terrainTile;

    // use zThreader and zThreads as this can be quite a heavy operation

    zThreader.init( .65, 60 );

    var thread = new zThread( function()
    {
        // store the result

        // TODO : investigate https://github.com/imaya/CanvasTool.PngEncoder for 8-bit PNG ?

        SpriteCache.WORLD.src    = cvs.toDataURL( "image/png" );
        SpriteCache.WORLD.width  = cvs.width;
        SpriteCache.WORLD.height = cvs.height;

        ImageUtil.onReady( SpriteCache.WORLD, function()
        {
            this.broadcast( Notifications.UI.STATE_RENDER_COMPLETE );
            this.broadcast( Notifications.System.BUSY_STATE_END );
            this.done();

        }.bind( this ));

    }.bind( this ));

    // function to render the sprites onto the Canvas

    function render( aIteration )
    {
        // rows first

        for ( i = aIteration, l = aIteration + 1; i < l; ++i )    // a row
        {
            for ( j = rl; j < rr; ++j ) // all columns within a row
            {
                x = j * tileWidth;
                y = i * tileHeight;

                TerrainRenderer.drawTileForSurroundings( ctx, j, i, x, y, world, terrain );
            }
        }
    }

    // TODO : separate into individual tiles for mobile !!

    // here we define our own custom override of the ZThread internal execution handler to
    // render all columns of a single row, one by ony

    var MAX_ITERATIONS = rb;    // all rows
    var iterations     = rt - 1;

    thread._executeInternal = function()
    {
        // the amount of times we call the "render"-function
        // per iteration of the internal execution method
        var stepsPerIteration = 1;

        for ( var i = 0; i < stepsPerIteration; ++i )
        {
            if ( iterations >= MAX_ITERATIONS )
            {
                return true;
            }
            else {
                // execute operation (and increment iteration)
                render( ++iterations );
            }
        }
        return false;

    }.bind( this );

    thread.run();   // start crunching
};
