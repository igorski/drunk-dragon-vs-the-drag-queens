import { describe, it, expect } from "vitest";
import ItemTypes        from "@/definitions/item-types";
import InventoryFactory from "@/model/factories/inventory-factory";
import ItemFactory      from "@/model/factories/item-factory";

describe("Inventory factory", () => {
    it("should be able to create an inventory structure", () => {
        const cash = 50;
        const items = [{ foo: "bar" }];
        const inventory = InventoryFactory.create( cash, items );
        expect( inventory.cash ).toEqual( cash );
        expect( inventory.items ).toEqual( items );
    });

    it("should be able to assemble and disassemble a serialized inventory without loss of data", () => {
        const inventory = InventoryFactory.create( 50, [
            ItemFactory.create({ type: ItemTypes.JEWELRY }), ItemFactory.create({ type: ItemTypes.CLOTHES })
        ]);
        const disassembled = InventoryFactory.disassemble( inventory );
        expect( InventoryFactory.assemble( disassembled )).toEqual( inventory );
    });
});
