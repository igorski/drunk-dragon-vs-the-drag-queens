module.exports = Menu;

var Inheritance = require( "zjslib" ).Inheritance;
var Event       = require( "zjslib" ).Event;
var Sprite      = require( "zjslib" ).Sprite;
var View        = require( "zmvc" ).View;

/**
 * @constructor
 * @extends {View}
 */
function Menu()
{
    Inheritance.super( this, "div" );
    this.setAttribute( "id", "menu" );
}

View.extend( Menu, View );

/* class constants */

/** @public @const @type {string} */ Menu.NAME   = "Menu";

/** @public @const @type {string} */ Menu.IMPORT = "M::0";
/** @public @const @type {string} */ Menu.EXPORT = "M::1";
/** @public @const @type {string} */ Menu.SAVE   = "M::2";
/** @public @const @type {string} */ Menu.CONFIG = "M::3";

/* class properties */

/** @protected @type {boolean} */ Menu.prototype._opened = false;
/** @protected @type {Sprite} */  Menu.prototype._toggleBTN;
/** @protected @type {Sprite} */  Menu.prototype._importBTN;
/** @protected @type {Sprite} */  Menu.prototype._exportBTN;
/** @protected @type {Sprite} */  Menu.prototype._configBTN;
/** @protected @type {Sprite} */  Menu.prototype._buttonContainer;

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
Menu.prototype.handleMenuToggle = function( aEvent )
{
    this._opened = !this._opened;

    if ( this._opened ) {
        this.addClass( "opened" );
    }
    else {
        this.removeClass( "opened" );
    }
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
Menu.prototype.handleSaveClick = function( aEvent )
{
    this.dispatchEvent( new Event( Menu.SAVE ));
    this.handleMenuToggle( aEvent );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
Menu.prototype.handleImportClick = function( aEvent )
{
    // inline handler to overcome blocking of the file
    // select popup by the browser

    var fileBrowser = new Sprite( "input" , { "type" : "file", "accept" : ".rpg" });

    var simulatedEvent = document.createEvent( "MouseEvent" );
    simulatedEvent.initMouseEvent( "click", true, true, window, 1,
                                   0, 0, 0, 0, false,
                                   false, false, false, 0, null );

    fileBrowser.getElement().dispatchEvent( simulatedEvent );

    fileBrowser.addEventListener( "change", function( e )
    {
        this.dispatchEvent( new Event( Menu.IMPORT, fileBrowser.getElement().files ));
        this.handleMenuToggle( aEvent );
        fileBrowser.dispose(); // clean up fileBrowser

    }.bind( this ));
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
Menu.prototype.handleExportClick = function( aEvent )
{
    this.dispatchEvent( new Event( Menu.EXPORT ));
    this.handleMenuToggle( aEvent );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
Menu.prototype.handleConfigClick = function( aEvent )
{
    this.dispatchEvent( new Event( Menu.CONFIG ));
    this.handleMenuToggle( aEvent );
};

/* protected methods */

/**
 * @override
 * @protected
 *
 * @return {obj}
 */
Menu.prototype.init = function()
{
    if ( this.initialized )
        return;

    Inheritance.super( this, "init" );

    this._toggleBTN = new Sprite( "div", { "id" : "toggle" });
    this.addChild( this._toggleBTN );

    this._toggleBTN.addEventListener( "click", this.handleMenuToggle.bind( this ));

    this._buttonContainer = new Sprite( "ul" );
    this.addChild( this._buttonContainer );

    this._saveBTN = new Sprite( "li", {}, "SAVE GAME");
    this._saveBTN.addEventListener( "click", this.handleSaveClick.bind( this ));
    this._buttonContainer.addChild( this._saveBTN );

    this._configBTN = new Sprite( "li", {}, "CONFIGURATION SETTINGS");
    this._configBTN.addEventListener( "click", this.handleConfigClick.bind( this ));
    this._buttonContainer.addChild( this._configBTN );

    this._importBTN = new Sprite( "li", {}, "IMPORT SAVE GAME");
    this._importBTN.addEventListener( "click", this.handleImportClick.bind( this ));
    this._buttonContainer.addChild( this._importBTN );

    this._exportBTN = new Sprite( "li", {}, "EXPORT SAVE GAME");
    this._exportBTN.addEventListener( "click", this.handleExportClick.bind( this ));
    this._buttonContainer.addChild( this._exportBTN );
};
