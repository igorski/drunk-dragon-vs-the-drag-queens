/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 22-03-15
 * Time: 11:06
 */
module.exports = ConfigController;

var Inheritance   = require( "zjslib").Inheritance;
var Controller    = require( "zmvc" ).Controller;
var AudioModel    = require( "../../model/AudioModel" );
var GameModel     = require( "../../model/GameModel" );
var Notifications = require( "../../definitions/Notifications" );

/**
 * @constructor
 * @extends {Controller}
 */
function ConfigController()
{
    Inheritance.super( this );
}

Inheritance.extend( ConfigController, Controller );

/* public methods */

/**
 * @override
 * @public
 *
 * @return {Array<string>}
 */
ConfigController.prototype.subscribe = function()
{
    return [

    ].concat( Inheritance.super( this, "subscribe" ));
};

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
ConfigController.prototype.onMessage = function( aMessageType, aMessageData )
{
    switch ( aMessageType )
    {

    }
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
ConfigController.prototype.toggleMusic = function( aEvent )
{
    var audioModel   = this.getModel( AudioModel.NAME );
    audioModel.muted = !audioModel.muted;

    if ( !audioModel.muted ) {
        audioModel.play();
    }
    else {
        audioModel.stop();
    }
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
ConfigController.prototype.toggleAutoSave = function( aEvent )
{
    var gameModel = this.getModel( GameModel.NAME );

    gameModel.setAutoSave( !gameModel.autoSave );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
ConfigController.prototype.handleExit = function( aEvent )
{
    this.broadcast( Notifications.Game.RETURN_TO_WORLD );
};

/* protected methods */

/**
 * @override
 * @protected
 */
ConfigController.prototype.onInit = function()
{
    var audioModel = this.getModel( AudioModel.NAME );
    var gameModel  = this.getModel( GameModel.NAME );

    this.view.setData( !audioModel.muted, gameModel.autoSave );

    var clickEvent = "click";

    this.view.musicOption.addEventListener( clickEvent, this.toggleMusic.bind( this ));
    this.view.saveOption.addEventListener ( clickEvent, this.toggleAutoSave.bind( this ));
    this.view.exitBTN.addEventListener    ( clickEvent, this.handleExit.bind( this ));
};
