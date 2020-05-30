module.exports = CaveView;

var Inheritance  = require( "zjslib" ).Inheritance;
var EventHandler = require( "zjslib" ).EventHandler;
var Event        = require( "zjslib" ).Event;
var zCanvas      = require( "zcanvas" );
var WorldView    = require( "../world/World.View" );
var CaveRenderer = require( "./components/CaveRenderer" );

/**
 * @constructor
 * @extends {WorldView}
 */
function CaveView()
{
    Inheritance.super( this );
    this.setAttribute( "id", "cave" );
}

Inheritance.extend( CaveView, WorldView );

/* class constants */

/** @public @const @type {string} */ CaveView.NAME = "CaveView";

/* public methods */

/**
 * @public
 *
 * @param {Environment} aEnvironment
 * @param {Player} aPlayer
 */
CaveView.prototype.renderEnvironment = function( aEnvironment, aPlayer )
{
    if ( !this.renderer.canvas )
        this._canvas.addChild( this.renderer );

    this.renderer.renderCave( aEnvironment, aPlayer );
    this._player = aPlayer;
};

/* protected methods */

/**
 * @protected
 */
CaveView.prototype.init = function()
{
    this._canvas = new zCanvas.canvas( 100, 100, true, 60 );
    this._canvas.setBackgroundColor( "#000000" );
    this._canvas.setSmoothing( false );
    this._canvas.insertInPage( this._element );

    this.renderer = new CaveRenderer( 100, 100 );
    // renderer is added when spritesheet is ready

    // resize to match device / browser dimensions
    this.handleResize( null );

    this._handler = new EventHandler();
    var resizeEvent = "onorientationchange" in window ? "orientationchange" : "resize";

    this._handler.addEventListener( window, "keydown",   this.handleKeyDown.bind( this ));
    this._handler.addEventListener( window, "keyup",     this.handleKeyUp.bind  ( this ));
    this._handler.addEventListener( window, resizeEvent, this.handleResize.bind ( this ));
};
