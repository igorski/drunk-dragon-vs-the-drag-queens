/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 08-03-15
 * Time: 10:13
 */
module.exports = BuyItemCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var Command       = require( "zmvc" ).Command;
var PlayerModel   = require( "../../model/PlayerModel" );
var ShopModel     = require( "../../model/ShopModel" );
var Notifications = require( "../../definitions/Notifications" );
var Copy          = require( "../../definitions/Copy" );
var ArrayUtil     = require( "zjslib" ).utils.ArrayUtil;
var Overlay       = require( "../../view/components/Overlay" );
var ItemFactory   = require( "../../model/factories/ItemFactory" );

/**
 * @constructor
 * @extends {Command}
 */
function BuyItemCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( BuyItemCommand, Command );

/* class properties */

/** @protected @type {ShopItem} */ BuyItemCommand.prototype._item;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
BuyItemCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "BUY ITEM COMMAND" );

    var itemIndex = typeof aMessageData === "number" ? aMessageData : 0;
    var shopModel = this.getModel( ShopModel.NAME );
    var shop      = shopModel.getShop();

    if ( shop && shop.items.length > itemIndex )
    {
        this._item = shop.items[ itemIndex ];

        // show overlay...
        var overlay = new Overlay( Copy.SHOP.CONFIRM_ITEM
                                       .replace( "{0}", ItemFactory.getItemName( this._item ))
                                       .replace( "{1}", this._item.price ),
                                   this.handleHPup.bind( this ),
                                   this.handleMPup.bind( this ));
        this.broadcast( Notifications.Navigation.OPEN_OVERLAY, overlay );
    }
    else {
        this.cancel();
    }
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
BuyItemCommand.prototype.handleHPup = function( aEvent )
{
    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );

    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    // can we actually pay for this item ?

    if ( player.inventory.money < this._item.price )
    {
        // we can't afford this item, DOH!

        this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.SHOP.CANNOT_AFFORD );
    }
    else
    {
        // yep, subtract money, add item to inventory and remove from Shop

        player.inventory.money -= this._item.price;
        player.inventory.items.push( this._item );

        var shop = this.getModel( ShopModel.NAME ).getShop();
        ArrayUtil.removeItem( shop.items, this._item );

        this.broadcast( Notifications.Player.UPDATE_STATUS );
        this.broadcast( Notifications.Shop.UPDATE_SHOP );
        this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.SHOP.ITEM_PURCHASED );
    }
    this.done();
};

/**
 * @protected
 *
 * @param {Event} aEvent
 * @return {obj}
 */
BuyItemCommand.prototype.handleMPup = function( aEvent )
{
    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );
    this.done();
};
