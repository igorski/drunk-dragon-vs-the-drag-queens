import ItemFactory from '@/model/factories/item-factory';
import { validateInventory } from '../validator';

const InventoryFactory =
{
    /**
     * @param {number=} cash
     * @param {Array<Object>=} items
     */
    create( cash = 0, items = [] ) {
        const inventory = {
            cash, // cash in hand because 80's!
            items
        };
        validateInventory( inventory );
        return inventory;
    },

    /**
     * assemble a serialized JSON structure
     * back into a Inventory instance
     */
    assemble( data ) {
        return InventoryFactory.create(
            data.c,
            data.i.map( item => ItemFactory.assemble( item ))
        );
    },

    /**
     * serializes a Inventory instance into a JSON structure
     */
     disassemble( inventory ) {
         return {
             c: inventory.cash,
             i: inventory.items.map( item => ItemFactory.disassemble( item ))
         };
     }
};
export default InventoryFactory;
