var Inheritance     = require( "zjslib" ).Inheritance;
var Sprite          = require( "zjslib" ).Sprite;
var WorldController = require( "../world/World.Controller" );
var Notifications   = require( "../../definitions/Notifications" );
var GameModel       = require( "../../model/GameModel" );
var PlayerModel     = require( "../../model/PlayerModel" );
var WorldView       = require( "../world/World.View" );
var ImageUtil       = require( "../../utils/ImageUtil" );
var SpriteCache     = require( "../../utils/SpriteCache" );
module.exports = CaveController;

/**
 * CaveController acts as the Mediator for
 * document.body (e.g. the "application World")
 *
 * @constructor
 * @extends {Controller}
 */
function CaveController()
{
    Inheritance.super( this );
}

Inheritance.extend( CaveController, WorldController );

/* protected methods */

/**
 * @override
 * @protected
 */
CaveController.prototype.onInit = function()
{
    if ( ImageUtil.isReady( SpriteCache.CAVE_LEVEL ))
        this.startRendering();
};

/**
 * @override
 * @protected
 */
CaveController.prototype.startRendering = function()
{
    this.view.renderEnvironment( this.getModel( GameModel.NAME ).cave,
                                 this.getModel( PlayerModel.NAME ).getPlayer() );
};
