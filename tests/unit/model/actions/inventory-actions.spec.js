import InventoryActions from '@/model/actions/inventory-actions';
import InventoryFactory from '@/model/factories/inventory-factory';
import ItemTypes from '@/definitions/item-types';

describe('Inventory actions', () => {
    describe('getters', () => {
        it('should return all items that are of given type', () => {
            const items = [
                { foo: 'bar',  type: ItemTypes.MEDICINE },
                { bar: 'baz',  type: ItemTypes.MEDICINE },
                { baz: 'qux',  type: ItemTypes.JEWELRY },
                { qux: 'quux', type: ItemTypes.JEWELRY },
            ];
            const inventory = InventoryFactory.create( 0, items );

            expect( InventoryActions.getItemsOfType( inventory, ItemTypes.MEDICINE )).toEqual([
                { foo: 'bar',  type: ItemTypes.MEDICINE },
                { bar: 'baz',  type: ItemTypes.MEDICINE },
            ]);
            expect( InventoryActions.getItemsOfType( inventory, ItemTypes.JEWELRY )).toEqual([
                { baz: 'qux',  type: ItemTypes.JEWELRY },
                { qux: 'quux', type: ItemTypes.JEWELRY },
            ]);
        });
    });

    describe('mutations', () => {
        it('should be able to merge the contents of two inventories', () => {
            const inventory = InventoryFactory.create( 20, [{ foo: 'bar' }]);
            const inventoryToMergeWith = InventoryFactory.create( 50, [{ baz: 'qux' }]);

            InventoryActions.merge( inventory, inventoryToMergeWith );

            expect( inventory.cash ).toEqual( 70 );
            expect( inventory.items ).toEqual([ { foo: 'bar' }, { baz: 'qux' }]);

            expect( inventoryToMergeWith.cash ).toEqual( 0 );
            expect( inventoryToMergeWith.items ).toEqual( [] );
        });
    });

    it('should be able to calculate a sale price for an item', () => {
        const item      = { price: 10 };
        const salePrice = InventoryActions.getPriceForItemSale( item, 2, 3 );
        expect( salePrice ).not.toEqual( item.price );
        expect( salePrice >= item.price * 2 ).toBe( true );
    });
});
