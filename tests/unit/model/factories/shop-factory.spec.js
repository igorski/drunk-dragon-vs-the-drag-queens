import ShopFactory, { SHOP_TYPES } from "@/model/factories/shop-factory";
import ItemTypes from "@/definitions/item-types";

describe( "Shop factory", () => {
    it( "should be able to assemble and disassemble a serialized shop without loss of data", () => {
        const shop = ShopFactory.create( 12, 7, SHOP_TYPES.LIQUOR, [{ name: "foo", type: "bar", price: 25 }], 20 );
        const disassembled = ShopFactory.disassemble( shop );
        expect( ShopFactory.assemble( disassembled )).toEqual( shop );
    });
});
