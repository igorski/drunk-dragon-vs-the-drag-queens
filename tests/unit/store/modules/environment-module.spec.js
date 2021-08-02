import store from "@/store/modules/environment-module";
import { QUEEN, DRAB, DRAGON } from "@/definitions/character-types";
import CharacterFactory from "@/model/factories/character-factory";
import EffectFactory from "@/model/factories/effect-factory";
import { WORLD_TYPE } from "@/model/factories/world-factory";
import { GAME_ACTIVE, GAME_OVER } from "@/definitions/game-states";
import {
    SCREEN_SHOP, SCREEN_HOTEL, SCREEN_GAME, SCREEN_CHARACTER_INTERACTION, SCREEN_BATTLE
} from "@/definitions/screens";
import { GAME_START_TIME, GAME_TIME_RATIO, VALIDITY_CHECK_INTERVAL } from "@/definitions/constants";

const { getters, mutations, actions } = store;

let mockUpdateFn;
let mockValue;
jest.mock("@/model/factories/building-factory", () => ({
    generateFloors: (...args) => mockUpdateFn("generateFloors", ...args),
    BUILDING_TILES: { GROUND: 0 },
}));
jest.mock("@/model/factories/intent-factory", () => ({
    create: (...args) => mockUpdateFn("create", ...args),
}));
jest.mock("@/model/factories/shop-factory", () => ({
    generateItems: (...args) => mockUpdateFn("generateItems", ...args),
}));
jest.mock("@/services/environment-bitmap-cacher", () => ({
    renderEnvironment: async (...args) => {
        return mockUpdateFn("renderEnvironment", ...args);
    }
}));
jest.mock("@/utils/terrain-util", () => ({
    getFirstFreeTileOfTypeAroundPoint: () => ({ x: 0, y: 0 }),
    positionInReachableDistanceFromPoint: () => mockValue,
    getRandomFreeTilePosition: () => mockValue
}));
jest.mock("@/utils/sprite-cache", () => ({
    ENV_BUILDING: {},
    flushSpriteForCharacter: (...args) => mockUpdateFn("flushSpriteForCharacter", ...args),
    flushAllSprites: (...args) => mockUpdateFn("flushAllSprites", ...args),
}));

