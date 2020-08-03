import store            from '@/store/modules/game-module';
import CharacterFactory from '@/model/factories/character-factory';
import EffectFactory    from '@/model/factories/effect-factory';
import { SCREEN_SHOP, SCREEN_CHARACTER_INTERACTION } from '@/definitions/screens';

const { getters, mutations, actions } = store;

let mockUpdateFn;
jest.mock('@/model/actions/effect-actions', () => ({
    update: (...args) => mockUpdateFn(...args),
}));
jest.mock('@/model/factories/building-factory', () => ({
    generateFloors: (...args) => mockUpdateFn('generateFloors', ...args),
}));
jest.mock('@/model/factories/game-factory', () => ({
    assemble: (...args) => mockUpdateFn('assemble', ...args),
    disassemble: (...args) => mockUpdateFn('disassemble', ...args)
}));
jest.mock('@/model/factories/intent-factory', () => ({
    create: (...args) => mockUpdateFn('create', ...args),
}));
jest.mock('@/model/factories/shop-factory', () => ({
    generateItems: (...args) => mockUpdateFn('generateItems', ...args),
}));
jest.mock('@/model/factories/world-factory', () => ({
    create: (...args) => mockUpdateFn('create', ...args),
    populate: (...args) => mockUpdateFn('populate', ...args),
}));
jest.mock('@/services/environment-bitmap-cacher', () => ({
    renderEnvironment: async (...args) => {
        return mockUpdateFn('renderEnvironment', ...args);
    }
}));
jest.mock('store/dist/store.modern', () => ({
    get: (...args) => mockUpdateFn('get', ...args),
    set: (...args) => mockUpdateFn('set', ...args),
    remove: (...args) => mockUpdateFn('remove', ...args),
}));

