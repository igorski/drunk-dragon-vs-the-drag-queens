module.exports = Shop;

var ShopItem = require( "./ShopItem" );

/**
 * @constructor
 *
 * @param {number} aX x-position of the Shop
 * @param {number} aY y-position of the Shop
 * @param {Array.<ShopItem>} aItems
 */
function Shop( aX, aY, aItems )
{
    this.x     = aX;
    this.y     = aY;
    this.items = aItems;
}

/* class properties */

/** @public @type {number} */           Shop.prototype.x;
/** @public @type {number} */           Shop.prototype.y;
/** @public @type {Array.<ShopItem>} */ Shop.prototype.items;
