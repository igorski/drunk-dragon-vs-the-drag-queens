/**
 * Created by igorzinken on 06-03-15.
 */
module.exports = ShopItem;

var Inheritance = require( "zjslib" ).Inheritance;
var Item        = require( "./Item" );

/**
 * @constructor
 * @extends {Item}
 *
 * @param {number} aType from ItemTypes-enum
 * @param {number} aValue value for the item
 * @param {number} aPrice cost of purchase
 */
function ShopItem( aType, aValue, aPrice )
{
    Inheritance.super( this, aType, aValue );

    this.price = aPrice;
}

Inheritance.extend( ShopItem, Item );

/* class properties */

/** @public @type {number} */ ShopItem.prototype.price = 0;