describe('Vuex game module', () => {
    describe('getters', () => {
        it('should return the active environment', () => {
            const state = { activeEnvironment: { foo: 'bar' } };
            expect( getters.activeEnvironment( state )).toEqual( state.activeEnvironment );
        });

        it('should return the active floor, when in a building', () => {
            const state = { building: null };
            expect( getters.floor( state )).toEqual( NaN );
            state.building = { floor: 2 };
            expect( getters.floor( state )).toEqual( 2 );
        });

        it('should return the character the player is currently interacting with', () => {
            const state = { character: { foo: 'bar' } };
            expect( getters.character( state )).toEqual( state.character );
        });
    });

    describe('mutations', () => {
        it('should be able to set the active game', () => {
            const state = {};
            const game = {
                created: Date.now(),
                modified: Date.now() + 2500,
                gameStart: Date.now() + 1000,
                lastSavedTime: Date.now() + 3000,
                gameTime: Date.now() - 100000,
                building: { baz: 'qux' },
                world: { quux: 'quuz' },
                hash: 'corge',
            };
            mutations.setGame( state, game );
            expect( state ).toEqual( game );
        });

        it('should be able to set the last game render time', () => {
            const state = { lastRender: 0 };
            mutations.setLastRender( state, 100 );
            expect( state.lastRender ).toEqual( 100 );
        });

        it('should be able to advance the current game time', () => {
            const now = Date.now();
            const state = { gameTime: now };
            const delta = 1000;
            mutations.advanceGameTime( state, delta );
            expect( state.gameTime ).toEqual( now + delta );
        });

        describe('when changing player position', () => {
            it('should be able to update the player x position in the current environment', () => {
                const state = { activeEnvironment: { x: 0, y: 0 } };
                mutations.setXPosition( state, 10 );
                expect( state.activeEnvironment ).toEqual({ x: 10, y: 0 });
            });

            it('should be able to update the player y position in the current environment', () => {
                const state = { activeEnvironment: { x: 0, y: 0 } };
                mutations.setYPosition( state, 10 );
                expect( state.activeEnvironment ).toEqual({ x: 0, y: 10 });
            });

            it('should be able to set the active environment', () => {
                const state = { activeEnvironment: null };
                const env = { foo: 'bar' };
                mutations.setActiveEnvironment( state, env );
                expect( state.activeEnvironment ).toEqual( env );
            });

            it('should be able to set the active shop', () => {
                const state = { shop: null };
                const shop = { foo: 'bar' };
                mutations.setShop( state, shop );
                expect( state.shop ).toEqual( shop );
            });

            it('should be able to set the active building', () => {
                const state = { building: null };
                const building = { foo: 'bar' };
                mutations.setBuilding( state, building );
                expect( state.building ).toEqual( building );
            });

            it('should be able to set the current floor in the active building', () => {
                const state = { building: { foo: 'bar', floor: 0 } };
                mutations.setFloor( state, 1 );
                expect( state.building.floor ).toEqual( 1 );
            });

            it('should be able to set the character the player is interacting with', () => {
                const state = { character: null };
                const character = { foo: 'bar' };
                mutations.setCharacter( state, character );
                expect( state.character ).toEqual( character );
            });

            it('should be able to mark the visited terrain for the current environment with deduplication', () => {
                const state = {
                    activeEnvironment: {
                        visitedTerrain: [ 0, 1, 2 ]
                    }
                };
                mutations.markVisitedTerrain( state, [ 1, 2, 3, 4, 5 ] );
                expect( state.activeEnvironment.visitedTerrain ).toEqual([ 0, 1, 2, 3, 4, 5 ]);
            });

            it('should be able to flush all cached Bitmaps for the current environment', () => {
                const state = {
                    activeEnvironment: {
                        characters: [
                            { foo: 'bar', bitmap: 'baz' },
                            { qux: 'quz', bitmap: 'quuz' }
                        ]
                    }
                };
                mutations.flushBitmaps( state );
                expect( state.activeEnvironment.characters ).toEqual([
                    { foo: 'bar' }, { qux: 'quz' }
                ]);
            });
        });

        describe('when adding time bound effects', () => {
            it('should be able to add an effect to the game', () => {
                const state = { effects: [{ foo: 'bar' }] };
                mutations.addEffect( state, { baz: 'qux' });
                expect( state.effects ).toEqual( [{ foo: 'bar' }, { baz: 'qux' }] );
            });

            it('should be able to remove an effect from the game', () => {
                const state = { effects: [{ foo: 'bar' }, { baz: 'qux' } ]};
                mutations.removeEffect( state, state.effects[ 0 ]);
                expect( state.effects ).toEqual([{ baz: 'qux' }]);
            });

            it('should be able to remove effects of specific action types', () => {
                const state = {
                    effects: [
                        { id: 1, action: 'foo' },
                        { id: 2, action: 'bar' }, { id: 3, action: 'bar' },
                        { id: 4, action: 'baz' },
                        { id: 5, action: 'qux' },
                    ]
                };
                mutations.removeEffectsByAction( state, [ 'bar' ]);
                expect( state.effects ).toEqual([
                    { id: 1, action: 'foo' },
                    { id: 4, action: 'baz' },
                    { id: 5, action: 'qux' }
                ]);
                mutations.removeEffectsByAction( state, [ 'foo', 'qux' ]);
                expect( state.effects ).toEqual([ { id: 4, action: 'baz' } ]);
            });

            it('should be able to remover a specific item from the currently visited shop', () => {
                const item  = { foo: 'bar' };
                const state = { shop: { items: [{ baz: 'qux' }, item ] } };
                mutations.removeItemFromShop( state, item );
                expect( state.shop.items ).toEqual([{ baz: 'qux' }]);
            });
        });
    });

    describe('actions', () => {
        it('should be able to create a new game', async () => {
            const character = CharacterFactory.create();
            const world     = { foo: 'bar' };
            const commit    = jest.fn();
            const dispatch  = jest.fn();
            mockUpdateFn    = jest.fn(() => world );

            await actions.createGame({ commit, dispatch }, character );

            expect( commit ).toHaveBeenNthCalledWith( 1, 'setGame', expect.any( Object ));
            expect( commit ).toHaveBeenNthCalledWith( 2, 'setPlayer', character );
            expect( commit ).toHaveBeenNthCalledWith( 3, 'setLastRender', expect.any( Number ));
            expect( dispatch ).toHaveBeenCalledWith( 'changeActiveEnvironment', world );
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'create' );
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, 'populate', world, expect.any( String ));
        });

        describe('when storing the game', () => {
            it('should be able to save the game state into local storage', () => {
                mockUpdateFn = jest.fn(() => 'mockReturn');
                const state  = { foo: 'bar' };
                const mockedGetters = { player: { baz: 'qux' } };
                actions.saveGame({ state, getters: mockedGetters });
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'disassemble', state, mockedGetters.player );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, 'set', 'rpg', 'mockReturn' );
            });

            it('should be able to restore a saved game from local storage', async () => {
                const game     = { hash: 'foo', world: 'bar' };
                const player   = { baz: 'qux' };
                mockUpdateFn   = jest.fn(() => ({ game, player }));
                const state    = { activeEnvironment: null };
                const commit   = jest.fn();
                const dispatch = jest.fn();

                const success = await actions.loadGame({ state, commit, dispatch });

                expect( success ).toBe( true );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'get', 'rpg' );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setGame', game );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setPlayer', player );
                expect( dispatch ).toHaveBeenCalledWith( 'changeActiveEnvironment', game.world );
                //expect( commit ).toHaveBeenNthCalledWith( 4, 'setLastRender', Date.now() );
            });

            it('should reset the game state if the save is corrupted', async () => {
                const game = { hash: 'foo' };
                mockUpdateFn = jest.fn(() => game);
                const state = { activeEnvironment: null };
                const commit = jest.fn();
                const dispatch = jest.fn();

                const success = await actions.loadGame({ state, commit, dispatch });

                expect( success ).toBe( false );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'get', 'rpg' );
                expect( dispatch ).toHaveBeenCalledWith( 'resetGame' );
                expect( commit ).toHaveBeenCalledWith( 'setScreen', expect.any( Number ));
            });

            it('should be able to import an exported save game', async () => {
                const encodedData = { h: 'foo', w: 'bar', p: 'baz' };
                const game = { hash: 'foo', world: 'bar' };
                const player = { baz: 'qux' };
                mockUpdateFn = jest.fn(() => ({ game, player }));
                const commit = jest.fn();
                const dispatch = jest.fn();

                await actions.importGame({ commit, dispatch }, encodedData );

                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'assemble', encodedData );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setGame', game );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setPlayer', player );
                expect( dispatch ).toHaveBeenNthCalledWith( 1, 'saveGame' );
                expect( dispatch ).toHaveBeenNthCalledWith( 2, 'loadGame' );
            });

            it('should be able to remove a saved game state from local storage', () => {
                mockUpdateFn = jest.fn();
                actions.resetGame();
                expect( mockUpdateFn ).toHaveBeenCalledWith( 'remove', 'rpg' );
            });
        });

        describe('when navigating through the game world', () => {
            describe('and entering a shop', () => {
                it('should be able to enter a shop, generating stock when it has no items upon entry', () => {
                    const shop = { foo: 'bar', items: [] };
                    const state = { player: { baz: 'qux' } };
                    const commit = jest.fn();
                    mockUpdateFn = jest.fn();
                    actions.enterShop({ state, commit }, shop );

                    expect( mockUpdateFn ).toHaveBeenCalledWith( 'generateItems', shop, expect.any( Number ));
                    expect( commit ).toHaveBeenNthCalledWith( 1, 'setShop', shop );
                    expect( commit ).toHaveBeenNthCalledWith( 2, 'setScreen', SCREEN_SHOP );
                });

                it('should be able to enter a shop, not generating new items when there are stil in stock', () => {
                    const shop = { foo: 'bar', items: [{ baz: 'qux' }]};
                    const state = { player: { baz: 'qux' } };
                    const commit = jest.fn();
                    mockUpdateFn = jest.fn();
                    actions.enterShop({ state, commit }, shop );

                    expect( mockUpdateFn ).not.toHaveBeenCalledWith( 'generateItems', shop, expect.any( Number ));
                    expect( commit ).toHaveBeenNthCalledWith( 1, 'setShop', shop );
                    expect( commit ).toHaveBeenNthCalledWith( 2, 'setScreen', SCREEN_SHOP );
                });
            });

            it('should be able to enter a building', () => {
                const state         = { hash: 'foo' };
                const building      = { baz: 'qux' };
                const commit        = jest.fn();
                const dispatch      = jest.fn();
                const mockedGetters = { player: { baz: 'qux' } };
                mockUpdateFn        = jest.fn();

                actions.enterBuilding({ state, getters: mockedGetters, commit, dispatch }, building );

                expect( mockUpdateFn ).toHaveBeenCalledWith( 'generateFloors', state.hash, building, mockedGetters.player );
                expect( commit ).toHaveBeenCalledWith( 'setBuilding', building );
                expect( dispatch ).toHaveBeenCalledWith( 'changeFloor', 0 );
            });

            it('should be able to change currently the active environment', async () => {
                const state         = { activeEnvironment: { foo: 'bar' } };
                const commit        = jest.fn();
                const dispatch      = jest.fn();
                const mockedGetters = { player: { baz: 'qux' } };
                mockUpdateFn        = jest.fn();

                const newEnvironment = { baz: 'qux' };
                await actions.changeActiveEnvironment({ state, getters: mockedGetters, commit, dispatch }, newEnvironment );

                expect( commit ).toHaveBeenNthCalledWith( 1, 'flushBitmaps' );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setActiveEnvironment', newEnvironment );
                expect( commit ).toHaveBeenNthCalledWith( 3, 'setLoading', true );
                expect( mockUpdateFn ).toHaveBeenCalledWith( 'renderEnvironment', newEnvironment, mockedGetters.player );
                expect( commit ).toHaveBeenNthCalledWith( 4, 'setLoading', false );
            });

            describe('when changing floors within a building', () => {
                const state  = {
                    activeEnvironment: { foo : 'bar' },
                    building: { baz: 'qux', floors: [{ quux: 'quz' }, { corge: 'grault' }] }
                };

                it('should leave the building when having reached the final floor (elevator)', () => {
                    const commit   = jest.fn();
                    const dispatch = jest.fn();

                    actions.changeFloor({ state, commit, dispatch }, 2 );

                    expect( dispatch ).toHaveBeenCalledWith( 'leaveBuilding' );
                });

                it('should be able to change floors within a building', async () => {
                    const commit   = jest.fn();
                    const dispatch = jest.fn();

                    await actions.changeFloor({ state, commit, dispatch }, 1 );

                    expect( commit ).toHaveBeenCalledWith( 'setFloor', 1 );
                    expect( dispatch ).toHaveBeenCalledWith( 'changeActiveEnvironment', expect.any( Object ));
                });
            });

            it('should be able to leave a building', () => {
                const state    = { game: { world: { foo: 'bar' } } };
                const commit   = jest.fn();
                const dispatch = jest.fn();

                actions.leaveBuilding({ state, commit, dispatch });

                expect( commit ).toHaveBeenCalledWith( 'setBuilding', null );
                expect( dispatch ).toHaveBeenCalledWith( 'changeActiveEnvironment', state.world );
            });

            it('should be able to interact with a character', () => {
                const commit    = jest.fn();
                const character = CharacterFactory.create();
                mockUpdateFn    = jest.fn();

                actions.interactWithCharacter({ commit }, character );

                expect( mockUpdateFn ).toHaveBeenCalledWith( 'create' );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setCharacter', character );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setScreen', SCREEN_CHARACTER_INTERACTION );
            });
        });

        describe('when updating the game properties', () => {
            it('should be able to update the effects', () => {
                const timestamp = Date.now();
                const commit = jest.fn();
                const mockedGetters = {
                    gameTime: timestamp,
                };
                const effect1 = EffectFactory.create( jest.fn() );
                const effect2 = EffectFactory.create( jest.fn() );

                mockUpdateFn = jest.fn(effect => {
                    // note that effect 2 we want to remove (by returning true)
                    if ( effect === effect2 ) return true;
                    return false;
                });

                actions.updateGame({
                    commit,
                    getters: mockedGetters,
                    state: {
                        effects: [ effect1, effect2 ],
                    },
                }, timestamp );

                // assert Effects have been updated
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, effect1, timestamp );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, effect2, timestamp );

                // assert secondary effect has been requested to be removed (as its update returned true)
                expect( commit ).toHaveBeenCalledWith( 'removeEffect', effect2 );
            });
        });
    });
});
