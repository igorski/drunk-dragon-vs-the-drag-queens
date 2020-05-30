module.exports = WorldView;

var Inheritance   = require( "zjslib" ).Inheritance;
var EventHandler  = require( "zjslib" ).EventHandler;
var Event         = require( "zjslib" ).Event;
var zCanvas       = require( "zcanvas" );
var View          = require( "zmvc" ).View;
var WorldRenderer = require( "./components/WorldRenderer" );
var Player        = require( "../../model/vo/Player" );
var WorldCache    = require( "../../utils/WorldCache" );

/**
 * @constructor
 * @extends {View}
 */
function WorldView()
{
    Inheritance.super( this, "div" );
    this.setAttribute( "id", "world" );
}

View.extend( WorldView, View );

/* class constants */

/** @public @const @type {string} */ WorldView.NAME = "WorldView";

/* class properties */

/** @public @type {WorldRenderer} */   WorldView.prototype.renderer;
/** @protected @type {EventHandler} */ WorldView.prototype._handler;
/** @protected @type {zCanvas} */      WorldView.prototype._canvas;

/* public methods */

/**
 * @public
 *
 * @param {Environment} aEnvironment
 * @param {Player} aPlayer
 */
WorldView.prototype.renderEnvironment = function( aEnvironment, aPlayer )
{
    if ( !this.renderer.canvas )
        this._canvas.addChild( this.renderer );

    this.renderer.renderWorld( aEnvironment, aPlayer );
    this._player = aPlayer;
};

/* event handlers */

/**
 * @protected
 *
 * @param {KeyboardEvent} aEvent
 */
WorldView.prototype.handleKeyDown = function( aEvent )
{
    var preventDefault = false;

    switch ( aEvent.keyCode )
    {
        case 37:    // left
            this._player.move( Player.MOVE_LEFT );
            preventDefault = true;
            break;

        case 39:    // right
            this._player.move( Player.MOVE_RIGHT );
            preventDefault = true;
            break;

        case 38:    // up
            this._player.move( Player.MOVE_UP );
            preventDefault = true;
            break;

        case 40:    // down
            this._player.move( Player.MOVE_DOWN );
            preventDefault = true;
            break;
    }
    if ( preventDefault )
        aEvent.preventDefault();
};

/**
 * @protected
 *
 * @param {KeyboardEvent} aEvent
 */
WorldView.prototype.handleKeyUp = function( aEvent )
{
    switch ( aEvent.keyCode )
    {
        case 37:    // left
            this._player.stop( Player.MOVE_LEFT );
            break;

        case 39:    // right
            this._player.stop( Player.MOVE_RIGHT );
            break;

        case 38:    // up
            this._player.stop( Player.MOVE_UP );
            break;

        case 40:    // down
            this._player.stop( Player.MOVE_DOWN );
            break;
    }
};

/**
 * invoked whenever the browser window is resizd
 *
 * @protected
 *
 * @param {Event} aEvent
 */
WorldView.prototype.handleResize = function( aEvent )
{
    var windowWidth  = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;

    // we want at least 9 horizontal tiles please
    var tilesInWidth  = WorldCache.tileWidth * ( windowWidth > 800 ? 15 : 9 );
    var tilesInHeight = Math.round(( windowHeight / windowWidth ) * tilesInWidth );

    this._canvas.setDimensions( tilesInWidth, tilesInHeight );

    // scale up using CSS

    var xScale = windowWidth  / tilesInWidth;
    var yScale = windowHeight / tilesInHeight;

    this._canvas.getElement().style[ "-webkit-transform" ] = "scale(" + xScale + ", " + yScale + ")";
    this._canvas.getElement().style[ "transform" ]         = "scale(" + xScale + ", " + yScale + ")";

    this.renderer.setTileDimensions( tilesInWidth, tilesInHeight );

    // nope, keep at given dimensions mentioned above
    /*
    this._canvas.setDimensions( windowWidth, windowHeight );
    this.renderer.updateImage ( null, windowWidth, windowHeight );
    */
};

/* protected methods */

/**
 * @protected
 */
WorldView.prototype.init = function()
{
    Inheritance.super( this, "init" );

    this._canvas = new zCanvas.canvas( 100, 100, true, 60 );
    this._canvas.setSmoothing( false );
    this._canvas.insertInPage( this._element );

    this.renderer = new WorldRenderer( 100, 100 );
    // renderer is added when spritesheet is ready

    // resize to match device / browser dimensions
    this.handleResize( null );

    this._handler = new EventHandler();
    var resizeEvent = "onorientationchange" in window ? "orientationchange" : "resize";

    this._handler.addEventListener( window, "keydown",   this.handleKeyDown.bind( this ));
    this._handler.addEventListener( window, "keyup",     this.handleKeyUp.bind  ( this ));
    this._handler.addEventListener( window, resizeEvent, this.handleResize.bind ( this ));
};

/**
 * @override
 * @protected
 */
WorldView.prototype.disposeInternal = function()
{
    this._handler.dispose();
    this._canvas.dispose();
    this.renderer.dispose();

    Inheritance.super( this, "disposeInternal" );
};
