import InventoryActions from "@/model/actions/inventory-actions";
import InventoryFactory from "@/model/factories/inventory-factory";
import ItemTypes from "@/definitions/item-types";

describe( "Inventory actions", () => {
    describe( "getters", () => {
        it( "should return all items that are of given type", () => {
            const items = [
                { name: "bar",  type: ItemTypes.HEALTHCARE },
                { name: "baz",  type: ItemTypes.HEALTHCARE },
                { name: "qux",  type: ItemTypes.JEWELRY },
                { name: "quux", type: ItemTypes.JEWELRY },
            ];
            const inventory = InventoryFactory.create( 0, items );

            expect( InventoryActions.getItemsOfType( inventory, ItemTypes.HEALTHCARE )).toEqual([
                { name: "bar",  type: ItemTypes.HEALTHCARE },
                { name: "baz",  type: ItemTypes.HEALTHCARE },
            ]);
            expect( InventoryActions.getItemsOfType( inventory, ItemTypes.JEWELRY )).toEqual([
                { name: "qux",  type: ItemTypes.JEWELRY },
                { name: "quux", type: ItemTypes.JEWELRY },
            ]);
        });

        it( "should return all items that match a given name", () => {
            const items = [
                { name: "bar", type: ItemTypes.HEALTHCARE },
                { name: "baz", type: ItemTypes.HEALTHCARE },
                { name: "qux", type: ItemTypes.JEWELRY },
                { name: "bar", type: ItemTypes.HEALTHCARE },
            ];
            const inventory = InventoryFactory.create( 0, items );

            expect( InventoryActions.getItemsByName( inventory, "bar" )).toEqual([
                { name: "bar", type: ItemTypes.HEALTHCARE },
                { name: "bar", type: ItemTypes.HEALTHCARE },
            ]);
        });
    });

    describe( "mutations", () => {
        it( "should be able to merge the contents of two inventories", () => {
            const inventory = InventoryFactory.create( 20, [{ foo: "bar" }]);
            const inventoryToMergeWith = InventoryFactory.create( 50, [{ baz: "qux" }]);

            InventoryActions.merge( inventory, inventoryToMergeWith );

            expect( inventory.cash ).toEqual( 70 );
            expect( inventory.items ).toEqual([ { foo: "bar" }, { baz: "qux" }]);

            expect( inventoryToMergeWith.cash ).toEqual( 0 );
            expect( inventoryToMergeWith.items ).toEqual( [] );
        });
    });

    it( "should be able to calculate a sale price for an item", () => {
        const item      = { price: 10 };
        const salePrice = InventoryActions.getPriceForItemSale( item, 2, 3 );
        expect( salePrice ).not.toEqual( item.price );
        expect( salePrice >= item.price * 2 ).toBe( true );
    });
});
