import ItemTypes from '@/definitions/item-types';
import ItemFactory from './item-factory';

export default
{
    /**
     * @param {number=} money
     * @param {Array<Object>=} items
     */
    createInventory( money = 0, items = [] ) {
        return { money, items };
    },

    /**
     * return all weapons in the Inventory, if present
     *
     * @param {Object} inventory
     * @return {Array<Object>}
     */
    getWeapons( inventory ) {
        return inventory.items.filter(({ type }) => type === ItemTypes.WEAPON );
    },

    /**
     * returns all medicine in the Inventory, if present
     *
     * @param {Object} inventory
     * @return {Array<Object>}
     */
     getMedicine( inventory ) {
         return inventory.items.filter(({ type }) => type === ItemTypes.MEDICINE );
    },

    /**
     * merge inventories (for instance when stealing from defeated Opponents)
     *
     * @param {Object} inventory
     * @param {Object} inventoryToMergeWith
     * @return {Array<string>|null} if items were merged, a String
     *         containing the specific items is returned
     */
    merge( inventory, inventoryToMergeWith ) {
        const out = [];

        if ( inventoryToMergeWith.money > 0 ) {
            inventory.money += inventoryToMergeWith.money;
            out.push( Copy.STOLE_COINS.replace( '{0}', inventoryToMergeWith.money ));
        }

        inventoryToMergeWith.items.forEach(item => {
            inventory.items.push( item );
            out.push( Copy.STOLE_ITEM.replace( '{0}', ItemFactory.getItemName( item )));
        });
        return out.length > 0 ? out : null;
    }
};
