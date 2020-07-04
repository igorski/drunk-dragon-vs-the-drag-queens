import Inventory from '@/model/inventory';

export default
{
    /**
     * @param {number=} cash
     * @param {Array<Object>=} items
     */
    create( cash = 0, items = [] ) {
        return new Inventory( cash, items );
    },

    /**
     * assemble a serialized JSON structure
     * back into a Inventory instance
     */
    assemble( data ) {
        return new Inventory( data.c, data.i );
    },

    /**
     * serializes a Inventory instance into a JSON structure
     */
     disassemble( inventory ) {
         return {
             c: inventory.cash,
             i: inventory.items
         };
     }
};
