module.exports = StageController;

var Inheritance   = require( "zjslib" ).Inheritance;
var Sprite        = require( "zjslib" ).Sprite;
var Controller    = require( "zmvc" ).Controller;
var Notifications = require( "../definitions/Notifications" );

/**
 * StageController acts as the Mediator for
 * document.body (e.g. the "application Stage")
 *
 * @constructor
 * @extends {Controller}
 */
function StageController()
{
    Inheritance.super( this );
}
Controller.extend( StageController, Controller );

/* class properties */

/** @protected @type {Sprite} */ StageController.prototype._container;
/** @protected @type {Sprite} */ StageController.prototype._overlay;

/* public methods */

/**
 * @override
 * @public
 */
StageController.prototype.init = function()
{
    Inheritance.super( this, "init" );

    var theView = this.view;

    var theContainer = this._container = new Sprite( "div", { "class" : "application-wrapper centered" });
    theView.addChild( theContainer );
};

/**
 * @override
 * @public
 *
 * @return {Array.<string>}
 */
StageController.prototype.subscribe = function()
{
    return [

        Notifications.Navigation.OPEN_PAGE,
        Notifications.Navigation.OPEN_OVERLAY,
        Notifications.Navigation.CLOSE_OVERLAY,
        Notifications.System.BUSY_STATE_START,
        Notifications.System.BUSY_STATE_END

    ].concat( Inheritance.super( this, "subscribe" ));
};

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
StageController.prototype.onMessage = function( aMessageType, aMessageData )
{
    switch ( aMessageType )
    {
        case Notifications.Navigation.OPEN_PAGE:
            this.openPage( aMessageData );
            break;

        case Notifications.Navigation.OPEN_OVERLAY:
            this.openOverlay( aMessageData );
            break;

        case Notifications.Navigation.CLOSE_OVERLAY:
            this.openOverlay( null );
            break;

        case Notifications.System.BUSY_STATE_START:
            this.view.togglePreloader( true );
            break;

        case Notifications.System.BUSY_STATE_END:
            this.view.togglePreloader( false );
            break;
    }
};

/* protected methods */

/**
 * set the currently active View in the page container
 *
 * @protected
 *
 * @param {function(new: View)} aViewPage
 */
StageController.prototype.openPage = function( aViewPage )
{
    // remove previous page (TODO : animate out ?)
    while ( this._container.numChildren() > 0 )
    {
        var oldPage = this._container.removeChildAt( 0 );
        oldPage.dispose();
    }

    // add new page (TODO: animate in?)
    if ( aViewPage )
    {
        this._container.addChild( new aViewPage() );
    }
    else {
        // nowt...
    }
};

/**
 * @protected
 *
 * @param {Sprite} aOverlay
 */
StageController.prototype.openOverlay = function( aOverlay )
{
    if ( this._overlay )
    {
        this.view.removeChild( this._overlay ).dispose();
        this._overlay = null;
    }

    if ( aOverlay instanceof Sprite )
    {
        this.view.addChild( this._overlay = aOverlay );
    }
};
