import EffectFactory       from '@/model/factories/effect-factory';
import EnvironmentActions  from '@/model/actions/environment-actions';
import CharacterActions    from '@/model/actions/character-actions';
import { GAME_TIME_RATIO } from '@/utils/time-util';

// cancel the pending movements TODO: this would also apply to non-player characters!
const cancelPendingMovement = commit => {
    commit( 'removeEffectsByAction', [ 'setXPosition', 'setYPosition' ]);
};
const WALK_SPEED = 400; // ms for a single step

/**
 * Player module mediates all interactions the game's Player can take. As it is
 * part of the current sessions interaction, it is separate from the game module
 * (which owns the Player as part of the game's context)
 */
export default
{
    state: {

    },
    getters: {

    },
    mutations: {

    },
    actions: {
        moveToDestination({ state, getters, commit, dispatch }, waypoints = [] ) {
            cancelPendingMovement( commit );

            const { activeEnvironment, gameTime, player } = getters;
            let startTime  = gameTime;
            const duration = ( WALK_SPEED * CharacterActions.getSpeed( player )) * GAME_TIME_RATIO;
            let lastX      = activeEnvironment.x;
            let lastY      = activeEnvironment.y;

            waypoints.forEach(({ x, y }) => {
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
                        if ( EnvironmentActions.hitTest( activeEnvironment, dispatch )) {
                            cancelPendingMovement( commit );
                        }
                    }
                ));
                startTime += duration;
                lastX = x;
                lastY = y;
            });
        },
    },
};
