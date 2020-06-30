import Inventory from '@/model/inventory';

export default
{
    /**
     * @param {number=} money
     * @param {Array<Object>=} items
     */
    createInventory( money = 0, items = [] ) {
        return new Inventory( money, items );
    }
};
