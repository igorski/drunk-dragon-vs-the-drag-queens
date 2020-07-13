import store from '@/store/modules/game-module';
import EffectFactory from '@/model/factories/effect-factory';
const { getters, mutations, actions } = store;

let mockUpdateFn;
jest.mock('@/model/actions/effect-actions', () => ({
    update: (...args) => mockUpdateFn(...args),
}));
jest.mock('@/model/factories/game-factory', () => ({
    assemble: (...args) => mockUpdateFn('assemble', ...args),
    disassemble: (...args) => mockUpdateFn('disassemble', ...args)
}));
jest.mock('store/dist/store.modern', () => ({
    get: (...args) => mockUpdateFn('get', ...args),
    set: (...args) => mockUpdateFn('set', ...args),
    remove: (...args) => mockUpdateFn('remove', ...args),
}));

describe('Vuex game module', () => {
    describe('getters', () => {
        it('should return the active game state', () => {
            expect( getters.gameActive({ gameActive: true })).toEqual( true );
        });

        it('should return the active environment', () => {
            const state = { activeEnvironment: { foo: 'bar' } };
            expect( getters.activeEnvironment( state )).toEqual( state.activeEnvironment );
        });

        it('should return the player Character', () => {
            const state = { player: { baz: 'qux' } };
            expect( getters.player( state )).toEqual( state.player );
        });
    });

    describe('mutations', () => {
        it('should be able to set the game last render time', () => {
            const state = { lastRender: 0 };
            mutations.setLastRender( state, 100 );
            expect( state.lastRender ).toEqual( 100 );
        });

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
    });

    describe('actions', () => {
        describe('when updating the game properties', () => {
            it('should be able to update the effects', () => {
                const timestamp = Date.now();
                const commit = jest.fn();
                const mockedGetters = {
                    gameTime: Date.now(),
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

        describe('when storing the game', () => {
            it('should be able to save the game state into local storage', () => {
                mockUpdateFn = jest.fn(() => 'mockReturn');
                const state  = { foo: 'bar' };
                actions.saveGame({ state });
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'disassemble', state );
                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 2, 'set', 'rpg', 'mockReturn' );
            });

            it('should be able to restore a saved game from local storage', () => {
                const game = { hash: 'foo', world: 'bar' };
                mockUpdateFn = jest.fn(() => game);
                const state = { activeEnvironment: null };
                const commit = jest.fn();

                actions.loadGame({ state, commit });

                expect( mockUpdateFn ).toHaveBeenNthCalledWith( 1, 'get', 'rpg' );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'setGame', game );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'setHash', game.hash );
                expect( commit ).toHaveBeenNthCalledWith( 3, 'setActiveEnvironment', game.world );
                //expect( commit ).toHaveBeenNthCalledWith( 4, 'setLastRender', Date.now() );
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
    });
});
