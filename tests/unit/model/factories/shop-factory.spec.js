import { describe, it, expect } from "vitest";
import ShopFactory, { SHOP_TYPES } from "@/model/factories/shop-factory";

describe( "Shop factory", () => {
    it( "should be able to assemble and disassemble a serialized shop without loss of data", () => {
        const shop = ShopFactory.create({
            id: "foo",
            x: 12,
            y: 7,
            type: SHOP_TYPES.LIQUOR,
            items: [{ id: 1, name: "foo", type: "bar", price: 25 }],
            debt: 20
        });
        const disassembled = ShopFactory.disassemble( shop );
        expect( ShopFactory.assemble( disassembled )).toEqual( shop );
    });
});
