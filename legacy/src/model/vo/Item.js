module.exports = Item;

/**
 * @constructor
 *
 * @param {number} aType from ItemTypes-enum
 * @param {number=} aValue optional value for the item
 */
function Item( aType, aValue )
{
    this.type  = aType;
    this.value = typeof aValue === "number" ? aValue : -1;
}

/* class properties */

/** @public @type {number} */ Item.prototype.type;
/** @public @type {number} */ Item.prototype.value;
