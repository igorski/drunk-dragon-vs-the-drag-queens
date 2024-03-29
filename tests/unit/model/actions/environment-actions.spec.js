import { describe, it, expect, vi } from "vitest";
import EnvironmentActions from "@/model/actions/environment-actions";
import { BUILDING_TYPE }  from "@/model/factories/building-factory";
import CharacterFactory   from "@/model/factories/character-factory";
import EnvironmentFactory from "@/model/factories/environment-factory";
import { WORLD_TYPE, WORLD_TILES, getMaxWalkableTile } from "@/model/factories/world-factory";
import { indexToCoordinate } from "@/utils/terrain-util";

// mock pathfinder implementation
const mockPath = [{ x: 1, y: 2 }, { x: 2, y: 2 }];
let mockPathArgs;
vi.mock( "@/utils/path-finder", () => ({
    findPath: (...args) => {
        mockPathArgs = args;
        return mockPath;
    },
}));

vi.mock( "zcanvas", () => ({
    Loader: {
        onReady: new Promise(resolve => resolve())
    },
    Sprite: vi.fn()
}));

describe( "Environment actions", () => {
    describe( "When the movement of a Character to a target coordinate is requested", () => {
        const getters     = { gameTime: 5000 };
        const character   = CharacterFactory.create({ id: "foo", x: 1, y: 1 });
        const environment = EnvironmentFactory.create();
        const effectRequestObject = {
            callback: expect.any( String ),
            duration: expect.any( Number ),
            endValue: expect.any( Number ),
            increment: expect.any( Number ),
            mutation: expect.any( String ),
            startTime: expect.any( Number ),
            startValue: expect.any( Number ),
            target: character.id
        };

        it( "should always cancel the pending movements for the requested character", () => {
            const commit = vi.fn();
            EnvironmentActions.moveCharacter({ commit, getters }, character, environment, 0, 0 );
            expect( commit ).toHaveBeenNthCalledWith(
                1, "removeEffectsByTargetAndMutation",
                { target: character.id, types: [ "setCharacterXPosition", "setCharacterYPosition" ] }
            );
        });

        it( "should enqueue waypoints calculated on-the-fly from the source and target coordinates", () => {
            const commit = vi.fn();
            const targetX = 3;
            const targetY = 2;

            EnvironmentActions.moveCharacter({ commit, getters }, character, environment, targetX, targetY );

            const maxWalkableTile = getMaxWalkableTile( character );
            // assert path finder calculation was called with the appropriate arguments
            expect( mockPathArgs ).toEqual([
                environment, character.x, character.y, targetX, targetY, maxWalkableTile
            ]);

            // assert individual addition of each waypoint coordinate as an Effect
            expect( commit ).toHaveBeenNthCalledWith( 2, "addEffect", {
                ...effectRequestObject, endValue: mockPath[ 0 ].y // first is y-translation
            });
            expect( commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                ...effectRequestObject, endValue: mockPath[ 1 ].x // second is x-translation
            });
        });

        it( "should use default mutations during movement update", () => {
            const commit = vi.fn();
            EnvironmentActions.moveCharacter({ commit, getters }, character, environment, 5, 7 );
            // first is a Y translation
            expect( commit ).toHaveBeenNthCalledWith( 2, "addEffect", {
                ...effectRequestObject, callback: "hitTest", mutation: "setCharacterYPosition"
            });
            // second is a X translation
            expect( commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                ...effectRequestObject, callback: "hitTest", mutation: "setCharacterXPosition"
            });
        });

        it( "should use custom mutations during movement update, when provided", () => {
            const commit = vi.fn();
            EnvironmentActions.moveCharacter({ commit, getters }, character, environment, 5, 7, [], "xMut", "yMut", "upMut" );
            // first is a Y translation
            expect( commit ).toHaveBeenNthCalledWith( 2, "addEffect", {
                ...effectRequestObject, callback: "upMut", mutation: "yMut"
            });
            // second is a X translation
            expect( commit ).toHaveBeenNthCalledWith( 3, "addEffect", {
                ...effectRequestObject, callback: "upMut", mutation: "xMut"
            });
        });

        it( "should keep the first two existing movement Effects when requesting a new navigation before the previous completed", () => {
            const commit = vi.fn();
            const targetX = 3;
            const targetY = 3;
            const existing = [{ id: "effect1", endValue: 2 }, { id: "effect2", endValue: 2 }, { id: "effect3", endValue: 2 }];

            EnvironmentActions.moveCharacter({ commit, getters }, character, environment, targetX, targetY, existing );

            // expect the first two existing movements Effects to have been re-added to the queue
            expect( commit ).toHaveBeenNthCalledWith( 2, "addEffect", existing[ 0 ]);
            expect( commit ).toHaveBeenNthCalledWith( 3, "addEffect", existing[ 1 ]);
            // expect the mock calcuated waypoints to have been added as an Effect
            expect( commit ).toHaveBeenNthCalledWith( 4, "addEffect", {
                ...effectRequestObject, endValue: mockPath[ 0 ].y // first is y-translation
            });
            expect( commit ).toHaveBeenNthCalledWith( 5, "addEffect", {
                ...effectRequestObject, endValue: mockPath[ 1 ].x // second is x-translation
            });
        });
    });

    describe( "When hit testing the players location with an Object", () => {
        it( "should not take any action when the player is not touching any Object", () => {
            const dispatch    = vi.fn();
            const commit      = vi.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [{ x: 10, y: 11 }],
                shops: [{ x: 11, y: 10 }],
                buildings: [{ x: 11, y: 11 }],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( false );
            expect( dispatch ).not.toHaveBeenCalled();
            expect( commit ).not.toHaveBeenCalled();
        });

        it( "should interact with a character when the player collides with said character", () => {
            const dispatch    = vi.fn();
            const commit      = vi.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [{ x: 10, y: 10 }],
                shops: [],
                buildings: [],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "interactWithCharacter", environment.characters[ 0 ]);
        });

        it( "should enter a shop when the player collides with said shop", () => {
            const dispatch    = vi.fn();
            const commit      = vi.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [],
                shops: [{ x: 10, y: 10 }],
                buildings: [],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "enterShop", environment.shops[ 0 ]);
        });

        it( "should enter a building when the player collides with said building", () => {
            const dispatch    = vi.fn();
            const commit      = vi.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [],
                shops: [],
                buildings: [{ x: 10, y: 10 }],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "enterBuilding", environment.buildings[ 0 ]);
        });

        it( "should move to a lower floor when the player collides with the first exit inside a building", () => {
            const dispatch    = vi.fn();
            const commit      = vi.fn();
            const getters     = { floor : 1 };
            const environment = {
                x: 10,
                y: 10,
                type: BUILDING_TYPE,
                characters: [],
                shops: [],
                exits: [{ x: 10, y: 10 }, { x: 12, y: 12 }],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "changeFloor", getters.floor - 1 );
        });

        it( "should move to a higher floor when the player collides with the last exit inside a building", () => {
            const dispatch    = vi.fn();
            const commit      = vi.fn();
            const getters     = { floor : 1 };
            const environment = {
                x: 10,
                y: 10,
                type: BUILDING_TYPE,
                characters: [],
                shops: [],
                exits: [{ x: 8, y: 8 }, { x: 10, y: 10 }],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "changeFloor", getters.floor + 1 );
        });

        it ( "should enter the hotel when the player collides with a hotel counter", () => {
            const commit   = vi.fn();
            const dispatch = vi.fn();
            const getters  = { floor : 1 };
            const environment = {
                x: 10,
                y: 10,
                type: BUILDING_TYPE,
                characters: [],
                shops: [],
                exits: [],
                hotels: [{ x: 10, y: 10 }],
                items: [],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "enterHotel", environment.hotels[ 0 ]);
        });

        it( "should collect an item when the player collides with it", () => {
            const commit   = vi.fn();
            const dispatch = vi.fn();
            const getters  = { floor : 1 };
            const environment = {
                x: 5,
                y: 5,
                type: WORLD_TYPE,
                characters: [],
                shops: [],
                buildings: [],
                items: [{ x: 5, y: 5 }],
                terrain: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "collectItem", environment.items[ 0 ]);
        });

        it( "should enter the secret cave when the player reaches its entrance", () => {
            const commit   = vi.fn();
            const dispatch = vi.fn();
            const terrain = new Array( 16 ).fill( WORLD_TILES.GROUND );
            terrain[ 8 ] = WORLD_TILES.CAVE;
            const environment = {
                width      : 4,
                height     : 4,
                type       : WORLD_TYPE,
                characters : [],
                shops      : [],
                exits      : [],
                terrain
            };
            // position player at cave entrance
            const { x, y } = indexToCoordinate( 8, environment );
            environment.x = x;
            environment.y = y;

            expect( EnvironmentActions.hitTest({ commit, dispatch }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( "enterCave", true );
        });
    });
});
