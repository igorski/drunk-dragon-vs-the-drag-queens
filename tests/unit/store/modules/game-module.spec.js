import store from '@/store/modules/game-module';
import EffectFactory from '@/model/factories/effect-factory';
const { getters, mutations, actions } = store;

let mockUpdateFn;
jest.mock('@/model/actions/effect-actions', () => ({
    update: (...args) => mockUpdateFn(...args),
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

                const effect1 = EffectFactory.create();
                const effect2 = EffectFactory.create();

                mockUpdateFn = jest.fn(effect => {
                    // note that effect 2 we want to remove (by returning true)
                    if ( effect === effect2 ) return true;
                    return false;
                });

                actions.updateGame({
                    commit,
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
