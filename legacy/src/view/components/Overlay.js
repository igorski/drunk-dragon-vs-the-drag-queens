/**
 * Created by igorzinken on 06-03-15.
 */
module.exports = Overlay;

var Inheritance = require( "zjslib" ).Inheritance;
var Event       = require( "zjslib" ).Event;
var Sprite      = require( "zjslib" ).Sprite;
var View        = require( "zmvc" ).View;
var Copy        = require( "../../definitions/Copy" );

/**
 * @constructor
 * @extends {View}
 *
 * @param {string} aMessage text to display
 * @param {!Function=} aConfirmHandler optional callback to execute on confirmation
 * @param {!Function=} aCancelHandler optional callback to execute on cancellation
 * @param {string=} aOptConfirmText optional override of the confirmation button text
 * @param {string=} aOptCancelText optional override of the cancel button text
 * @param {boolean=} aOptCloseButton optional, add close button in overlays edge
 */
function Overlay( aMessage, aConfirmHandler, aCancelHandler, aOptConfirmText, aOptCancelText, aOptCloseButton )
{
    Inheritance.super( this );

    this.addClass( "overlay" );

    this._message        = aMessage;
    this._confirmText    = typeof aOptConfirmText === "string" ? aOptConfirmText : ( typeof aCancelHandler === "function" ? Copy.GENERAL.YES : Copy.GENERAL.OK );
    this._cancelText     = typeof aOptCancelText  === "string" ? aOptCancelText : Copy.GENERAL.NO;
    this._confirmHandler = aConfirmHandler;
    this._cancelHandler  = aCancelHandler;
    this._closeBTN       = typeof aOptCloseButton === "boolean" ? aOptCloseButton : false;
}

View.extend( Overlay, View );

/* class constants */

/** @public @const @type {string} */ Overlay.CLOSE = "C::0";

/* class properties */

/** @protected @type {string} */    Overlay.prototype._message;
/** @protected @type {!Function} */ Overlay.prototype._confirmHandler;
/** @protected @type {!Function} */ Overlay.prototype._cancelHandler;
/** @protected @type {Sprite} */    Overlay.prototype._confirmBTN;
/** @protected @type {Sprite} */    Overlay.prototype._cancelBTN;
/** @protected @type {string} */    Overlay.prototype._confirmText;
/** @protected @type {string} */    Overlay.prototype._cancelText;
/** @protected @type {string} */    Overlay.prototype._closeBTN;

/* protected methods */

/**
 * @override
 * @protected
 */
Overlay.prototype.init = function()
{
    if ( this.initialized )
        return;

    Inheritance.super( this, "init" );

    this.addChild( new Sprite( "p", null, this._message ));

    var doConfirm = typeof this._confirmHandler === "function";
    var doCancel  = typeof this._cancelHandler  === "function";

    if ( doConfirm )
    {
        var confirmButton = this._confirmBTN = new Sprite( "button", { "class" : "confirm" }, this._confirmText );

        this.addChild( confirmButton );
        confirmButton.addEventListener( "click", this._confirmHandler );
    }

    if ( doCancel )
    {
        var cancelButton = this._cancelBTN = new Sprite( "button", { "class" : "cancel" }, this._cancelText );

        this.addChild( cancelButton );
        cancelButton.addEventListener( "click", this._cancelHandler );
    }

    if ( this._closeBTN )
    {
        var closeButton = new Sprite( "button", { "class" : "close" }, "x" );

        this.addChild( closeButton );
        closeButton.addEventListener( "click", function( e )
        {
            this.dispatchEvent( new Event( Overlay.CLOSE ));

        }.bind( this ));
    }
};
