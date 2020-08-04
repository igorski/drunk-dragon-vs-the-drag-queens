import store            from '@/store/modules/player-module';
const { getters, mutations, actions } = store;

describe('Vuex player module', () => {
    describe('getters', () => {
        it('should return the player Character', () => {
            const state = { player: { baz: 'qux' } };
            expect( getters.player( state )).toEqual( state.player );
        });
    });

    describe('mutations', () => {
        it('should be able to set the player Character', () => {
            const state = { player: null };
            const player = { foo: 'bar' };
            mutations.setPlayer( state, player );
            expect( state.player ).toEqual( player );
        });

        it('should be able to deduct cash from the players balance', () => {
            const state = { player: { inventory: { cash: 50 } } };
            mutations.deductCash( state, 10 );
            expect( state.player.inventory.cash ).toEqual( 40 );
        });

        it('should be able to award cash to the players balance', () => {
            const state = { player: { inventory: { cash: 50 } } };
            mutations.awardCash( state, 10 );
            expect( state.player.inventory.cash ).toEqual( 60 );
        });

        it('should be able to add an item to the players inventory', () => {
            const state = { player: { inventory: { cash: 50, items: [{ foo: 'bar' }] } } };
            const item  = { baz: 'qux' };
            mutations.addItemToInventory( state, item );
            expect( state.player.inventory.items ).toEqual([{ foo: 'bar'}, { baz: 'qux' }]);
        });
    });

    describe('actions', () => {
        it('should be able to move the player to the requested destination', () => {
            const state         = { player: { properties: { speed: 1, intoxication: 0, boost: 0 } } };
            const mockedGetters = { activeEnvironment: { x: 0, y: 0 }, gameTime: 0 };
            const commit        = jest.fn();
            const dispatch      = jest.fn();

            const waypoints  = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
            const onProgress = jest.fn();

            actions.moveToDestination({ state, getters: mockedGetters, commit, dispatch }, { waypoints, onProgress });

            // expect cancellation of existing movement effects
            expect( commit ).toHaveBeenNthCalledWith( 1, 'removeEffectsByAction', [ 'setXPosition', 'setYPosition' ]);
            // expect registration of update handler
            expect( commit ).toHaveBeenNthCalledWith( 2, 'setOnMovementUpdate', onProgress );
            // expect individual addition of each waypoint as an effect
            expect( commit ).toHaveBeenNthCalledWith( 3, 'addEffect', expect.any( Object ));
            expect( commit ).toHaveBeenNthCalledWith( 4, 'addEffect', expect.any( Object ));
        });

        describe('when buying an item from a shop', () => {
            it('should deny the transaction when the player has insufficient funds', () => {
                const state  = { player: { inventory: { cash: 5 } } };
                const item   = { price: 10 };
                const commit = jest.fn();
                expect( actions.buyItem({ state, commit }, item )).toBe( false );
                expect( commit ).not.toHaveBeenCalled();
            });

            it('should buy the item when the player has sufficient funds and move it to the player inventory', () => {
                const state  = { player: { inventory: { cash: 15 } } };
                const item   = { price: 10 };
                const commit = jest.fn();
                expect( actions.buyItem({ state, commit }, item )).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, 'deductCash', item.price );
                expect( commit ).toHaveBeenNthCalledWith( 2, 'removeItemFromShop', item );
                expect( commit ).toHaveBeenNthCalledWith( 3, 'addItemToInventory', item );
            });
        });
    });
});
