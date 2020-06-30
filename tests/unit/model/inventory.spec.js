import Inventory from '@/model/inventory';
import ItemTypes from '@/definitions/item-types';

describe('Inventory', () => {
    describe('configuration', () => {
        it('should leave all construction arguments unchanged', () => {
            const cash = 200;
            const items = [{ foo: 'bar' }];

            const inventory = new Inventory( cash, items );

            expect( inventory.cash ).toEqual( cash );
            expect( inventory.items ).toEqual( items );
        });
    });

    describe('getters', () => {
        it('should return all items that are of given type', () => {
            const items = [
                { foo: 'bar',  type: ItemTypes.MEDICINE },
                { bar: 'baz',  type: ItemTypes.MEDICINE },
                { baz: 'qux',  type: ItemTypes.JEWELRY },
                { qux: 'quux', type: ItemTypes.JEWELRY },
            ];
            const inventory = new Inventory( 0, items );

            expect( inventory.getItemsOfType( ItemTypes.MEDICINE )).toEqual([
                { foo: 'bar',  type: ItemTypes.MEDICINE },
                { bar: 'baz',  type: ItemTypes.MEDICINE },
            ]);
            expect( inventory.getItemsOfType( ItemTypes.JEWELRY )).toEqual([
                { baz: 'qux',  type: ItemTypes.JEWELRY },
                { qux: 'quux', type: ItemTypes.JEWELRY },
            ]);
        });
    });

    describe('mutations', () => {
        it('should be able to merge the contents of two inventories', () => {
            const inventory = new Inventory( 20, [{ foo: 'bar' }]);
            const inventoryToMergeWith = new Inventory( 50, [{ baz: 'qux' }]);

            inventory.merge( inventoryToMergeWith );

            expect( inventory.cash ).toEqual( 70 );
            expect( inventory.items ).toEqual([ { foo: 'bar' }, { baz: 'qux' }]);

            expect( inventoryToMergeWith.cash ).toEqual( 0 );
            expect( inventoryToMergeWith.items ).toEqual( [] );
        });
    });
});
