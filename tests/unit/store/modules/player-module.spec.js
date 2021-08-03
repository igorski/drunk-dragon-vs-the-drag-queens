import store from "@/store/modules/player-module";
import { QUEEN, DRAB } from "@/definitions/character-types";
import { GAME_START_HOUR } from "@/definitions/constants";
import { SCREEN_GAME } from "@/definitions/screens";
import CharacterFactory from "@/model/factories/character-factory";
import EnvironmentFactory from "@/model/factories/environment-factory";

const { getters, mutations, actions } = store;

jest.mock( "zcanvas", () => ({
    loader: {
        onReady: new Promise(resolve => resolve())
    },
    sprite: jest.fn()
}));

describe( "Vuex player module", () => {
    describe( "getters", () => {
        it( "should return the player Character", () => {
            const state = { player: { baz: "qux" } };
            expect( getters.player( state )).toEqual( state.player );
        });
    });

    describe( "mutations", () => {
        it( "should be able to set the player Character", () => {
            const state = { player: null };
            const player = { foo: "bar" };
            mutations.setPlayer( state, player );
            expect( state.player ).toEqual( player );
        });

        it( "should be able to update the player Character properties", () => {
            const state = { player: CharacterFactory.create({ x: 10, y: 11, hp: 10 }) };
            const { appearance, inventory, properties } = state.player;
            const updatedPlayer = {
                hp: 195,
                maxHp: 200,
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
                hp: 195,
                maxHp: 200,
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

        it( "should be able to deduct cash from the players balance", () => {
            const state = { player: { inventory: { cash: 50 } } };
            mutations.deductCash( state, 10 );
            expect( state.player.inventory.cash ).toEqual( 40 );
        });

        it( "should be able to award cash to the players balance", () => {
            const state = { player: { inventory: { cash: 50 } } };
            mutations.awardCash( state, 10 );
            expect( state.player.inventory.cash ).toEqual( 60 );
        });

        it( "should be able to increment the player XP", () => {
            const state = { player: { xp: 10 } };
            mutations.awardXP( state, 5 );
            expect( state.player.xp ).toEqual( 15 );
        });

        it( "should be able to set the player level", () => {
            const state = { player: { level: 1 } };
            mutations.setPlayerLevel( state, 2 );
            expect( state.player.level ).toEqual( 2 );
        });

        it( "should be able to set the player intoxication level", () => {
            const state = { player: { properties: { intoxication: 0 } } };
            mutations.setIntoxication( state, { value: 1 });
            expect( state.player.properties.intoxication ).toEqual( 1 );
        });

        it( "should be able to add an item to the players inventory", () => {
            const state = { player: { inventory: { cash: 50, items: [{ foo: "bar" }] } } };
            const item  = { baz: "qux" };
            mutations.addItemToInventory( state, item );
            expect( state.player.inventory.items ).toEqual([{ foo: "bar"}, { baz: "qux" }]);
        });

        it( "should be able to remove an item from the players inventory", () => {
            const state = { player: { inventory: {
                cash: 50, items: [{ foo: "bar" }, { baz: "qux" }] } }
            };
            mutations.removeItemFromInventory( state, state.player.inventory.items[1] );
            expect( state.player.inventory.items ).toEqual([{ foo: "bar"}]);
        });
    });

    describe( "actions", () => {
        it( "should be able to move the player to the requested destination", () => {
            const state = {
                player: CharacterFactory.create({ id: "foo", properties: { speed: 1, intoxication: 0, boost: 0 } }
            )};
            const mockedGetters = { activeEnvironment: EnvironmentFactory.create(), effects: [], gameTime: 0 };
            const commit        = jest.fn();
            const dispatch      = jest.fn();

            const onProgress = jest.fn();

            actions.moveToDestination({ state, getters: mockedGetters, commit, dispatch }, { x: 1, y: 1, onProgress });

            // expect registration of update handler
            expect( commit ).toHaveBeenNthCalledWith( 1, "setOnMovementUpdate", onProgress );
        });

        describe( "when buying an item from a shop", () => {
            it( "should deny the transaction when the player has insufficient funds", () => {
                const state  = { player: { inventory: { cash: 5 } } };
                const item   = { price: 10 };
                const commit = jest.fn();
                expect( actions.buyItem({ state, commit }, item )).toBe( false );
                expect( commit ).not.toHaveBeenCalled();
            });

            it( "should buy the item when the player has sufficient funds and move it to the player inventory", () => {
                const state  = { player: { inventory: { cash: 15 } } };
                const item   = { price: 10 };
                const commit = jest.fn();
                expect( actions.buyItem({ state, commit }, item )).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, "deductCash", item.price );
                expect( commit ).toHaveBeenNthCalledWith( 2, "removeItemFromShop", item );
                expect( commit ).toHaveBeenNthCalledWith( 3, "addItemToInventory", item );
            });
        });

        it( "should be able to sell an item to a shop", () => {
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

        describe( "when giving an inventory item to another Character", () => {
            const character = {
                properties: { intent: { type: 1, name: 1 } }
            };

            if( "should not give the item when the type or name does not meet the Characters intent", () => {
                const item = { type: 0, name: 0 };
                const commit = jest.fn();

                expect( actions.giveItemToCharacter({ commit }, { item, character })).toBe( false );
                item.type = 1; // type is now equal, but name isn't
                expect( actions.giveItemToCharacter({ commit }, { item, character })).toBe( false );
                expect( commit ).not.toHaveBeenCalled();
            });

            it( "should give the item when its type and name meets the Characters intent", () => {
                const item = { type: 1, name: 1 };
                const commit = jest.fn();

                expect( actions.giveItemToCharacter({ commit }, { item, character })).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, "addItemToCharacterInventory", { item, character });
                expect( commit ).toHaveBeenNthCalledWith( 2, "removeItemFromInventory", item);
            });
        });

        describe( "when booking a hotel room", () => {
            const hotel = { price: 10 };

            it( "should return without booking when the player has insufficient funds", async () => {
                const commit   = jest.fn();
                const dispatch = jest.fn();
                const state    = { player: { inventory: { cash: 5 } } };

                const success = await actions.bookHotelRoom({ state, getters: {}, commit, dispatch }, hotel );

                expect( success ).toBe( false );
                expect( commit ).not.toHaveBeenCalled();
                expect( dispatch ).not.toHaveBeenCalled();
            });

            it( "should complete the booking, restore health, deduct cash and leave the building when the player has sufficient funds", async () => {
                const commit   = jest.fn();
                const dispatch = jest.fn();
                const state    = { player: { hp: 1, maxHp: 10, inventory: { cash: 10 }, properties: { intoxication: 0 } } };
                const mockedGetters = { gameTime: new Date( "1986-08-29T23:59:31.000Z" ), translate: jest.fn() };

                const success = await actions.bookHotelRoom({ state, getters: mockedGetters, commit, dispatch }, hotel );

                expect( success ).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, "setGameTime", expect.any( Number ));
                expect( commit ).toHaveBeenNthCalledWith( 2, "setLastValidGameTime", expect.any( Number ));
                expect( commit ).toHaveBeenNthCalledWith( 3, "updatePlayer", { hp: state.player.maxHp });
                expect( commit ).toHaveBeenNthCalledWith( 4, "deductCash", hotel.price );
                expect( commit ).toHaveBeenNthCalledWith( 5, "setHotel", null );
                expect( commit ).toHaveBeenNthCalledWith( 6, "setScreen", SCREEN_GAME );
                expect( dispatch ).toHaveBeenCalledWith( "leaveBuilding" );
                expect( commit ).toHaveBeenNthCalledWith( 7, "removeCharactersOfType", DRAB );
                expect( commit ).toHaveBeenNthCalledWith( 8, "openDialog", expect.any( Object ));
            });

            it( "should advance the clock to tomorrow when successfully booked before midnight", async () => {
                const commit   = jest.fn();
                const dispatch = jest.fn();
                const state    = { player: { inventory: { cash: 10 }, properties: { intoxication: 0 }  } };
                const mockedGetters = { gameTime: new Date( "1986-08-29T23:59:31.000Z" ), translate: jest.fn() };

                await actions.bookHotelRoom({ state, getters: mockedGetters, commit, dispatch }, hotel );
                expect( commit ).toHaveBeenCalledWith( "setGameTime", new Date( `1986-08-30T${GAME_START_HOUR}:00:00.000Z` ).getTime() );
            });

            it( "should advance the clock to the start hour on the same day when successfully booked after midnight", async () => {
                const commit   = jest.fn();
                const dispatch = jest.fn();
                const state    = { player: { inventory: { cash: 10 }, properties: { intoxication: 0 } } };
                const mockedGetters = { gameTime: new Date( "1986-08-30T01:59:31.000Z" ), translate: jest.fn() };

                await actions.bookHotelRoom({ state, getters: mockedGetters, commit, dispatch }, hotel );
                expect( commit ).toHaveBeenCalledWith( "setGameTime", new Date( `1986-08-30T${GAME_START_HOUR}:00:00.000Z` ).getTime() );
            });

            it( "should sober up the player if the player was intoxicated", async () => {
                const commit   = jest.fn();
                const dispatch = jest.fn();
                const state = { player: { inventory: { cash: 10 }, properties: { intoxication: 0.25 } } };

                await actions.bookHotelRoom({ state, getters: { translate: jest.fn() }, commit, dispatch }, hotel );

                expect( dispatch ).toHaveBeenCalledWith( "soberUp" );
            });
        });

        it( "should be able to sober up an intoxicated player", async () => {
            const commit = jest.fn()
            const state  = { player: { id: "foo", properties: { intoxication: 1 } } };

            await actions.soberUp({ state, commit, getters: { translate: jest.fn(() => "" ) } });

            expect( commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByTargetAndMutation", { target: "foo", types: [ "setIntoxication" ] });
            expect( commit ).toHaveBeenNthCalledWith( 2, "setIntoxication", { value: 0 });
            expect( commit ).toHaveBeenNthCalledWith( 3, "showNotification", expect.any( String ));
        });
    });
});
