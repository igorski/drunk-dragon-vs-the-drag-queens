import ItemActions from "@/model/actions/item-actions";
import { randomBool, randomFromList } from "@/utils/random-util";
import { TWENTY_FOUR_HOURS, GAME_TIME_RATIO } from "@/definitions/constants";
import ItemTypes, { HEALTHCARE_TYPES, LIQUOR_TYPES } from "@/definitions/item-types";
import PriceTypes, { getPriceRangeForItemType } from "@/definitions/price-types";
import ItemFactory from "@/model/factories/item-factory";
import CharacterFactory from "@/model/factories/character-factory";

describe( "Item actions", () => {
    describe( "when applying healthcare items to the player", () => {
        const priceRange = getPriceRangeForItemType( ItemTypes.HEALTHCARE );

        it( "should increase the player HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 50 });
            const item = ItemFactory.create( ItemTypes.HEALTHCARE, HEALTHCARE_TYPES[ 0 ], priceRange[ 0 ] );
            const store = { commit: jest.fn() };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: 6 });
        });

        it( "should not exceed max HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 25 });
            const item = ItemFactory.create( ItemTypes.HEALTHCARE, HEALTHCARE_TYPES[ 0 ], priceRange[ priceRange.length - 1 ] );
            const store = { commit: jest.fn() };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: player.maxHp });
        });
    });

    describe( "when drinking liquor", () => {
        const priceRange = getPriceRangeForItemType( ItemTypes.LIQUOR );

        it( "should increase the players intoxication and start/update an Effect to sober up over time", () => {
            const player = CharacterFactory.create({}, {}, { intoxication: 0.5 });
            const item = ItemFactory.create( ItemTypes.LIQUOR, LIQUOR_TYPES[ 0 ], priceRange[ 0 ]);
            const store = { commit: jest.fn(), getters: { gameTime: 1000 } };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setIntoxication" ] } );
            expect( store.commit ).toHaveBeenNthCalledWith( 2, "setIntoxication", { value: 0.75 });
            expect( store.commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                mutation: "setIntoxication",
                startTime: store.getters.gameTime,
                duration: TWENTY_FOUR_HOURS * 0.75 * GAME_TIME_RATIO,
                startValue: 0.75,
                endValue: 0,
                callback: "soberUp",
                target: player.id,
                increment: expect.any( Number )
            });
        });

        it( "should not increase the players intoxication beyond the maximum 24 hour buzz", () => {
            const player = CharacterFactory.create({}, {}, { intoxication: 0.5 });
            const item = ItemFactory.create( ItemTypes.LIQUOR, LIQUOR_TYPES[ 0 ], priceRange[ 1 ]);
            const store = { commit: jest.fn(), getters: { gameTime: 1000 } };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setIntoxication" ] } );
            expect( store.commit ).toHaveBeenNthCalledWith( 2, "setIntoxication", { value: 1 });
            expect( store.commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                mutation: "setIntoxication",
                startTime: store.getters.gameTime,
                duration: TWENTY_FOUR_HOURS * GAME_TIME_RATIO,
                startValue: 1,
                endValue: 0,
                callback: "soberUp",
                target: player.id,
                increment: expect.any( Number )
            });
        });
    });
});
