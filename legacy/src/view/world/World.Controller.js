var Inheritance   = require( "zjslib" ).Inheritance;
var Sprite        = require( "zjslib" ).Sprite;
var Controller    = require( "zmvc" ).Controller;
var Notifications = require( "../../definitions/Notifications" );
var GameModel     = require( "../../model/GameModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var WorldView     = require( "./World.View" );
var ImageUtil     = require( "../../utils/ImageUtil" );
var SpriteCache   = require( "../../utils/SpriteCache" );

module.exports = WorldController;

/**
 * WorldController acts as the Mediator for
 * document.body (e.g. the "application World")
 *
 * @constructor
 * @extends {Controller}
 */
function WorldController()
{
    Inheritance.super( this );
}

Controller.extend( WorldController, Controller );

/* class properties */

/** @protected @type {Player} */ WorldController.prototype._player;

/* public methods */

/**
 * @override
 * @public
 *
 * @return {Array.<string>}
 */
WorldController.prototype.subscribe = function()
{
    return [

        Notifications.UI.STATE_RENDER_COMPLETE

    ].concat( Inheritance.super( this, "subscribe" ));
};

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
WorldController.prototype.onMessage = function( aMessageType, aMessageData )
{
    switch ( aMessageType )
    {
        case Notifications.UI.STATE_RENDER_COMPLETE:
            this.startRendering();
            break;
    }
};

/* protected methods */

/**
 * @override
 * @protected
 */
WorldController.prototype.onInit = function()
{
    if ( ImageUtil.isReady( SpriteCache.WORLD ))
        this.startRendering();
};

/**
 * @protected
 */
WorldController.prototype.startRendering = function()
{
    this.view.renderEnvironment( this.getModel( GameModel.NAME ).world,
                                 this.getModel( PlayerModel.NAME ).getPlayer() );
};
