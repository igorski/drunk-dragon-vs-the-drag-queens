import ShopFactory, { SHOP_TYPES } from "@/model/factories/shop-factory";
import ItemTypes from "@/definitions/item-types";

describe( "Shop factory", () => {
    it( "should be able to assemble and disassemble a serialized shop without loss of data", () => {
        const shop = ShopFactory.create({
            id: "foo",
            x: 12,
            y: 7,
            type: SHOP_TYPES.LIQUOR,
            items: [{ name: "foo", type: "bar", price: 25 }],
            debt: 20
        });
        const disassembled = ShopFactory.disassemble( shop );
        expect( ShopFactory.assemble( disassembled )).toEqual( shop );
    });
});
