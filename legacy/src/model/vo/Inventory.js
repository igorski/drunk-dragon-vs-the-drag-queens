module.exports = Inventory;

var Copy        = require( "../../definitions/Copy" );
var ItemTypes   = require( "../../definitions/ItemTypes" );
var ItemFactory = require( "../factories/ItemFactory" );

/**
 * @constructor
 *
 * @param {number=} aMoney
 * @param {Array.<Item>} aItems
 */
function Inventory( aMoney, aItems )
{
    this.money = typeof aMoney === "number" ? aMoney : 0;
    this.items = aItems || null;
}

/* class properties */

/** @public @type {number} */       Inventory.prototype.money = 0;
/** @public @type {Array.<Item>} */ Inventory.prototype.items;

/* public methods */

/**
 * @public
 *
 * @return {boolean}
 */
Inventory.prototype.hasItems = function()
{
    return this.items !== null;
};

/**
 * return all weapons in the Inventory, if present
 *
 * @public
 *
 * @return {Array.<Item>}
 */
Inventory.prototype.getWeapons = function()
{
    var out = [];

    if ( this.hasItems() )
    {
        this.items.forEach( function( item )
        {
            if ( item.type === ItemTypes.WEAPON )
                out.push( item );
        });
    }
    return out;
};

/**
 * returns all medicine in the Inventory, if present
 *
 * @public
 *
 * @return {Array.<Item>}
 */
Inventory.prototype.getMedicine = function()
{
    var out = [];

    if ( this.hasItems() )
    {
        this.items.forEach( function( item )
        {
            if ( item.type === ItemTypes.MEDICINE )
                out.push( item );
        });
    }
    return out;
};

/**
 * merge inventories (for instance : stealing from
 * defeated Opponents)
 *
 * @public
 *
 * @param {Inventory} aInventory
 * @return {Array.<string>|null} if items were merged, a String
 *         containing the specific items is returned
 */
Inventory.prototype.merge = function( aInventory )
{
    var out = [];

    if ( aInventory.money > 0 )
    {
        this.money += aInventory.money;
        out.push( Copy.STOLE_COINS.replace( "{0}", aInventory.money ));
    }

    if ( aInventory.hasItems() )
    {
        if ( !this.hasItems() )
            this.items = [];

        aInventory.items.forEach( function( item )
        {
            this.items.push( item );
            out.push( Copy.STOLE_ITEM.replace( "{0}", ItemFactory.getItemName( item )));

        }.bind( this ));
    }
    if ( out.length > 0 )
        return out;

    return null;
};
