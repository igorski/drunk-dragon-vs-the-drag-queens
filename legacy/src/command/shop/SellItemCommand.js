/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 08-03-15
 * Time: 10:13
 */
module.exports = SellItemCommand;

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
function SellItemCommand()
{
    Inheritance.super( this );
}

Inheritance.extend( SellItemCommand, Command );

/* class properties */

/** @protected @type {ShopItem} */ SellItemCommand.prototype._item;

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType the message id
 * @param {*=} aMessageData optional message data
 */
SellItemCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "SELL ITEM COMMAND" );

    var itemIndex   = typeof aMessageData === "number" ? aMessageData : 0;
    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    if ( player.inventory.hasItems() && player.inventory.items.length > itemIndex )
    {
        this._item = player.inventory.items[ itemIndex ];

        // show overlay...
        var overlay = new Overlay( Copy.SHOP.CONFIRM_SELL
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
SellItemCommand.prototype.handleHPup = function( aEvent )
{
    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );

    var playerModel = this.getModel( PlayerModel.NAME );
    var player      = playerModel.getPlayer();

    // award money, remove item from inventory and add to Shop

    player.inventory.money += this._item.price;
    ArrayUtil.removeItem( player.inventory.items, this._item );

    var shop = this.getModel( ShopModel.NAME ).getShop();
    shop.items.push( this._item );

    this.broadcast( Notifications.Player.UPDATE_STATUS );
    this.broadcast( Notifications.Shop.UPDATE_SHOP );
    this.broadcast( Notifications.System.SHOW_MESSAGE, Copy.SHOP.ITEM_SOLD );

    this.done();
};

/**
 * @protected
 *
 * @param {Event} aEvent
 * @return {obj}
 */
SellItemCommand.prototype.handleMPup = function( aEvent )
{
    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );
    this.done();
};
