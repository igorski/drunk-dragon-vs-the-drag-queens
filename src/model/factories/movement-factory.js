import WorldCache    from '@/utils/world-cache';

import { CAVE_TYPE }  from './cave-factory';
import { WORLD_TYPE } from './world-factory';

/**
 * Validate whether we can execute the requested movement to the target position

 * @param {Object} store Vuex store instance
 * @param {String} axis
 */
export const validateMove = ( store, axis ) => {
    const { dispatch, getters } = store;
    const player = getters.player;

    if ( validateMovement( store, null, axis, true )) {
        //sanitizePosition( store, axis );
        hitTest( store );
        return true;
    }
    return false;
};

/* internal methods */

/**
 * if the Players movement is invalidated (e.g. trying to move to a blocked
 * position), the movement for the Player is halted
 *
 * @param {Object} store Vuex store instance
 * @param {Object=} aOptEnvironment optional environment to take coordinates from
 * @param {string=} aOptAxis optional axis to halt movement for in case
 *        movement for the Player is invalidated
 * @param {boolean=} checkGivenAxisOnly optional, whether to only check and invalidate
 *                   given axis aOptAxis
 * @return {boolean} whether movement was valid
 */
export const validateMovement = ( store, aOptEnvironment, aOptAxis, checkGivenAxisOnly ) => {
    // when undefined, the validate method will calculate the new offset
    // from the current Environment offset and the direction the Player is moving in

    const x = aOptEnvironment ? aOptEnvironment.x : undefined;
    const y = aOptEnvironment ? aOptEnvironment.y : undefined;

    // if we are to check against a given axis only we must know WHICH axis-position
    // might lead to an invalidation as we can then simply block that axis' movement
    // while keeping the other axis movement (if existing) intact

    const axisRequested = typeof aOptAxis === 'string';
    /* // TODO : doesn't work yet...
    if ( checkGivenAxisOnly && axisRequested )
    {
        var env = this.getEnvironment();

        x = aOptAxis === 'x' ? x : env.x;
        y = aOptAxis === 'y' ? y : env.x;
    }
    */
    if ( validate( store, x, y )) {
        return true;
    }

    const { commit, dispatch } = store;
    if ( axisRequested ) {
        // TODO : a 'proposed fix' for the above TODO, it has been noticed that
        // when moving on two axes, the axis that was blocked is the other
        // axis than the one specified in 'aOptAxis', is this a coincidence
        // or the golden rule ?

        const blockHorizontal = aOptAxis !== 'x'; // basically 'inverting' aOptAxis;
        commit( blockHorizontal ? 'haltXMovement' : 'haltYMovement' );
    }
    else {
        dispatch( 'resetPlayer' );
    }
    return false;
};

/* internal methods */

/**
 * @param {Object} store Vuex store reference
 * @param {number=} aOptX optional, specifies which x-coordinate to explicitly check
 * @param {number=} aOptY optional, specifies which y-coordinate yo explicitly check
 *
 * @return {boolean} whether the Player can move to this position
 */
function validate( store, aOptX, aOptY ) {
    const { getters } = store;

    if ( !getters.gameActive )
        return false;   // cannot move if game is inactive

    const player      = getters.player;
    const environment = getters.activeEnvironment;
    let { x, y } = environment;

    switch ( player.xDirection )
    {
        case PlayerActions.MOVE_LEFT:
            x = Math.max( 0, --x );
            break;

        case PlayerActions.MOVE_RIGHT:
            x = Math.min( environment.width - 1, ++x );
            break;
    }

    switch ( player.yDirection )
    {
        case PlayerActions.MOVE_UP:
            y = Math.max( 0, --y );
            break;

        case PlayerActions.MOVE_DOWN:
            y = Math.min( environment.height - 1, ++y );
            break;
    }

    if ( typeof aOptX === 'number' ) x = aOptX;
    if ( typeof aOptY === 'number' ) y = aOptY;

    // validate whether we can move to the target position

    return WorldCache.isPositionFree( environment, x, y, true );
}

/**
 * @param {Object} store Vuex store instance
 * @return {boolean} whether we've hit something
 */
function hitTest( store ) {
    const { getters, dispatch } = store;
    const environment = getters.activeEnvironment;

    const { enemies, shops, caves } = environment;
    let hit;

    if ( hit = internalHitTest( environment.x, environment.y, enemies )) {
        // hit an enemy, start battle !!
        var battleModel = this.getModel( BattleModel.NAME );
        battleModel.setOpponent( hit );
    } else if ( environment.type === WORLD_TYPE ) {
        if ( hit = internalHitTest( environment.x, environment.y, shops )) {
            // entered shop, open the shop page
            dispatch('enterShop', hit );
        }
        else if ( hit = internalHitTest( environment.x, environment.y, caves )) {
            // entered cave
            dispatch('enterCave', hit );
        }
    } else if ( environment.type === CAVE_TYPE ) {
        const caveLevel = environment.levels[ environment.level ];
        if ( hit = internalHitTest( environment.x, environment.y, caveLevel.exits )) {
            dispatch('enterCaveTunnel', hit );
        }
    }
    return hit !== null;
};

/**
 * check whether the Player currently has an offset in its given axis
 * (indicating it has been moving and has not completed a full tile)
 *
 * @param {Object} player
 * @param {String} axis either 'x' or 'y'-axis
 * @return {boolean}
 */
function hasAxisMoved( player, axis ) {
    if ( axis === 'x' && player.x !== 0 )
        return true;

    else if ( axis === 'y' && player.y !== 0 )
        return true;

    return false;
}

/**
 * sanitize the Players position into a world coordinate (should only be invoked
 * when given axis has moved a single tile in distance)
 *
 * @param {Object} store Vuex store instance
 * @param {String} axis
 */
function sanitizePosition( store, axis ) {
    const { getters, commit } = store;

    const environment = getters.activeEnvironment;
    const player      = getters.player;

    const { width, height } =  environment;
    let { x, y } = environment;

    let targetX = x;
    let targetY = y;

    if ( axis === 'x' ) {
        switch ( getters.xDirection ) {
            case PlayerActions.MOVE_LEFT:
                targetX = Math.max( 0, --targetX );
                break;

            case PlayerActions.MOVE_RIGHT:
                targetX = Math.min( width - 1, ++targetX );
                break;
        }
        targetY = player.y;
        x       = targetX;
    } else if ( axis === 'y' ) {
        switch ( getters.yDirection ) {
            case PlayerActions.MOVE_UP:
                targetY = Math.max( 0, --targetY );
                break;

            case PlayerActions.MOVE_DOWN:
                targetY = Math.min( height - 1, ++targetY );
                break;
        }
        targetX = player.x;
        y       = targetY;
    }
}

function internalHitTest( x, y, collection ) {
    let i = collection.length;
    while ( i-- ) {
        const c = collection[ i ];
        if ( c.x === x && c.y === y )
            return c;
    }
    return null;
}
