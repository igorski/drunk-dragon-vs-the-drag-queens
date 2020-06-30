import { validateInventory } from './validator';
import ItemFactory from '@/model/factories/item-factory';

export default class Inventory {
    constructor( cash = 50, items = []) {
        this.cash  = cash; // cash in hand because 80's!
        this.items = items;

        validateInventory( this );
    }

    /**
     * return all items in the Inventory that are of given type
     *
     * @param {number} itemType from ItemTypes enumeration
     * @return {Array<Object>}
     */
    getItemsOfType( itemType ) {
        return this.items.filter(({ type }) => type === itemType );
    }

    /**
     * merge inventories (for instance when stealing from defeated Characters)
     *
     * @param {Object} inventory to merge with
     * @return {Array<string>|null} if items were merged, a String
     *         containing the specific items is returned
     */
    merge( inventory ) {
        const out = [];

        if ( inventory.cash > 0 ) {
            this.cash += inventory.cash;
            inventory.cash = 0;
            out.push( inventory.cash );
        }

        inventory.items.forEach(item => {
            this.items.push( item );
            out.push( ItemFactory.getItemName( item ));
        });
        inventory.items.splice( 0, inventory.items.length );
        
        return out.length > 0 ? out : null;
    }
};
