module.exports = StatusController;

var Inheritance   = require( "zjslib" ).Inheritance;
var Sprite        = require( "zjslib" ).Sprite;
var Controller    = require( "zmvc" ).Controller;
var MVC           = require( "zmvc" ).MVC;
var PlayerModel   = require( "../../model/PlayerModel" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );

/**
 * @constructor
 */
function StatusController()
{

}

Controller.extend( StatusController, Controller );

/* class properties */

/** @protected @type {PlayerModel} */ StatusController.prototype._model;

/* public methods */

/**
 * @override
 * @public
 */
StatusController.prototype.subscribe = function()
{
    return [

        Notifications.Player.UPDATE_STATUS,
        Notifications.Player.EXPERIENCE_POINTS_AWARDED,
        Notifications.Player.STOLE_INVENTORY_ITEMS,
        Notifications.System.SHOW_MESSAGE

    ].concat( Inheritance.super( this, "subscribe" ));
};

/**
 * @override
 * @public
 */
StatusController.prototype.init = function()
{
    Inheritance.super( this, "init" );

    this._model = MVC.getModel( PlayerModel.NAME );
    this.updateStatus();
};

/**
 * invoked when the pubsub system has broadcast a
 * message that this Controller is interested in
 *
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
StatusController.prototype.onMessage = function( aMessageType, aMessageData )
{
    switch ( aMessageType )
    {
        case Notifications.Player.UPDATE_STATUS:
            this.updateStatus();
            break;

        case Notifications.Player.EXPERIENCE_POINTS_AWARDED:

            this.view.showMessage( Copy.XP_AWARDED.replace( "{0}", aMessageData ) );
            break;

        case Notifications.Player.STOLE_INVENTORY_ITEMS:

            aMessageData.forEach( function( aMessage )
            {
               this.view.showMessage( aMessage );

            }.bind( this ));
            break;

        case Notifications.System.SHOW_MESSAGE:
            this.view.showMessage( aMessageData );
            break;
    }
};

/* protected methods */

/**
 * @protected
 */
StatusController.prototype.updateStatus = function()
{
    var player = this._model.getPlayer();

    if ( player )
        this.view.updateStatus( player );
};
