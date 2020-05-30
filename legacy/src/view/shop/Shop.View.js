/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 06-03-15
 * Time: 17:34
 */
module.exports = ShopView;

var Inheritance   = require( "zjslib" ).Inheritance;
var Event         = require( "zjslib" ).Event;
var Sprite        = require( "zjslib" ).Sprite;
var View          = require( "zmvc" ).View;
var Copy          = require( "../../definitions/Copy" );
var ItemTypes     = require( "../../definitions/ItemTypes" );
var ItemFactory   = require( "../../model/factories/ItemFactory" );

/**
 * @constructor
 * @extends {View}
 */
function ShopView()
{
    Inheritance.super( this, "div" );
    this.setAttribute( "id", "shop" );
}

View.extend( ShopView, View );

/* class constants */

/** @public @const @type {string} */ ShopView.NAME      = "ShopView";
/** @public @const @type {string} */ ShopView.BUY_ITEM  = "SV::0";
/** @public @const @type {string} */ ShopView.SELL_ITEM = "SV::1";

/* class properties */

/** @public @type {Sprite} */ ShopView.prototype.buyContainer;
/** @public @type {Sprite} */ ShopView.prototype.sellContainer;
/** @public @type {Sprite} */ ShopView.prototype.exitBTN;

/* public methods */

/**
 * @public
 *
 * @param {Shop} aShop
 * @param {Player} aPlayer
 */
ShopView.prototype.setData = function( aShop, aPlayer )
{
    var item, itemName;

    while ( this.buyContainer.numChildren() > 0 )
        this.buyContainer.removeChildAt( 0 ).dispose();

    while ( this.sellContainer.numChildren() > 0 )
        this.sellContainer.removeChildAt( 0 ).dispose();

    // what can we buy ?

    var index = -1;

    aShop.items.forEach( function( aShopItem )
    {
        itemName = ItemFactory.getItemName( aShopItem );
        item     = new Sprite( "li", { "class" : "item" }, itemName + " $ " + aShopItem.price );

        item.setDataAttribute( "index", ( ++index ).toString() );
        item.addEventListener( "click", function( e )
        {
            this.dispatchEvent( new Event( ShopView.BUY_ITEM,
                                parseInt( e.target.getDataAttribute( "index" ), 10 ) ));

        }.bind( this ));

        this.buyContainer.addChild( item );

    }.bind( this ));

    // can we sell stuff ?

    if ( aPlayer.inventory.hasItems() )
    {
        index = -1;
        this.sellContainer.show();
        this.sellContainer.addChild( new Sprite( "li", {}, Copy.SHOP.SELLABLE_ITEMS ));

        aPlayer.inventory.items.forEach( function( aInventoryItem )
        {
            aInventoryItem.price = ItemFactory.generateItemPrice( aInventoryItem, aPlayer );

            itemName = ItemFactory.getItemName( aInventoryItem );
            item     = new Sprite( "li", { "class" : "item" }, itemName + " $ " + aInventoryItem.price );

            item.setDataAttribute( "index", ( ++index ).toString() );
            item.addEventListener( "click", function( e )
            {
                this.dispatchEvent( new Event( ShopView.SELL_ITEM,
                                    parseInt( e.target.getDataAttribute( "index" ), 10 ) ));

            }.bind( this ));

            this.sellContainer.addChild( item );

        }.bind( this ));
    }
    else {
        this.sellContainer.hide();
    }
};

/* protected methods */

/**
 * @override
 * @protected
 */
ShopView.prototype.init = function()
{
    Inheritance.super( this, "init" );

    this.addChild( new Sprite( "h3", { "class" : "title" }, Copy.SHOP.WELCOME ));

    this.buyContainer = new Sprite( "ul", { "class" : "items" }, Copy.SHOP.BUYABLE_ITEMS );
    this.addChild( this.buyContainer );

    this.sellContainer = new Sprite( "ul", { "class" : "items" });
    this.addChild( this.sellContainer );

    var container = new Sprite( "ul", { "class" : "controls" });
    this.addChild( container );

    this.exitBTN = new Sprite( "button", {}, Copy.SHOP.EXIT );
    container.addChild( this.exitBTN );
};
