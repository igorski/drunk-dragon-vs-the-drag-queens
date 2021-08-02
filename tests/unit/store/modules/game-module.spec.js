import store               from "@/store/modules/game-module";
import CharacterFactory    from "@/model/factories/character-factory";
import EffectFactory       from "@/model/factories/effect-factory";
import { GAME_ACTIVE, GAME_PAUSED, GAME_OVER } from "@/definitions/game-states";
import { SCREEN_SHOP, SCREEN_GAME, SCREEN_CHARACTER_INTERACTION } from "@/definitions/screens";
import {
    GAME_START_TIME_UNIX, GAME_TIME_RATIO, VALIDITY_CHECK_INTERVAL
} from "@/definitions/constants";
const TIME_PER_RENDER_SLICE = 1000 / 60;

const { getters, mutations, actions } = store;

let mockUpdateFn;
jest.mock("@/model/actions/effect-actions", () => ({
    update: (...args) => mockUpdateFn(...args),
}));
jest.mock("@/model/factories/game-factory", () => ({
    assemble: (...args) => mockUpdateFn("assemble", ...args),
    disassemble: (...args) => mockUpdateFn("disassemble", ...args)
}));
jest.mock("@/model/factories/world-factory", () => ({
    create: (...args) => mockUpdateFn("create", ...args),
    populate: (...args) => mockUpdateFn("populate", ...args),
}));
jest.mock("store/dist/store.modern", () => ({
    get: (...args) => mockUpdateFn("get", ...args),
    set: (...args) => mockUpdateFn("set", ...args),
    remove: (...args) => mockUpdateFn("remove", ...args),
}));

