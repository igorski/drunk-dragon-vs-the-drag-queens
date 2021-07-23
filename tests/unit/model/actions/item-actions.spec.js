import ItemActions from "@/model/actions/item-actions";
import { randomBool, randomFromList } from "@/utils/random-util";
import ItemTypes, { HEALTHCARE_TYPES } from "@/definitions/item-types";
import PriceTypes from "@/definitions/price-types";
import ItemFactory from "@/model/factories/item-factory";
import CharacterFactory from "@/model/factories/character-factory";

describe( "Item actions", () => {
    describe( "when applying healthcare items to the player", () => {
        it( "should increase the player HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 50 });
            const item = ItemFactory.create( ItemTypes.HEALTHCARE, HEALTHCARE_TYPES[ 0 ], PriceTypes.CHEAP );
            const store = { commit: jest.fn() };
            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: 6 });
        });

        it( "should not exceed max HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 50 });
            const item = ItemFactory.create( ItemTypes.HEALTHCARE, HEALTHCARE_TYPES[ 0 ], PriceTypes.LUXURY );
            const store = { commit: jest.fn() };
            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: player.maxHp });
        });
    });
});
