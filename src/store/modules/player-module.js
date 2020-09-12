import EffectFactory      from '@/model/factories/effect-factory';
import EnvironmentActions from '@/model/actions/environment-actions';
import CharacterActions   from '@/model/actions/character-actions';
import InventoryActions   from '@/model/actions/inventory-actions';

// cancel the pending movements TODO: this should target the effect "owner"!
const cancelPendingMovement = commit => {
    commit( 'removeEffectsByMutation', [ 'setXPosition', 'setYPosition' ]);
};
const DEFAULT_WALK_SPEED = 400; // ms for a single step

/**
 * Player module mediates all interactions the game's Player can take. As it is
 * part of the current sessions interaction, it is separate from the game module
 * (which owns the Player as part of the game's context)
 */
export default
{
    state: {
        player: null,
        onMoveUpdate: null,
    },
    getters: {
        player: state => state.player,
    },
    mutations: {
        setPlayer( state, player ) {
            state.player = player;
        },
        deductCash( state, amount ) {
            state.player.inventory.cash -= amount;
        },
        awardCash( state, amount ) {
            state.player.inventory.cash += amount;
        },
        addItemToInventory( state, item ) {
            const { items } = state.player.inventory;
            if ( !items.includes( item )) {
                items.push( item );
            }
        },
        removeItemFromInventory( state, item ) {
            const { items } = state.player.inventory;
            const index = items.indexOf( item );
            if ( index > -1 ) {
                items.splice( index, 1 );
            }
        },
        setOnMovementUpdate( state, fn ) {
            state.onMoveUpdate = fn;
        },
    },
    actions: {
        moveToDestination({ state, getters, commit, dispatch }, { waypoints = [], onProgress = null }) {
            cancelPendingMovement( commit );
            commit( 'setOnMovementUpdate', onProgress );

            const { activeEnvironment, gameTime } = getters;
            let startTime  = gameTime;
            const duration = DEFAULT_WALK_SPEED * CharacterActions.getSpeed( state.player );
            let lastX      = activeEnvironment.x;
            let lastY      = activeEnvironment.y;
            let effect;

            waypoints.forEach(({ x, y }, index ) => {
                // waypoints can move between two axes at a time
                if ( x !== lastX ) {
                    effect = EffectFactory.create(
                        'setXPosition', startTime, duration, lastX, x, 'handleMoveUpdate'
                    );
                    commit( 'addEffect', effect );
                    lastX = x;
                }
                if ( y !== lastY ) {
                    effect = EffectFactory.create(
                        'setYPosition', startTime, duration, lastY, y, 'handleMoveUpdate'
                    );
                    commit( 'addEffect', effect );
                    lastY = y;
                }
                if ( effect ) {
                    startTime += effect.duration; // add effects scaled duration to next start time
                }
            });
        },
        handleMoveUpdate({ state, dispatch, commit, getters }) {
            if ( EnvironmentActions.hitTest({ dispatch, commit, getters }, getters.activeEnvironment )) {
                cancelPendingMovement( commit );
            }
            typeof state.onMoveUpdate === 'function' && state.onMoveUpdate();
        },
        buyItem({ state, commit }, item ) {
            if ( state.player.inventory.cash < item.price ) {
                return false;
            }
            commit( 'deductCash', item.price );
            commit( 'removeItemFromShop', item );
            commit( 'addItemToInventory', item );

            return true;
        },
        sellItem({ state, commit }, { item, price }) {
            commit( 'awardCash', price );
            // make item more expensive to buy back ;)
            item.price = InventoryActions.getPriceForItemSale({ ...item, price }, 1, 1.5 );
            commit( 'addItemToShop', item );
            commit( 'removeItemFromInventory', item );
        },
        giveItemToCharacter({ commit }, { item, character }) {
            const { intent } = character.properties;
            if ( intent.type !== item.type || intent.price > item.price ) {
                return false;
            }
            commit( 'addItemToCharacterInventory', { item, character });
            commit( 'removeItemFromInventory', item );
            return true;
        }
    },
};
