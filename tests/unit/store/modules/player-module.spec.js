import store from "@/store/modules/player-module";
import { QUEEN } from "@/definitions/character-types";
import CharacterFactory from "@/model/factories/character-factory";
const { getters, mutations, actions } = store;

describe("Vuex player module", () => {
    describe("getters", () => {
        it("should return the player Character", () => {
            const state = { player: { baz: "qux" } };
            expect( getters.player( state )).toEqual( state.player );
        });
    });

    describe("mutations", () => {
        it("should be able to set the player Character", () => {
            const state = { player: null };
            const player = { foo: "bar" };
            mutations.setPlayer( state, player );
            expect( state.player ).toEqual( player );
        });

        it("should be able to update the player Character properties", () => {
            const state = { player: CharacterFactory.create({ x: 10, y: 11, hp: 10 }) };
            const { appearance, inventory, properties } = state.player;
            const updatedPlayer = {
                hp: 200,
                xp: 100,
                x: 12,
                y: 13,
                level: 2,
                properties: {
                    speed: 5,
                },
                inventory: {
                    cash: 10
                },
            };
            mutations.updatePlayer( state, updatedPlayer );
            expect( state.player ).toEqual({
                id: expect.any( String ),
                hp: 200,
                xp: 100,
                x: 12,
                y: 13,
                type: QUEEN,
                level: 2,
                width: 1,
                height: 1,
                properties: {
                    ...properties,
                    speed: 5
                },
                inventory: {
                    ...inventory,
                    cash: 10
                },
                appearance
            });
        });

        it("should be able to deduct cash from the players balance", () => {
            const state = { player: { inventory: { cash: 50 } } };
            mutations.deductCash( state, 10 );
            expect( state.player.inventory.cash ).toEqual( 40 );
        });

        it("should be able to award cash to the players balance", () => {
            const state = { player: { inventory: { cash: 50 } } };
            mutations.awardCash( state, 10 );
            expect( state.player.inventory.cash ).toEqual( 60 );
        });

        it("should be able to add an item to the players inventory", () => {
            const state = { player: { inventory: { cash: 50, items: [{ foo: "bar" }] } } };
            const item  = { baz: "qux" };
            mutations.addItemToInventory( state, item );
            expect( state.player.inventory.items ).toEqual([{ foo: "bar"}, { baz: "qux" }]);
        });

        it("should be able to remove an item from the players inventory", () => {
            const state = { player: { inventory: {
                cash: 50, items: [{ foo: "bar" }, { baz: "qux" }] } }
            };
            mutations.removeItemFromInventory( state, state.player.inventory.items[1] );
            expect( state.player.inventory.items ).toEqual([{ foo: "bar"}]);
        });
    });

    describe("actions", () => {
        it("should be able to move the player to the requested destination", () => {
            const state         = { player: { id: "foo", properties: { speed: 1, intoxication: 0, boost: 0 } } };
            const mockedGetters = { activeEnvironment: { x: 0, y: 0 }, effects: [], gameTime: 0 };
            const commit        = jest.fn();
            const dispatch      = jest.fn();

            const waypoints  = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
            const onProgress = jest.fn();

            actions.moveToDestination({ state, getters: mockedGetters, commit, dispatch }, { waypoints, onProgress });

            // expect registration of update handler
            expect( commit ).toHaveBeenNthCalledWith( 1, "setOnMovementUpdate", onProgress );
            // expect cancellation of existing movement effects
            expect( commit ).toHaveBeenNthCalledWith( 2, "removeEffectsByTarget", state.player.id );
        });

        describe("when buying an item from a shop", () => {
            it("should deny the transaction when the player has insufficient funds", () => {
                const state  = { player: { inventory: { cash: 5 } } };
                const item   = { price: 10 };
                const commit = jest.fn();
                expect( actions.buyItem({ state, commit }, item )).toBe( false );
                expect( commit ).not.toHaveBeenCalled();
            });

            it("should buy the item when the player has sufficient funds and move it to the player inventory", () => {
                const state  = { player: { inventory: { cash: 15 } } };
                const item   = { price: 10 };
                const commit = jest.fn();
                expect( actions.buyItem({ state, commit }, item )).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, "deductCash", item.price );
                expect( commit ).toHaveBeenNthCalledWith( 2, "removeItemFromShop", item );
                expect( commit ).toHaveBeenNthCalledWith( 3, "addItemToInventory", item );
            });
        });

        it("should be able to sell an item to a shop", () => {
            const orgPrice = 12;
            const item     = { price: orgPrice };
            const price    = 5;
            const commit   = jest.fn();

            actions.sellItem({ commit }, { item, price });

            expect( commit ).toHaveBeenNthCalledWith( 1, "awardCash", price );
            expect( commit ).toHaveBeenNthCalledWith( 2, "addItemToShop", item );
            expect( commit ).toHaveBeenNthCalledWith( 3, "removeItemFromInventory", item );

            expect( item.price ).not.toEqual( orgPrice ); // price has been updated
        });

        describe("when giving an inventory item to another Character", () => {
            const character = {
                properties: {
                    intent: {
                        type: 1,
                        price: 10
                    }
                }
            };

            if("should not give the item when it does not meet the Characters intent", () => {
                const item = { type: 0, price: 1 };
                const commit = jest.fn();

                expect( actions.giveItemToCharacter({ commit }, { item, character })).toBe( false );
                item.type = 1; // type is equal to intent, but price isn't
                expect( actions.giveItemToCharacter({ commit }, { item, character })).toBe( false );
                expect( commit ).not.toHaveBeenCalled();
            });

            it("should give the item when it meets the Characters intent", () => {
                const item = { type: 1, price: 10 };
                const commit = jest.fn();

                expect( actions.giveItemToCharacter({ commit }, { item, character })).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, "addItemToCharacterInventory", { item, character });
                expect( commit ).toHaveBeenNthCalledWith( 2, "removeItemFromInventory", item);
            });
        });
    });
});