describe( "Vuex environment module", () => {
    describe( "getters", () => {
        it( "should return the world", () => {
            const state = { world: { foo: "bar" } };
            expect( getters.world( state )).toEqual( state.world );
        });

        it( "should return the active environment", () => {
            const state = { activeEnvironment: { foo: "bar" } };
            expect( getters.activeEnvironment( state )).toEqual( state.activeEnvironment );
        });

        it( "should return the entered building", () => {
            const state = { building: { floor: 0, floors: [{ foo: "bar" } ] } };
            expect( getters.building( state )).toEqual( state.building );
        });

        it( "should return the character the player is currently interacting with", () => {
            const state = { character: { foo: "bar" } };
            expect( getters.character( state )).toEqual( state.character );
        });

        it( "should return the dragon, when outside", () => {
            const state = {
                world: {
                    id: "world",
                    characters: [
                        CharacterFactory.create({ type: QUEEN }),
                        CharacterFactory.create({ type: DRAGON }),
                        CharacterFactory.create({ type: QUEEN })
                    ],
                },
                activeEnvironment: { id: "somethingElse", characters: [] },
            };
            expect( getters.dragon( state )).toBeNull();
            state.activeEnvironment = state.world;
            expect( getters.dragon( state )).toEqual( state.world.characters[ 1 ] );
        });

        it( "should return the active floor, when in a building", () => {
            const state = { building: null };
            expect( getters.floor( state )).toEqual( NaN );
            state.building = { floor: 2 };
            expect( getters.floor( state )).toEqual( 2 );
        });

        it( "should return the active shop, when one is entered", () => {
            const state = { shop: { foo: "bar" } };
            expect( getters.shop( state )).toEqual( state.shop );
        });

        describe( "when determining whether the player is outside", () => {
            it( "should know when the player is inside a building", () => {
                const state = { building: { foo: "bar "} };
                expect( getters.isOutside( state )).toBe( false );
            });

            it( "should know when the player is inside a shop", () => {
                const state = { building: { shop: "bar "} };
                expect( getters.isOutside( state )).toBe( false );
            });

            it( "should know when the player is not inside a building or shop", () => {
                const state = { building: null, shop: null };
                expect( getters.isOutside( state )).toBe( true );
            });
        });
    });

    describe( "mutations", () => {
        it( "should be able to set the world", () => {
            const state = { world: null };
            const world = { foo: "bar" };
            mutations.setWorld( state, world );
            expect( state.world ).toEqual( world );
        });

        describe( "when changing player position", () => {
            it( "should be able to update the player x position in the current environment", () => {
                const state = { activeEnvironment: { x: 0, y: 0 } };
                mutations.setXPosition( state, { value: 10 });
                expect( state.activeEnvironment ).toEqual({ x: 10, y: 0 });
            });

            it( "should be able to update the player y position in the current environment", () => {
                const state = { activeEnvironment: { x: 0, y: 0 } };
                mutations.setYPosition( state, { value: 10 });
                expect( state.activeEnvironment ).toEqual({ x: 0, y: 10 });
            });

            it( "should be able to set the active environment", () => {
                const state = { activeEnvironment: null };
                const env = { foo: "bar" };
                mockUpdateFn = jest.fn();
                mutations.setActiveEnvironment( state, env );
                expect( mockUpdateFn ).toHaveBeenCalledWith( "flushAllSprites" );
                expect( state.activeEnvironment ).toEqual( env );
            });

            it( "should be able to set the active shop", () => {
                const state = { shop: null };
                const shop = { foo: "bar" };
                mutations.setShop( state, shop );
                expect( state.shop ).toEqual( shop );
            });

            it( "should be able to set the active hotel", () => {
                const state = { hotel: null };
                const hotel = { foo: "bar" };
                mutations.setHotel( state, hotel );
                expect( state.hotel ).toEqual( hotel );
            });

            it( "should be able to add a specific item to the currently visited shop", () => {
                const state = { shop: { items: [{ foo: "bar" }] } };
                const item = { baz: "qux" };
                mutations.addItemToShop( state, item );
                expect( state.shop.items ).toEqual([{ foo: "bar" }, { baz: "qux" }])
            });

            it( "should be able to remove a specific item from the currently visited shop", () => {
                const item  = { foo: "bar" };
                const state = { shop: { items: [{ baz: "qux" }, item ] } };
                mutations.removeItemFromShop( state, item );
                expect( state.shop.items ).toEqual([{ baz: "qux" }]);
            });

            it( "should be able to set the active building", () => {
                const state = { building: null };
                const building = { foo: "bar" };
                mutations.setBuilding( state, building );
                expect( state.building ).toEqual( building );
            });

            it( "should be able to set the current floor in the active building", () => {
                const state = { building: { foo: "bar", floor: 0 } };
                mutations.setFloor( state, 1 );
                expect( state.building.floor ).toEqual( 1 );
            });

            it( "should be able to set the character the player is interacting with", () => {
                const state = { character: null };
                const character = { foo: "bar" };
                mutations.setCharacter( state, character );
                expect( state.character ).toEqual( character );
            });

            it( "should be able to update an environments Character properties", () => {
                const state = {
                    activeEnvironment: {
                        characters: [ CharacterFactory.create({ x: 10, y: 11, hp: 10, type: DRAGON }) ]
                    }
                };
                const character = state.activeEnvironment.characters[0];
                const { appearance, inventory, properties } = character;
                const updatedCharacter = {
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
                mutations.updateCharacter( state, { ...character, ...updatedCharacter });
                expect( state.activeEnvironment.characters[0] ).toEqual({
                    id: expect.any( String ),
                    hp: 195,
                    maxHp: 200,
                    xp: 100,
                    x: 12,
                    y: 13,
                    type: DRAGON,
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

            it( "should be able to remove a Character from the currently active environment", () => {
                const character1 = { id: 1, foo: "bar" };
                const character2 = { id: 2, baz: "qux" };
                const state = {
                    character: character2,
                    activeEnvironment: {
                        characters: [ character1, character2 ]
                    }
                };
                mockUpdateFn = jest.fn();
                mutations.removeCharacter( state, character2 );

                expect( state.activeEnvironment.characters ).toEqual([ { id: 1, foo: "bar" }]);
                expect( state.character ).toBeNull();
                expect( mockUpdateFn ).toHaveBeenCalledWith( "flushSpriteForCharacter", character2 );
            });

            it( "should be able to remove Characters by their type from the active environment", () => {
                const state = {
                    activeEnvironment: {
                        characters: [{ id: 1, type: 0 }, { id: 2, type: 1 }, { id: 3, type: 0 }, { id: 4, type: 1 }]
                    }
                };
                mutations.removeCharactersOfType( state, 1 );
                expect( state.activeEnvironment.characters ).toEqual([ { id: 1, type: 0 }, { id: 3, type: 0 }]);
            });

            it( "should be able to mark the visited terrain for the current environment with deduplication", () => {
                const state = {
                    activeEnvironment: {
                        visitedTerrain: [ 0, 1, 2 ]
                    }
                };
                mutations.markVisitedTerrain( state, [ 1, 2, 3, 4, 5 ] );
                expect( state.activeEnvironment.visitedTerrain ).toEqual([ 0, 1, 2, 3, 4, 5 ]);
            });
        });

        it( "should be able to add an item to the inventory of a Character in the currently active environment", () => {
            const state = {
                activeEnvironment: {
                    characters: [
                        { id: 1, foo: "bar", inventory: { items: [{ quz: "quuz" }] } },
                        { id: 2, baz: "qux", inventory: { items: [] } }
                    ]
                }
            };
            const item = { quux: "corge" };
            const character = state.activeEnvironment.characters[ 0 ];
            mutations.addItemToCharacterInventory( state, { item, character });
            expect(state.activeEnvironment.characters).toEqual([
                { id: 1, foo: "bar", inventory: { items: [{ quz: "quuz" }, item ] } },
                { id: 2, baz: "qux", inventory: { items: [] }}
            ]);
        });

        it( "should be able to flush all cached Bitmaps for the current environment", () => {
            const state = {
                activeEnvironment: {
                    characters: [
                        { foo: "bar", bitmap: "baz" },
                        { qux: "quz", bitmap: "quuz" }
                    ]
                }
            };
            mutations.flushBitmaps( state );
            expect( state.activeEnvironment.characters ).toEqual([
                { foo: "bar" }, { qux: "quz" }
            ]);
        });
    });

    describe( "actions", () => {
        describe( "when navigating through the game world", () => {
            describe( "and entering/leaving a shop", () => {
                it( "should be able to enter a shop, generating stock when it has no items upon entry", () => {
                    const shop = { foo: "bar", items: [] };
                    const state = { player: { baz: "qux" } };
                    const commit = jest.fn();
                    const mockedGetters = { gameTime: 1000 };
                    mockUpdateFn = jest.fn();
                    actions.enterShop({ state, getters: mockedGetters, commit }, shop );

                    expect( mockUpdateFn ).toHaveBeenCalledWith( "generateItems", shop, expect.any( Number ));
                    expect( commit ).toHaveBeenNthCalledWith( 1, "setShop", shop );
                    expect( commit ).toHaveBeenNthCalledWith( 2, "setScreen", SCREEN_SHOP );
                    expect( commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                        mutation: null, startTime: mockedGetters.gameTime, duration: 60000 * GAME_TIME_RATIO,
                        startValue: expect.any( Number ), endValue: expect.any( Number ),
                        increment: expect.any( Number ), callback: "handleShopTimeout", target: null
                    });
                });

                it( "should be able to enter a shop, not generating new items when there are stil in stock", () => {
                    const shop          = { foo: "bar", items: [{ baz: "qux" }]};
                    const state         = { player: { baz: "qux" } };
                    const commit        = jest.fn();
                    const mockedGetters = { gameTime: 1000 };
                    mockUpdateFn        = jest.fn();
                    actions.enterShop({ state, commit, getters: mockedGetters }, shop );

                    expect( mockUpdateFn ).not.toHaveBeenCalledWith( "generateItems", shop, expect.any( Number ));
                    expect( commit ).toHaveBeenNthCalledWith( 1, "setShop", shop );
                    expect( commit ).toHaveBeenNthCalledWith( 2, "setScreen", SCREEN_SHOP );
                    expect( commit ).toHaveBeenNthCalledWith( 3, "addEffect", expect.any( Object ));
                });

                it( "should be able to remove the pending callback effect when leaving the shop", () => {
                    const commit = jest.fn();
                    actions.leaveShop({ commit });
                    expect( commit ).toHaveBeenCalledWith( "removeEffectsByCallback", [ "handleShopTimeout" ]);
                });

                it( "should be able to handle the timeout when staying in the shop for too long", () => {
                    const commit        = jest.fn();
                    const dispatch      = jest.fn();
                    const mockedGetters = { translate: jest.fn() };

                    actions.handleShopTimeout({ commit, dispatch, getters: mockedGetters });

                    expect( commit ).toHaveBeenNthCalledWith( 1, "openDialog", expect.any( Object ));
                    expect( commit ).toHaveBeenNthCalledWith( 2, "setScreen", SCREEN_GAME );
                    expect( dispatch ).toHaveBeenCalledWith( "leaveShop" );
                });
            });

            it( "should be able to enter a hotel", () => {
                const commit = jest.fn();
                const hotel  = { foo: "bar" };
                actions.enterHotel({ commit }, hotel );
                expect( commit ).toHaveBeenNthCalledWith( 1, "setHotel", hotel );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setScreen", SCREEN_HOTEL );
            });

            it( "should be able to enter a building", () => {
                const state         = { hash: "foo" };
                const building      = { baz: "qux" };
                const commit        = jest.fn();
                const dispatch      = jest.fn();
                const mockedGetters = { player: { baz: "qux" } };
                mockUpdateFn        = jest.fn();

                actions.enterBuilding({ state, getters: mockedGetters, commit, dispatch }, building );

                expect( mockUpdateFn ).toHaveBeenCalledWith( "generateFloors", state.hash, building, mockedGetters.player );
                expect( commit ).toHaveBeenCalledWith( "setBuilding", building );
                expect( dispatch ).toHaveBeenCalledWith( "changeFloor", 0 );
            });

            it( "should be able to change currently the active environment", async () => {
                const state         = { activeEnvironment: { foo: "bar" } };
                const commit        = jest.fn();
                const dispatch      = jest.fn();
                const mockedGetters = { player: { baz: "qux" }, dragon: { id: "dragonId" } };
                mockUpdateFn        = jest.fn();

                const newEnvironment = { type: WORLD_TYPE, baz: "qux" };
                await actions.changeActiveEnvironment({ state, getters: mockedGetters, commit, dispatch }, newEnvironment );

                expect( commit ).toHaveBeenNthCalledWith( 1, "flushBitmaps" );
                expect( dispatch ).toHaveBeenNthCalledWith( 1, "cancelCharacterMovements" );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setActiveEnvironment", newEnvironment );
                expect( dispatch ).toHaveBeenNthCalledWith( 2, "positionCharacter", { id: "dragonId", distance: expect.any( Number ) });
                expect( commit ).toHaveBeenNthCalledWith( 3, "setLoading", true );
                expect( mockUpdateFn ).toHaveBeenCalledWith( "renderEnvironment", newEnvironment, mockedGetters.player );
                expect( commit ).toHaveBeenNthCalledWith( 4, "setLoading", false );
            });

            describe( "when changing floors within a building", () => {
                const state  = {
                    activeEnvironment: { foo : "bar" },
                    building: { baz: "qux", floors: [{ quux: "quz" }, { corge: "grault" }] }
                };

                it( "should leave the building when going back up the first stairway", () => {
                    const commit   = jest.fn();
                    const dispatch = jest.fn();

                    actions.changeFloor({ state, commit, dispatch }, -1 );

                    expect( dispatch ).toHaveBeenCalledWith( "leaveBuilding" );
                });

                it( "should be able to change floors within a building", async () => {
                    const commit        = jest.fn();
                    const dispatch      = jest.fn();
                    const mockedGetters = { activeEnvironment: { exits: [{ x: 0 }, { y: 0 }] } };

                    await actions.changeFloor({ state, getters: mockedGetters, commit, dispatch }, 1 );

                    expect( commit ).toHaveBeenCalledWith( "setFloor", 1 );
                    expect( dispatch ).toHaveBeenCalledWith( "changeActiveEnvironment", expect.any( Object ));
                });
            });

            it( "should be able to leave a building", () => {
                const state    = { game: { world: { foo: "bar" } } };
                const commit   = jest.fn();
                const dispatch = jest.fn();

                actions.leaveBuilding({ state, commit, dispatch });

                expect( commit ).toHaveBeenCalledWith( "setBuilding", null );
                expect( dispatch ).toHaveBeenCalledWith( "changeActiveEnvironment", state.world );
            });

            describe( "and interacting with a character", () => {
                it( "should be able to interact with another Queen", () => {
                    const commit    = jest.fn();
                    const character = CharacterFactory.create({ type: QUEEN });
                    mockUpdateFn    = jest.fn();

                    actions.interactWithCharacter({ commit }, character );

                    expect( mockUpdateFn ).toHaveBeenCalledWith( "create" );
                    expect( commit ).toHaveBeenNthCalledWith( 1, "setCharacter", character );
                    expect( commit ).toHaveBeenNthCalledWith( 2, "setScreen", SCREEN_CHARACTER_INTERACTION );
                });

                it( "should start a battle when interacting with a non-Queen character", () => {
                    const commit    = jest.fn();
                    const dispatch  = jest.fn();
                    const character = CharacterFactory.create({ type: DRAGON });
                    mockUpdateFn    = jest.fn();

                    actions.interactWithCharacter({ commit, dispatch }, character );

                    expect( mockUpdateFn ).not.toHaveBeenCalledWith( "create" );
                    expect( dispatch ).toHaveBeenNthCalledWith( 1, "startBattle", character );
                    expect( commit ).toHaveBeenNthCalledWith( 1, "setScreen", SCREEN_BATTLE );
                });
            });
        });

        it( "should be able to generate a requested amount of Characters by type", () => {
            const mockedGetters = {
                activeEnvironment: {
                    // one pre-existing Character
                    characters: [ CharacterFactory.create({ type: DRAGON }) ],
                },
                player: { maxHp: 10, level: 1 }
            };
            mockValue = { x: 6, y: 6 }; // for positionInReachableDistanceFromPoint

            const amount = 10;
            actions.generateCharacters({ getters: mockedGetters }, { type: DRAB, amount });
            expect( mockedGetters.activeEnvironment.characters ).toHaveLength( amount + 1 );
        });

        it( "should be able to update a Characters position", () => {
            const character = CharacterFactory.create({ type: DRAGON });
            const mockedGetters = { world: { characters: [ character ]} };
            const commit = jest.fn();

            const x = 6;
            const y = 7;
            mockValue = { x, y };

            actions.positionCharacter({ getters: mockedGetters, commit }, { id: character.id, distance: 40 });

            expect( commit ).toHaveBeenNthCalledWith( 1, "updateCharacter", { ...character, ...mockValue });
        });

        it( "should be able to cancel all pending Player and Character movements", () => {
            const state = {
                activeEnvironment: {
                    characters: [{ id: 1 }, { id: 2 }]
                }
            };
            const commit = jest.fn();
            actions.cancelCharacterMovements({ state, commit });

            expect( commit ).toHaveBeenNthCalledWith( 1, "removeEffectsByMutation", [ "setXPosition", "setYPosition" ]);
            expect( commit ).toHaveBeenNthCalledWith( 2, "removeEffectsByTargetAndMutation", {
                target: state.activeEnvironment.characters[ 0 ].id,
                types: [ "setCharacterXPosition", "setCharacterYPosition" ]
            });
            expect( commit ).toHaveBeenNthCalledWith( 3, "removeEffectsByTargetAndMutation", {
                target: state.activeEnvironment.characters[ 1 ].id,
                types: [ "setCharacterXPosition", "setCharacterYPosition" ]
            });
        });
    });
});
