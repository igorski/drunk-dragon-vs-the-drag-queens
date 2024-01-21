import { describe, it, expect } from "vitest";
import ItemFactory from "@/model/factories/item-factory";
import ItemTypes, {
    LIQUOR_TYPES, SHOE_HEELS, SHOE_SNEAKERS, SHOE_FLIPPERS,
    DRUG_TYPES, DRUG_STIMULANT_A, DRUG_NOSE_CANDY,
    FOOD_TYPES, FOOD_HAMBURGER, FOOD_PIZZA
} from "@/definitions/item-types";
import PriceTypes from "@/definitions/price-types";

describe( "Item factory", () => {
    it( "should be able to generate an item from all provided arguments", () => {
        const item = ItemFactory.create({
            type  : ItemTypes.LIQUOR,
            name  : LIQUOR_TYPES[ 0 ],
            price : 500
        });
        expect( item ).toEqual({
            id    : expect.any( String ),
            type  : ItemTypes.LIQUOR,
            name  : LIQUOR_TYPES[ 0 ],
            price : 500
        });
    });

    it( "should be able to generate a randomized price for an item", () => {
        const item = ItemFactory.create({ type: ItemTypes.LIQUOR });
        expect( item.price ).toEqual( expect.any( Number ));
    });

    it( "should return a hard coded price for specific items", () => {
        [
            { type: ItemTypes.CLOTHES, name: SHOE_HEELS,    expected: PriceTypes.EXPENSIVE },
            { type: ItemTypes.CLOTHES, name: SHOE_SNEAKERS, expected: PriceTypes.EXPENSIVE },
            { type: ItemTypes.CLOTHES, name: SHOE_FLIPPERS, expected: PriceTypes.LUXURY },
        ].forEach( item => {
            expect( ItemFactory.create({ type: item.type, name: item.name }).price ).toEqual( item.expected );
        });

        [
            { type: ItemTypes.DRUGS, name: DRUG_STIMULANT_A, expected: PriceTypes.AVERAGE },
            { type: ItemTypes.DRUGS, name: DRUG_NOSE_CANDY,  expected: PriceTypes.EXPENSIVE },
        ].forEach( item => {
            expect( ItemFactory.create({ type: item.type, name: item.name }).price ).toEqual( item.expected );
        });

        [
            { type: ItemTypes.FOOD, name: FOOD_HAMBURGER, expected: PriceTypes.AVERAGE },
            { type: ItemTypes.FOOD, name: FOOD_PIZZA,     expected: PriceTypes.MEDIUM }
        ].forEach( item => {
            expect( ItemFactory.create({ type: item.type, name: item.name }).price ).toEqual( item.expected );
        });
    });

    it( "should be able to assemble and disassemble a serialized item without loss of data", () => {
        const item = ItemFactory.create({ type: ItemTypes.LIQUOR });
        const disassembled = ItemFactory.disassemble( item );
        expect( ItemFactory.assemble( disassembled )).toEqual( item );
    });
});