describe( "Vuex game module", () => {
    describe( "getters", () => {
        it( "should return the active game state", () => {
            const state = { gameState: 2 };
            expect( getters.gameState( state )).toEqual( 2 );
        });
    });

    describe( "mutations", () => {
        it( "should be able to set the active game", () => {
            const state = {};
            const game = {
                created: Date.now(),
                modified: Date.now() + 2500,
                gameStart: Date.now() + 1000,
                lastSavedTime: Date.now() + 3000,
                gameTime: Date.now() - 100000,
                hash: "corge",
                effects: [{ foo: "bar" }]
            };
            mutations.setGame( state, game );
            expect( state ).toEqual({
                ...game,
                gameState: GAME_ACTIVE,
                lastValidGameTime: game.gameTime
            });
        });

        it( "should be able to set the game state", () => {
            const state = { gameState: 0 };
            mutations.setGameState( state, 2 );
            expect( state.gameState ).toEqual( 2 );
        });

        it( "should be able to set the last game render time", () => {
            const state = { lastRender: 0 };
            mutations.setLastRender( state, 100 );
            expect( state.lastRender ).toEqual( 100 );
        });

        it( "should be able to advance the current game time", () => {
            const now = Date.now();
            const state = { gameTime: now };
            const delta = 1000;
            mutations.advanceGameTime( state, delta );
            expect( state.gameTime ).toEqual( now + delta );
        });

        it( "should be able to set the current game time", () => {
            const now = Date.now();
            const state = { gameTime: 0 };
            mutations.setGameTime( state, now );
            expect( state.gameTime ).toEqual( now );
        });

        it( "should be able to set the last valid game time", () => {
            const state = { lastValidGameTime: 0 };
            mutations.setLastValidGameTime( state, 2000 );
            expect( state.lastValidGameTime ).toEqual( 2000 );
        });

        describe( "when adding time bound effects", () => {
            it( "should be able to add an effect to the game", () => {
                const state = { effects: [{ foo: "bar" }] };
                mutations.addEffect( state, { baz: "qux" });
                expect( state.effects ).toEqual( [{ foo: "bar" }, { baz: "qux" }] );
            });

            it( "should be able to remove an effect from the game", () => {
                const state = { effects: [{ foo: "bar" }, { baz: "qux" } ]};
                mutations.removeEffect( state, state.effects[ 0 ]);
                expect( state.effects ).toEqual([{ baz: "qux" }]);
            });

            it( "should be able to remove effects of specific mutation types", () => {
                const state = {
                    effects: [
                        { id: 1, mutation: "foo" },
                        { id: 2, mutation: "bar" },
                        { id: 3, mutation: "bar" },
                        { id: 4, mutation: "baz" },
                        { id: 5, mutation: "qux" },
                    ]
                };
                mutations.removeEffectsByMutation( state, [ "bar" ]);
                expect( state.effects ).toEqual([
                    { id: 1, mutation: "foo" },
                    { id: 4, mutation: "baz" },
                    { id: 5, mutation: "qux" }
                ]);
                mutations.removeEffectsByMutation( state, [ "foo", "qux" ]);
                expect( state.effects ).toEqual([ { id: 4, mutation: "baz" } ]);
            });

            it( "should be able to remove effects with specific callback actions", () => {
                const state = {
                    effects: [
                        { id: 1, callback: "foo" },
                        { id: 2, callback: "bar" },
                        { id: 3, callback: "bar" },
                        { id: 4, callback: "baz" },
                        { id: 5, callback: "qux" },
                    ]
                };
                mutations.removeEffectsByCallback( state, [ "bar" ]);
                expect( state.effects ).toEqual([
                    { id: 1, callback: "foo" },
                    { id: 4, callback: "baz" },
                    { id: 5, callback: "qux" }
                ]);
                mutations.removeEffectsByCallback( state, [ "foo", "qux" ]);
                expect( state.effects ).toEqual([ { id: 4, callback: "baz" } ]);
            });

            it( "should be able to remove effects for specific targets", () => {
                const state = {
                    effects: [
                        { id: 1, target: "foo", mutation: "fooMut" },
                        { id: 2, target: "bar", mutation: "barMut" },
                        { id: 3, target: "bar", mutation: "barMut2" },
                        { id: 4, target: "baz", mutation: "bazMut" },
                        { id: 5, target: "baz", mutation: "bazMut2" },
                    ]
                };
                mutations.removeEffectsByTargetAndMutation( state, { target: "bar", types: [ "barMut" ] });
                expect( state.effects ).toEqual([
                    { id: 1, target: "foo", mutation: "fooMut" },
                    { id: 3, target: "bar", mutation: "barMut2" },
                    { id: 4, target: "baz", mutation: "bazMut" },
                    { id: 5, target: "baz", mutation: "bazMut2" },
                ]);
                mutations.removeEffectsByTargetAndMutation( state, { target: "baz", types: [ "bazMut", "bazMut2" ] });
                expect( state.effects ).toEqual([
                    { id: 1, target: "foo", mutation: "fooMut" },
                    { id: 3, target: "bar", mutation: "barMut2" },
                ]);
            });
        });
    });

    describe( "actions", () => {
        it( "should be able to create a new game", async () => {
            const character = CharacterFactory.create();
            const world     = { foo: "bar" };
            const commit    = jest.fn();
            const dispatch  = jest.fn();
            mockUpdateFn    = jest.fn(() => world );

            await actions.createGame({ getters: { translate: jest.fn() }, commit, dispatch }, character );

            expect( commit ).toHaveBeenNthCalledWith( 1, "setGame", expect.any( Object ));
            expect( commit ).toHaveBeenNthCalledWith( 2, "setBuilding", null );
            expect( commit ).toHaveBeenNthCalledWith( 3, "setWorld", world );
            expect( commit ).toHaveBeenNthCalledWith( 4, "setPlayer", character );
            expect( commit ).toHaveBeenNthCalledWith( 5, "setLastRender", expect.any( Number ));
            expect( dispatch ).toHaveBeenCalledWith( "changeActiveEnvironment", world );
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, "create" );
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, "populate", world, expect.any( String ));
        });

        describe( "when storing the game", () => {
            it( "should be able to save the game state into local storage", () => {
                mockUpdateFn = jest.fn(() => "mockReturn");
                const state  = { foo: "bar" };
                const mockedGetters = { player: { baz: "qux" }, world: { quux: "quz" }, building: { corge: "grault" } };
                actions.saveGame({ state, getters: mockedGetters });
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, "disassemble", state, mockedGetters.player, mockedGetters.world, mockedGetters.building );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, "set", "rpg", "mockReturn" );
            });

            it( "should be able to restore a saved game from local storage when saved outside", async () => {
                const game     = { hash: "foo" };
                const world    = "bar";
                const player   = { quz: "corge" };
                mockUpdateFn   = jest.fn(() => ({ game, player, world, building: null }));
                const state    = {};
                const commit   = jest.fn();
                const dispatch = jest.fn();

                const success = await actions.loadGame({ state, commit, dispatch });

                expect( success ).toBe( true );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, "get", "rpg" );
                expect( commit ).toHaveBeenNthCalledWith( 1, "setGame", game );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setBuilding", null );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setWorld", world );
                expect( commit ).toHaveBeenNthCalledWith( 4, "setPlayer", player );
                expect( commit ).toHaveBeenNthCalledWith( 5, "setLastRender", expect.any( Number ));
                expect( dispatch ).toHaveBeenCalledWith( "changeActiveEnvironment", world );
            });

            it( "should be able to restore a saved game from local storage when saved inside a building", async () => {
                const game     = { hash: "foo" };
                const world    = "bar";
                const building = { floor: 0, floors: [{ qux: "quux" }] };
                const player   = { quz: "corge" };
                mockUpdateFn   = jest.fn(() => ({ game, player, world, building }));
                const state    = {};
                const commit   = jest.fn();
                const dispatch = jest.fn();

                const success = await actions.loadGame({ state, commit, dispatch });

                expect( success ).toBe( true );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, "get", "rpg" );
                expect( commit ).toHaveBeenNthCalledWith( 1, "setGame", game );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setBuilding", building );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setWorld", world );
                expect( commit ).toHaveBeenNthCalledWith( 4, "setPlayer", player );
                expect( commit ).toHaveBeenNthCalledWith( 5, "setLastRender", expect.any( Number ));
                expect( dispatch ).toHaveBeenCalledWith( "changeActiveEnvironment", building.floors[0] );
            });

            it( "should reset the game state if the save is corrupted", async () => {
                const game     = { hash: "foo" };
                mockUpdateFn   = jest.fn(() => game ); // fails as there is no player nor world
                const state    = {};
                const commit   = jest.fn();
                const dispatch = jest.fn();

                const success = await actions.loadGame({ state, commit, dispatch });

                expect( success ).toBe( false );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, "get", "rpg" );
                expect( dispatch ).toHaveBeenCalledWith( "resetGame" );
            });

            it( "should be able to import an exported save game", async () => {
                const encodedData = { h: "foo", w: "bar", p: "baz" };
                const game     = { hash: "foo" };
                const world    = "bar";
                const building = { baz: "qux" };
                const player   = { quux: {} };
                mockUpdateFn   = jest.fn(() => ({ game, player, world, building }));
                const commit   = jest.fn();
                const dispatch = jest.fn();

                await actions.importGame({ commit, dispatch }, encodedData );

                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, "assemble", encodedData );
                expect( commit ).toHaveBeenNthCalledWith( 1, "setGame", game );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setBuilding", building );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setWorld", world );
                expect( commit ).toHaveBeenNthCalledWith( 4, "setPlayer", player );
                expect( dispatch ).toHaveBeenNthCalledWith( 1, "saveGame" );
                expect( dispatch ).toHaveBeenNthCalledWith( 2, "loadGame" );
            });

            it( "should be able to reset an existing game and remove a saved game state from local storage", () => {
                mockUpdateFn = jest.fn();
                const commit = jest.fn();
                actions.resetGame({ commit });
                expect( mockUpdateFn ).toHaveBeenCalledWith( "remove", "rpg" );
                expect( commit ).toHaveBeenNthCalledWith( 1, "setGameState", GAME_PAUSED );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayer", null );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setScreen", expect.any( Number ));
            });
        });

        describe( "when updating the game properties", () => {
            const gameTime      = GAME_START_TIME_UNIX;
            const mockedGetters = {
                gameTime,
                translate: jest.fn(),
                activeEnvironment: {}
            };
            const createMockTimeCommit = () => {
                // when advanceGameTime is committed, we advance the mocked gameTime
                return jest.fn(( mutation, value ) => {
                    if ( mutation === "advanceGameTime" ) {
                        mockedGetters.gameTime += value; // value is delta in ms to progress time by
                    }
                });
            };

            it( "should not do anything when the game state is not active", () => {
                const state = { gameState: GAME_OVER };
                const commit = jest.fn();
                const dispatch = jest.fn();

                actions.updateGame({ commit, dispatch, getters: mockedGetters, state }, Date.now() );
                expect( commit ).not.toHaveBeenCalled();
                expect( dispatch ).not.toHaveBeenCalled();
            });

            it( "should be able to update the effects for an active game", () => {
                const commit    = jest.fn();
                const dispatch  = jest.fn();
                const effect1 = EffectFactory.create( "mutation1");
                const effect2 = EffectFactory.create( "mutation2");

                mockUpdateFn = jest.fn(({ commit, dispatch }, effect ) => {
                    // note that effect 2 we want to remove (by returning true)
                    if ( effect === effect2 ) return true;
                    return false;
                });

                actions.updateGame({
                    commit,
                    dispatch,
                    getters: mockedGetters,
                    state: {
                        gameState: GAME_ACTIVE,
                        effects: [ effect1, effect2 ],
                    },
                }, Date.now() );

                // assert Effects have been updated
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, { commit, dispatch }, effect1, gameTime );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, { commit, dispatch }, effect2, gameTime );

                // assert secondary effect has been requested to be removed (as its update returned true)
                expect( commit ).toHaveBeenCalledWith( "removeEffect", effect2 );
            });

            it( "should be able to verify the game validity periodically", () => {
                const commit    = createMockTimeCommit();
                const dispatch  = jest.fn();
                mockedGetters.isOutside = true;
                mockedGetters.gameTime  = gameTime;

                const timestamp = Date.now(); // timestamp used by zCanvas update handler
                const state = {
                    gameState: GAME_ACTIVE,
                    lastValidGameTime: gameTime - VALIDITY_CHECK_INTERVAL,
                    lastRender: timestamp - TIME_PER_RENDER_SLICE, // timestamp of previous "zCanvas update"
                    effects: []
                };
                actions.updateGame({ commit, dispatch, getters: mockedGetters, state }, timestamp );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setLastValidGameTime", mockedGetters.gameTime );
            });

            it( "should end the game when the player is caught outside at an invalid hour", () => {
                let commit    = createMockTimeCommit();
                let dispatch  = jest.fn();
                mockedGetters.isOutside = true;
                mockedGetters.gameTime  = gameTime + ( 7 * 60 * 60 * 1000 );

                const timestamp = Date.now(); // timestamp used by zCanvas update handler
                const state = {
                    gameState: GAME_ACTIVE,
                    lastValidGameTime: gameTime - VALIDITY_CHECK_INTERVAL,
                    lastRender: timestamp - TIME_PER_RENDER_SLICE, // timestamp of previous "zCanvas update"
                    effects: []
                };
                actions.updateGame({ commit, dispatch, getters: mockedGetters, state }, timestamp );
                expect( commit ).not.toHaveBeenNthCalledWith( 2, "setGameState", GAME_OVER );

                commit = createMockTimeCommit();

                // advance clock
                mockedGetters.gameTime = gameTime + ( 8 * 60 * 60 * 1000 );
                state.lastRender       = timestamp - TIME_PER_RENDER_SLICE;

                actions.updateGame({ commit, dispatch, getters: mockedGetters, state }, timestamp );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setGameState", GAME_OVER );
            });

            it( "should end the game when the player is inside a building after closing time", () => {
                let commit = createMockTimeCommit();
                let dispatch  = jest.fn();
                mockedGetters.isOutside = false;
                mockedGetters.gameTime  = gameTime + ( 6 * 60 * 60 * 1000 );

                const timestamp = Date.now(); // timestamp used by zCanvas update handler
                const state = {
                    gameState: GAME_ACTIVE,
                    lastValidGameTime: gameTime - VALIDITY_CHECK_INTERVAL,
                    lastRender: timestamp - TIME_PER_RENDER_SLICE, // timestamp of previous "zCanvas update"
                    effects: []
                };
                actions.updateGame({ commit, dispatch, getters: mockedGetters, state }, timestamp );
                expect( dispatch ).not.toHaveBeenNthCalledWith( 1, "leaveBuilding" );

                commit = createMockTimeCommit();

                // advance clock
                mockedGetters.gameTime = gameTime + ( 7 * 60 * 60 * 1000 );
                state.lastRender       = timestamp - TIME_PER_RENDER_SLICE;

                actions.updateGame({ commit, dispatch, getters: mockedGetters, state }, timestamp );
                expect( dispatch ).toHaveBeenNthCalledWith( 1, "leaveBuilding" );
            });
        });
    });
});
