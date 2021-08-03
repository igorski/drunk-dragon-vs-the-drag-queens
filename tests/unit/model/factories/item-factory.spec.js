import ItemFactory from "@/model/factories/item-factory";
import ItemTypes, { LIQUOR_TYPES, SHOE_HEELS, SHOE_SNEAKERS, SHOE_FLIPPERS } from "@/definitions/item-types";
import PriceTypes from "@/definitions/price-types";

describe( "Item factory", () => {
    it( "should be able to generate an item from all provided arguments", () => {
        const item = ItemFactory.create( ItemTypes.LIQUOR, LIQUOR_TYPES[ 0 ], 500 );
        expect( item ).toEqual({
            type  : ItemTypes.LIQUOR,
            name  : LIQUOR_TYPES[ 0 ],
            price : 500
        });
    });

    it( "should be able to generate a randomized price for an item", () => {
        const item = ItemFactory.create( ItemTypes.LIQUOR );
        expect( item.price ).toEqual( expect.any( Number ));
    });

    it( "should return a hard coded price for specific items", () => {
        [
            { type: ItemTypes.CLOTHES, name: SHOE_HEELS,    expected: PriceTypes.EXPENSIVE },
            { type: ItemTypes.CLOTHES, name: SHOE_SNEAKERS, expected: PriceTypes.EXPENSIVE },
            { type: ItemTypes.CLOTHES, name: SHOE_FLIPPERS, expected: PriceTypes.LUXURY },
        ].forEach( item => {
            expect( ItemFactory.create( item.type, item.name ).price ).toEqual( item.expected );
        });
    });

    it( "should be able to assemble and disassemble a serialized item without loss of data", () => {
        const item = ItemFactory.create( ItemTypes.LIQUOR );
        const disassembled = ItemFactory.disassemble( item );
        expect( ItemFactory.assemble( disassembled )).toEqual( item );
    });
});
