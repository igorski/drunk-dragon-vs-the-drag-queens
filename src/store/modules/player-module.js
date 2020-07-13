import EffectFactory       from '@/model/factories/effect-factory';
import { GAME_TIME_RATIO } from '@/utils/time-util';
//import { validateMove } from '@/model/factories/movement-factory';

const MAX_X_SPEED     = 1.25;
const MAX_Y_SPEED     = 1.25;
const SPEED_INCREMENT = 0.05;

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
        moveToDestination({ state, getters, commit }, waypoints = [] ) {
            commit( 'removeEffectsByAction', [ 'setXPosition', 'setYPosition' ]);

            const { activeEnvironment } = getters;
            let startTime  = getters.gameTime;
            const duration = 350 * GAME_TIME_RATIO;
            let lastX      = activeEnvironment.x;
            let lastY      = activeEnvironment.y;

            waypoints.forEach(({ x, y }) => {
                // waypoints only move between one axis at a time
                const isHorizontal = x !== lastX;
                const startValue = isHorizontal ? lastX : lastY;
                const endValue   = isHorizontal ? x : y;

                commit( 'addEffect', EffectFactory.create(
                    commit,
                    isHorizontal ? 'setXPosition' : 'setYPosition',
                    startTime, duration, startValue, endValue
                ));
                startTime += duration;
                lastX = x;
                lastY = y;
            });
        },
    },
};
