import ItemFactory from '@/model/factories/item-factory';

export default
{
    /**
     * return all items in given inventory that are of given type
     *
     * @param {Object} inventory
     * @param {number} itemType from ItemTypes enumeration
     * @return {Array<Object>}
     */
    getItemsOfType( inventory, itemType ) {
        return inventory.items.filter(({ type }) => type === itemType );
    },

    /**
     * merge inventories (for instance when stealing from defeated Characters)
     *
     * @param {Object} inventory to merge into
     * @param {Object} inventoryToMergeWith to merge with
     * @return {Array<string>|null} if items were merged, a String
     *         describing the merged items is returned
     */
    merge( inventory, inventoryToMergeWith ) {
        const out = [];

        if ( inventoryToMergeWith.cash > 0 ) {
            inventory.cash += inventoryToMergeWith.cash;
            inventoryToMergeWith.cash = 0;
            out.push( inventoryToMergeWith.cash );
        }

        inventoryToMergeWith.items.forEach(item => {
            inventory.items.push( item );
        });
        inventoryToMergeWith.items.splice( 0, inventoryToMergeWith.items.length );

        return out.length > 0 ? out : null;
    }
};
