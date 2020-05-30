module.exports = PreloadAssetsCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Sprite        = require( "zjslib" ).Sprite;
var ImageLoader   = require( "zjslib" ).loaders.ImageLoader;
var Command       = require( "zmvc" ).Command;
var MVC           = require( "zmvc" ).MVC;
var Config        = require( "../../../config/Config" );
var SpriteCache   = require( "../../../utils/SpriteCache" );
var Notifications = require( "../../../definitions/Notifications" );

/**
 * @constructor
 * @extends {Command}
 */
function PreloadAssetsCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( PreloadAssetsCommand, Command );

/* class properties */

/** @protected @type {Array.<string>} */     PreloadAssetsCommand.prototype._queue;
/** @protected @type {lib.display.Sprite} */ PreloadAssetsCommand.prototype._loadContainer;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*} aMessageData optional
 */
PreloadAssetsCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "PRELOAD ASSETS COMMAND" );

    // we create a container (positioned off-screen) to append the images to, this is to
    // overcome mobile browsers not actually loading the Images until they are inside the DOM and
    // no, we cannot add it to a display:none; -container !

    this._loadContainer = new Sprite( "div" );
    this._loadContainer.setStyles({ "position" : "absolute",
                                    "left"     : "-9999px",
                                    "top"      : "0" } );

    document.body.appendChild( this._loadContainer.getElement() );

    // all editor assets

    var assetRoot = Config.getBaseURL() + "assets/sprites/";
    this._queue   = [
        { "src" : assetRoot + "cave.png",  "target" : SpriteCache.CAVE },
        { "src" : assetRoot + "rock.png",  "target" : SpriteCache.ROCK },
        { "src" : assetRoot + "sand.png",  "target" : SpriteCache.SAND },
        { "src" : assetRoot + "grass.png", "target" : SpriteCache.GRASS },
        { "src" : assetRoot + "tree.png",  "target" : SpriteCache.TREE },
        { "src" : assetRoot + "water.png", "target" : SpriteCache.WATER },
        { "src" : assetRoot + "drone.png", "target" : SpriteCache.DRONE },
        { "src" : assetRoot + "hero.png",  "target" : SpriteCache.HERO }
    ];

    this.broadcast( Notifications.System.BUSY_STATE_START );
    this.processQueue();
};

/* protected methods */

/**
 * @protected
 */
PreloadAssetsCommand.prototype.processQueue = function()
{
    if ( this._queue.length === 0 )
    {
        // queue complete, remove temporary container and complete command

        document.body.removeChild( this._loadContainer.getElement() );

        this.broadcast( Notifications.System.BUSY_STATE_END );
        this.done();
    }
    else
    {
        var asset = this._queue.shift();

        var image         = asset.target;
        image.crossOrigin = "anonymous";
        this._loadContainer.addElement( image );

        ImageLoader.load( asset.src, this.processQueue.bind( this ), image );
    }
};
