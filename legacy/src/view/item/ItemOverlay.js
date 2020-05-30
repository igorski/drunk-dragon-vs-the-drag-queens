/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 08-03-15
 * Time: 13:17
 */
module.exports = ItemOverlay;

var Inheritance = require( "zjslib" ).Inheritance;
var Sprite      = require( "zjslib" ).Sprite;
var ItemFactory = require( "../../model/factories/ItemFactory" );
var Overlay     = require( "../components/Overlay" );
var Copy        = require( "../../definitions/Copy" );

/**
 * @constructor
 * @extends {Overlay}
 *
 * @param {Inventory} aInventory
 * @param {!Function} aConfirmHandler
 * @param {!Function} aCancelHandler
 * @param {number=} aOptItemFilter
 */
function ItemOverlay( aInventory, aConfirmHandler, aCancelHandler, aOptItemFilter )
{
    Inheritance.super( this, Copy.BATTLE.ITEM, null, aCancelHandler );

    // we proxy the confirm handler as it should be routed to the inventory items

    this._selectHandler = aConfirmHandler;
    this._inventory     = aInventory;
    this._filter        = aOptItemFilter;
}

Inheritance.extend( ItemOverlay, Overlay );

/* class properties */

/** @protected @type {!Function} */      ItemOverlay.prototype._selectHandler;
/** @protected @type {Inventory} */      ItemOverlay.prototype._inventory;
/** @protected @type {Array.<Sprite>} */ ItemOverlay.prototype._items;
/** @protected @type {number} */         ItemOverlay.prototype._filter;

/* public methods */

/**
 * @public
 *
 * @param {number} aItemType
 */
ItemOverlay.prototype.showOnlyItemsOfType = function( aItemType )
{
    var availableItems = this._inventory.items;

    this._items.forEach( function( aItem, aIndex )
    {
        if ( availableItems[ aIndex ].type === aItemType )
            aItem.show();
        else
            aItem.hide();
    });
};

/* protected methods */

/**
 * @override
 * @protected
 */
ItemOverlay.prototype.init = function()
{
    if ( this.initialized )
        return;

    this._items = [];

    this._inventory.items.forEach( function( aItem, aIndex )
    {
        var itemCopy = ItemFactory.getItemName( aItem );
        var item = new Sprite( "button", { "class" : "item" }, itemCopy );
        item.setDataAttribute( "index", aIndex );
        item.addEventListener( "click", this._selectHandler );

        this._items.push( item );
        this.addChild( item );

    }.bind( this ));

    if ( typeof this._filter === "number" && !isNaN( this._filter ))
        this.showOnlyItemsOfType( this._filter );

    Inheritance.super( this, "init" );

    this._cancelBTN.setContent( Copy.GENERAL.CLOSE );
};
