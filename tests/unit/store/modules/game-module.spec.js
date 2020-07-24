import store            from '@/store/modules/game-module';
import { SCREEN_SHOP }  from '@/definitions/screens';
import CharacterFactory from '@/model/factories/character-factory';
import EffectFactory    from '@/model/factories/effect-factory';
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
jest.mock('@/model/factories/shop-factory', () => ({
    generateShopItems: (...args) => mockUpdateFn('generateShopItems', ...args),
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

        it('should return the player Character', () => {
            const state = { player: { baz: 'qux' } };
            expect( getters.player( state )).toEqual( state.player );
        });

        it('should return the active floor, when in a building', () => {
            const state = { building: null };
            expect( getters.floor( state )).toEqual( NaN );
            state.building = { floor: 2 };
            expect( getters.floor( state )).toEqual( 2 );
        });
    });

    describe('mutations', () => {
        it('should be able to set the active game hash', () => {
            const state = { hash: null };
            const hash = 'foobarbaz';
            mutations.setHash( state, hash );
            expect( state.hash ).toEqual( hash );
        });

        it('should be able to set the active game', () => {
            const state = {};
            const game = {
                created: Date.now(),
                modified: Date.now() + 2500,
                gameStart: Date.now() + 1000,
                lastSavedTime: Date.now() + 3000,
                gameTime: Date.now() - 100000,
                player: { foo: 'bar' },
                building: { baz: 'qux' },
                world: { quux: 'corge' }
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
        });
    });

    describe('actions', () => {
        it('should be able to create a new game', async () => {
            const character = CharacterFactory.create();
            const state     = { world: { foo: 'bar' } };
            const commit    = jest.fn();
            mockUpdateFn    = jest.fn(() => state.world);

            await actions.createGame({ state, commit }, character );

            expect( commit ).toHaveBeenNthCalledWith( 1, 'setHash', expect.any(String));
            expect( commit ).toHaveBeenNthCalledWith( 2, 'setGame', expect.any(Object));
            expect( commit ).toHaveBeenNthCalledWith( 3, 'setActiveEnvironment', state.world);
            expect( commit ).toHaveBeenNthCalledWith( 4, 'setLastRender', expect.any(Number));
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'create' );
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, 'populate', state.world, expect.any(String));
            expect( mockUpdateFn ).toHaveBeenNthCalledWith( 3, 'renderEnvironment', state.world);
        });

        describe('when storing the game', () => {
            it('should be able to save the game state into local storage', () => {
                mockUpdateFn = jest.fn(() => 'mockReturn');
                const state  = { foo: 'bar' };
                actions.saveGame({ state });
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'disassemble', state );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, 'set', 'rpg', 'mockReturn' );
            });

            it('should be able to restore a saved game from local storage', () => {
                const game = { hash: 'foo', world: 'bar', player: {} };
                mockUpdateFn = jest.fn(() => game);
                const state = { activeEnvironment: null };
                const commit = jest.fn();
                const dispatch = jest.fn();

                actions.loadGame({ state, commit, dispatch });

                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'get', 'rpg' );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setGame', game );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setHash', game.hash );
                expect( commit ).toHaveBeenNthCalledWith( 3, 'setActiveEnvironment', game.world );
                //expect( commit ).toHaveBeenNthCalledWith( 4, 'setLastRender', Date.now() );
            });

            it('should reset the game state if the save is corrupted', () => {
              const game = { hash: 'foo' };
              mockUpdateFn = jest.fn(() => game);
              const state = { activeEnvironment: null };
              const commit = jest.fn();
              const dispatch = jest.fn();

              actions.loadGame({ state, commit, dispatch });

              expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'get', 'rpg' );
              expect( dispatch ).toHaveBeenCalledWith( 'resetGame' );
              expect( commit ).toHaveBeenCalledWith( 'setScreen', expect.any( Number ));
            });

            it('should be able to import an exported save game', async () => {
                const game = { hash: 'foo' };
                mockUpdateFn = jest.fn(() => game);
                const commit = jest.fn();
                const dispatch = jest.fn();

                await actions.importGame({ commit, dispatch }, 'foo' );

                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'assemble', 'foo' );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setGame', game );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setHash', game.hash );
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
            it('should be able to enter a shop', () => {
                const shop = { foo: 'bar' };
                const state = { player: { baz: 'qux' } };
                const commit = jest.fn();
                mockUpdateFn = jest.fn();
                actions.enterShop({ state, commit }, shop );

                expect( mockUpdateFn ).toHaveBeenCalledWith( 'generateShopItems', shop, state.player );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setShop', shop );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setScreen', SCREEN_SHOP );
            });

            it('should be able to enter a building', () => {
                const state    = { hash: 'foo', player: 'bar' }
                const building = { baz: 'qux' };
                const commit   = jest.fn();
                const dispatch = jest.fn();
                mockUpdateFn   = jest.fn();

                actions.enterBuilding({ state, commit, dispatch }, building );

                expect( mockUpdateFn ).toHaveBeenCalledWith( 'generateFloors', state.hash, building, state.player );
                expect( commit ).toHaveBeenCalledWith( 'setBuilding', building );
                expect( dispatch ).toHaveBeenCalledWith( 'changeFloor', 0 );
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
                    mockUpdateFn   = jest.fn();

                    await actions.changeFloor({ state, commit, dispatch }, 1 );

                    expect( commit ).toHaveBeenNthCalledWith( 1, 'setFloor', 1 );
                    expect( commit ).toHaveBeenNthCalledWith( 2, 'setActiveEnvironment', state.building.floors[1] );
                    expect( commit ).toHaveBeenNthCalledWith( 3, 'setLoading', true );
                    expect( mockUpdateFn ).toHaveBeenCalledWith( 'renderEnvironment', state.activeEnvironment);
                    expect( commit ).toHaveBeenNthCalledWith( 4, 'setLoading', false );
                });
            });

            it('should be able to leave a building', () => {
                const state    = { game: { world: { foo: 'bar' } } };
                const commit   = jest.fn();
                const dispatch = jest.fn();

                actions.leaveBuilding({ state, commit, dispatch });

                expect( commit ).toHaveBeenNthCalledWith( 1, 'setBuilding', null );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setActiveEnvironment', state.world );
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
