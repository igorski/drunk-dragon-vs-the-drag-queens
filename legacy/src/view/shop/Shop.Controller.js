/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 06-03-15
 * Time: 17:36
 */
module.exports = ShopController;

var Inheritance   = require( "zjslib" ).Inheritance;
var Controller    = require( "zmvc" ).Controller;
var Notifications = require( "../../definitions/Notifications" );
var PlayerModel   = require( "../../model/PlayerModel" );
var ShopModel     = require( "../../model/ShopModel" );
var ShopView      = require( "./Shop.View" );

/**
 * @constructor
 * @extends {Controller}
 */
function ShopController()
{
    Inheritance.super( this );
}

Controller.extend( ShopController, Controller );

/* public methods */

/**
 * @override
 * @public
 */
ShopController.prototype.init = function()
{
    Inheritance.super( this, "init" );

    this.addListeners();

    this.showShopContents();
};

/**
 * @override
 * @public
 *
 * @return {Array.<string>}
 */
ShopController.prototype.subscribe = function()
{
    return [

        Notifications.Shop.UPDATE_SHOP

    ].concat( Inheritance.super( this, "subscribe" ));
};

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
ShopController.prototype.onMessage = function( aMessageType, aMessageData )
{
    switch ( aMessageType )
    {
        case Notifications.Shop.UPDATE_SHOP:
            this.showShopContents();
            break;
    }
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
ShopController.prototype.handleBuy = function( aEvent )
{
    this.broadcast( Notifications.Shop.BUY_ITEM, aEvent.value );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
ShopController.prototype.handleSell = function( aEvent )
{
    this.broadcast( Notifications.Shop.SELL_ITEM,

        aEvent.value );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
ShopController.prototype.handleExit = function( aEvent )
{
    this.broadcast( Notifications.Game.RETURN_TO_WORLD );
};

/* protected methods */

/**
 * @protected
 */
ShopController.prototype.addListeners = function(  )
{
    this.view.addEventListener        ( ShopView.BUY_ITEM,  this.handleBuy.bind( this ));
    this.view.addEventListener        ( ShopView.SELL_ITEM, this.handleSell.bind( this ));
    this.view.exitBTN.addEventListener( "click",            this.handleExit.bind( this ));
};

/**
 * @protected
 */
ShopController.prototype.showShopContents = function()
{
    var shopModel   = this.getModel( ShopModel.NAME );
    var playerModel = this.getModel( PlayerModel.NAME );

    this.view.setData( shopModel.getShop(), playerModel.getPlayer() );
};
