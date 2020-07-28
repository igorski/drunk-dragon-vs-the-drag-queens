import EffectFactory       from '@/model/factories/effect-factory';
import EnvironmentActions  from '@/model/actions/environment-actions';
import CharacterActions    from '@/model/actions/character-actions';
import { GAME_TIME_RATIO } from '@/utils/time-util';

// cancel the pending movements TODO: this should target the effect "owner"!
const cancelPendingMovement = commit => {
    commit( 'removeEffectsByAction', [ 'setXPosition', 'setYPosition' ]);
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
    },
    actions: {
        moveToDestination({ state, getters, commit, dispatch }, { waypoints = [], onProgress = null }) {
            cancelPendingMovement( commit );

            const { activeEnvironment, gameTime } = getters;
            let startTime  = gameTime;
            const duration = ( DEFAULT_WALK_SPEED * CharacterActions.getSpeed( state.player )) * GAME_TIME_RATIO;
            let lastX      = activeEnvironment.x;
            let lastY      = activeEnvironment.y;

            waypoints.forEach(({ x, y }, index ) => {
                // waypoints only move between one axis at a time
                const isHorizontal = x !== lastX;
                const startValue = isHorizontal ? lastX : lastY;
                const endValue   = isHorizontal ? x : y;

                if ( startValue === endValue ) return;

                commit( 'addEffect', EffectFactory.create(
                    commit,
                    isHorizontal ? 'setXPosition' : 'setYPosition',
                    startTime, duration, startValue, endValue,
                    () => {
                        if ( EnvironmentActions.hitTest({ dispatch, commit, getters }, activeEnvironment )) {
                            cancelPendingMovement( commit );
                        }
                        typeof onProgress === 'function' && onProgress();
                    }
                ));
                startTime += duration;
                lastX = x;
                lastY = y;
            });
        },
        buyItem({ state, commit }, item ) {
            if ( state.player.inventory.cash < item.price ) {
                return false;
            }
            commit( 'deductCash', item.price );
            commit( 'removeItemFromShop', item );
            commit( 'addItemToInventory', item );

            return true;
        }
    },
};
