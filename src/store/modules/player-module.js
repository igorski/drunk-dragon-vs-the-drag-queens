import PlayerActions    from '@/definitions/player-actions';
import { validateMove } from '@/model/movement-factory';

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
        // speed along individual axes
        xSpeed: 0,
        ySpeed: 0,
        // whether movement for an individual axis is locked
        xLocked: false,
        yLocked: false,
        // the direction we're moving in for a specific axis
        xDirection: PlayerActions.MOVE_NONE,
        yDirection: PlayerActions.MOVE_NONE,
    },
    getters: {
        playerMoving: state => state.xDirection !== PlayerActions.MOVE_NONE || state.yDirection !== PlayerActions.MOVE_NONE,
        xLocked: state => state.xLocked,
        yLocked: state => state.yLocked,
    },
    mutations: {
        setXSpeed( state, value ) {
            state.xSpeed = value;
        },
        setYSpeed( state, value ) {
            state.ySpeed = value;
        },
        setXDirection( state, value ) {
            state.xDirection = value;
        },
        setYDirection( state, value ) {
            state.yDirection = value;
        },
        haltXMovement( state ) {
            state.xSpeed     = 0;
            state.xDirection = PlayerActions.MOVE_NONE;
        },
        haltYMovement( state ) {
            state.ySpeed     = 0;
            state.yDirection = PlayerActions.MOVE_NONE;
        },
    },
    actions: {
        /**
         * Updates the player position and movement speed
         * This should be invoked from the render cycle as it provides
         * a visual animation of a game state change.
         * TODO: the component can do this just fine using reactivity
         */
        updatePlayer({ state, getters, commit }) {
            let { xSpeed, ySpeed } = state;
            // update speed and position
            if ( getters.playerMoving ) {
                if ( !state.xLocked ) {
                    switch ( state.xDirection ) {
                        case PlayerActions.MOVE_LEFT:
                            if ( xSpeed > -state.MAX_X_SPEED )
                                xSpeed -= SPEED_INCREMENT;
                            break;
                        case PlayerActions.MOVE_RIGHT:
                            if ( xSpeed < state.MAX_X_SPEED )
                                xSpeed += SPEED_INCREMENT;
                            break;
                    }
                }
                if ( !state.yLocked ) {
                    switch ( state.yDirection ) {
                        case PlayerActions.MOVE_UP:
                            if ( ySpeed > -state.MAX_Y_SPEED )
                                ySpeed -= SPEED_INCREMENT;
                            break;
                        case PlayerActions.MOVE_DOWN:
                            if ( ySpeed < state.MAX_Y_SPEED )
                                ySpeed += SPEED_INCREMENT;
                            break;
                    }
                }
            } else {
                // slowly reduce the players speed if movement has halted
                if ( xSpeed < 0 )
                    xSpeed += .25;
                else if ( xSpeed > 0 )
                    xSpeed -= .25;

                if ( ySpeed < 0 )
                    ySpeed += .25;
                else if ( ySpeed > 0 )
                    ySpeed -= .25;
            }
            commit( 'setXSpeed', xSpeed );
            commit( 'setYSpeed', ySpeed );

            let moved = false;
            let { x, y } = getters.player;

            // are we moving horizontally ?

            if ( xSpeed !== 0 ) {
                x    += Math.round( xSpeed );
                moved = true;
            }

            // are we moving vertically ?

            if ( ySpeed !== 0 ) {
                y    += Math.round( ySpeed );
                moved = true;
            }

            if ( moved ) {
                commit( 'setPlayerPosition', { x, y });
                const { tileWidth, tileHeight } = WorldCache;

                // dispatch an Event stating a single tile has been travelled ?

                if ( x <= -tileWidth || x >= tileWidth )
                    this.dispatchEvent( new Event( PlayerActions.TILE_MOVE_COMPLETE, { "axis" : "x" }));

                if ( y <= -tileHeight || y >= tileHeight )
                    this.dispatchEvent( new Event( PlayerActions.TILE_MOVE_COMPLETE, { "axis" : "y" }));
            }
        },
        movePlayer( store, direction ) {
            const { state, getters, commit } = store;

            const wasMoving = getters.playerMoving;
            const isHorizontal = [ PlayerActions.MOVE_LEFT, PlayerActions.MOVE_RIGHT ].includes( direction );

            if ( validateMove( store, isHorizontal ? 'x' : 'y' )) {
                const player = getters.player;

                if ( isHorizontal && getters.xLocked || !isHorizontal && getters.yLocked )
                    return;

                console.log( "START MOVE" );

                const environment       = getters.activeEnvironment;
                const { width, height } = environment;
                let { x, y }            = getters.player;

                // pre-calculate the request position

                if ( isHorizontal ) {
                    switch ( state.xDirection ) {
                        case PlayerActions.MOVE_LEFT:
                            x = Math.max( 0, --x );
                            break;
                        case PlayerActions.MOVE_RIGHT:
                            x = Math.min( width - 1, ++x );
                            break;
                    }
                } else {
                    switch ( state.yDirection ) {
                        case PlayerActions.MOVE_UP:
                            y = Math.max( 0, --y );
                            break;

                        case PlayerActions.MOVE_DOWN:
                            y = Math.min( height - 1, ++y );
                            break;
                    }
                }
                // commit the changes
                console.warn('setting to ' + x + " x " + y);

                commit( isHorizontal ? 'setXDirection' : 'setYDirection', direction );
                commit('setPlayerPosition', { x, y });
            }
        },
    },
};
