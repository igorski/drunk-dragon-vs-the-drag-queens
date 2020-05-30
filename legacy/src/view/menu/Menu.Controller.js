var Inheritance   = require( "zjslib" ).Inheritance;
var Sprite        = require( "zjslib" ).Sprite;
var Controller    = require( "zmvc" ).Controller;
var Notifications = require( "../../definitions/Notifications" );
var Menu          = require( "./Menu.View" );
var ConfigView    = require( "../config/Config.View" );

module.exports = MenuController;

/**
 * StageController acts as the Mediator for
 * document.body (e.g. the "application Stage")
 *
 * @constructor
 * @extends {Controller}
 */
function MenuController()
{

}

Controller.extend( MenuController, Controller );

/* public methods */

/**
 * @override
 * @public
 */
MenuController.prototype.init = function()
{
    Inheritance.super( this, "init" );
    this.addListeners();
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
MenuController.prototype.handleSave = function( aEvent )
{
    this.broadcast( Notifications.Storage.SAVE_GAME );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
MenuController.prototype.handleImport = function( aEvent )
{
    this.broadcast( Notifications.Storage.IMPORT_GAME, aEvent.value );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
MenuController.prototype.handleExport = function( aEvent )
{
    this.broadcast( Notifications.Storage.EXPORT_GAME );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
MenuController.prototype.handleConfig = function()
{
    this.broadcast( Notifications.Navigation.OPEN_PAGE, ConfigView );
};

/* protected methods */

/**
 * @protected
 */
MenuController.prototype.addListeners = function()
{
    this.view.addEventListener( Menu.IMPORT, this.handleImport.bind( this ));
    this.view.addEventListener( Menu.EXPORT, this.handleExport.bind( this ));
    this.view.addEventListener( Menu.SAVE,   this.handleSave.bind( this ));
    this.view.addEventListener( Menu.CONFIG, this.handleConfig.bind( this ));
};
