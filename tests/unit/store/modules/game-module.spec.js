import store from '@/store/modules/game-module';
const { getters, mutations, actions } = store;

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
        it('should be able to set the game render start time', () => {
            const state = { renderStart: 0 };
            mutations.setRenderStart( state, 100 );
            expect( state.renderStart ).toEqual( 100 );
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

                const effect1 = { update: jest.fn(() => false) };
                const effect2 = { update: jest.fn(() => true ) };

                actions.updateGame({
                    commit,
                    state: {
                        effects: [ effect1, effect2 ],
                    },
                }, timestamp );

                // assert Effects have been updated
                expect( effect1.update ).toHaveBeenCalledWith( timestamp );
                expect( effect2.update ).toHaveBeenCalledWith( timestamp );

                // assert secondary effect has been requested to be removed (as its update returned true)
                expect( commit ).toHaveBeenCalledWith( 'removeEffect', effect2 );
            });
        });
    });
});
