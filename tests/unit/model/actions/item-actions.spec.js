import { describe, it, expect, vi } from "vitest";
import ItemActions from "@/model/actions/item-actions";
import { HOUR, TWENTY_FOUR_HOURS } from "@/definitions/constants";
import ItemTypes, { HEALTHCARE_TYPES, LIQUOR_TYPES, DRUG_TYPES, FOOD_TYPES } from "@/definitions/item-types";
import { getPriceRangeForItemType } from "@/definitions/price-types";
import ItemFactory from "@/model/factories/item-factory";
import CharacterFactory from "@/model/factories/character-factory";

describe( "Item actions", () => {
    describe( "when applying healthcare items to the player", () => {
        const priceRange = getPriceRangeForItemType( ItemTypes.HEALTHCARE );

        it( "should increase the player HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 50 });
            const item = ItemFactory.create({
                type  : ItemTypes.HEALTHCARE,
                name  : HEALTHCARE_TYPES[ 0 ],
                price : priceRange[ 0 ]
            });
            const store = { commit: vi.fn() };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: 11 });
        });

        it( "should not exceed max HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 25 });
            const item = ItemFactory.create({
                type  : ItemTypes.HEALTHCARE,
                name  : HEALTHCARE_TYPES[ 0 ],
                price : priceRange[ priceRange.length - 1 ]
            });
            const store = { commit: vi.fn() };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: player.maxHp });
        });
    });

    describe( "when the player eats food", () => {
        const priceRange = getPriceRangeForItemType( ItemTypes.FOOD );

        it( "should increase the player HP", () => {
            const player = CharacterFactory.create({ hp: 1, maxHp: 10 });
            const item = ItemFactory.create({
                type  : ItemTypes.FOOD,
                name  : FOOD_TYPES[ 0 ],
                price : priceRange[ 0 ]
            });
            const store = { commit: vi.fn() };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: 6 });
        });

        it( "should not exceed max HP", () => {
            const player = CharacterFactory.create({ hp: 6, maxHp: 10 });
            const item = ItemFactory.create({
                type  : ItemTypes.FOOD,
                name  : FOOD_TYPES[ 0 ],
                price : priceRange[ priceRange.length - 1 ]
            });
            const store = { commit: vi.fn() };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenCalledWith( "updatePlayer", { hp: player.maxHp });
        });
    });

    describe( "when drinking liquor", () => {
        const priceRange = getPriceRangeForItemType( ItemTypes.LIQUOR );

        it( "should increase the players intoxication and start/update an Effect to sober up over time", () => {
            const player = CharacterFactory.create({}, {}, { intoxication: 0.5 });
            const item = ItemFactory.create({
                type  : ItemTypes.LIQUOR,
                name  : LIQUOR_TYPES[ 0 ],
                price : priceRange[ 0 ]
            });
            const store = { commit: vi.fn(), getters: { gameTime: 1000 } };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setIntoxication" ] } );
            expect( store.commit ).toHaveBeenNthCalledWith( 2, "setIntoxication", { value: 0.75 });
            expect( store.commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                mutation: "setIntoxication",
                startTime: store.getters.gameTime,
                duration: TWENTY_FOUR_HOURS * 0.75,
                startValue: 0.75,
                endValue: 0,
                callback: "soberUp",
                target: player.id,
                increment: expect.any( Number )
            });
        });

        it( "should not increase the players intoxication beyond the maximum 24 hour buzz", () => {
            const player = CharacterFactory.create({}, {}, { intoxication: 0.5 });
            const item = ItemFactory.create({
                type  : ItemTypes.LIQUOR,
                name  : LIQUOR_TYPES[ 0 ],
                price : priceRange[ 1 ]
            });
            const store = { commit: vi.fn(), getters: { gameTime: 1000 } };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setIntoxication" ] } );
            expect( store.commit ).toHaveBeenNthCalledWith( 2, "setIntoxication", { value: 1 });
            expect( store.commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                mutation: "setIntoxication",
                startTime: store.getters.gameTime,
                duration: TWENTY_FOUR_HOURS,
                startValue: 1,
                endValue: 0,
                callback: "soberUp",
                target: player.id,
                increment: expect.any( Number )
            });
        });
    });

    describe( "when taking drugs", () => {
        const priceRange = getPriceRangeForItemType( ItemTypes.DRUGS );

        it( "should increase the players boost and start/update an Effect to clean up over time", () => {
            const player = CharacterFactory.create({}, {}, { boost: 0.25 });
            const item = ItemFactory.create({
                type  : ItemTypes.DRUGS,
                name  : DRUG_TYPES[ 0 ],
                price : priceRange[ 0 ]
            });
            const store = { commit: vi.fn(), getters: { gameTime: 1000 } };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setBoost" ] } );
            expect( store.commit ).toHaveBeenNthCalledWith( 2, "setBoost", { value: 0.5 });
            expect( store.commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                mutation: "setBoost",
                startTime: store.getters.gameTime,
                duration: HOUR * 0.5,
                startValue: 0.5,
                endValue: 0,
                callback: "cleanUp",
                target: player.id,
                increment: expect.any( Number )
            });
        });

        it( "should not increase the players intoxication beyond the maximum hour buzz", () => {
            const player = CharacterFactory.create({}, {}, { boost: 0.5 });
            const item = ItemFactory.create({
                type  : ItemTypes.DRUGS,
                name  : DRUG_TYPES[ 1 ],
                price : priceRange[ 1 ]
            });
            const store = { commit: vi.fn(), getters: { gameTime: 1000 } };

            ItemActions.applyItemToPlayer( store, item, player );
            expect( store.commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setBoost" ] } );
            expect( store.commit ).toHaveBeenNthCalledWith( 2, "setBoost", { value: 1 });
            expect( store.commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                mutation: "setBoost",
                startTime: store.getters.gameTime,
                duration: HOUR,
                startValue: 1,
                endValue: 0,
                callback: "cleanUp",
                target: player.id,
                increment: expect.any( Number )
            });
        });
    });
});
