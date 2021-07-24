import { BUILDING_TYPE }                 from "@/model/factories/building-factory";
import EffectFactory                     from "@/model/factories/effect-factory";
import { WORLD_TYPE, WORLD_TILES, MAX_WALKABLE_TILE } from "@/model/factories/world-factory";
import CharacterActions from "@/model/actions/character-actions";
import { SHOE_FLIPPERS } from "@/definitions/item-types";
import { findPath }     from "@/utils/path-finder";
import { coordinateToIndex } from "@/utils/terrain-util";

const DEFAULT_WALK_SPEED = 400; // ms for a single step

export default {
    /**
     * Calculate the waypoints and enqueue the Effect-movements necessary to move given character
     * to given target coordinates within given environment. This calculates waypoints over
     * walkable tiles, performs hitTests on each individual waypoint and updates the existing
     * motion for the character to not cancel existing/abruptly change animating movements.
     * NOTE: existing movement should have been cleaned prior to
     *
     * @param {Object} Vuex store reference
     * @param {Object} character to move
     * @param {Object} environment to move within
     * @param {Number} targetX target x-coordinate to move to
     * @param {Number} targetY target y-coordinate to move to
     * @param {Array<Object>=} pendingMovements optional list of existing movements (Effects) for this character
     * @param {String=} xMutation optional name of Vuex store mutation to execute on x-coordinate translations
     * @param {String=} yMutation optional name of Vuex store mutation to execute on y-coordinate translations
     * @param {String=} updateMutation optional name of Vuex store mutation to execute on single waypoint move
     */
    moveCharacter({ commit, getters }, character, environment, targetX, targetY, pendingMovements = [],
        xMutation = "setCharacterXPosition", yMutation = "setCharacterYPosition", updateMutation = "hitTest"
    ) {
        // can we walk on water ? TODO: supply in args per environment type.
        const maxTile = character.inventory.items.find(({ name }) => name === SHOE_FLIPPERS ) ? WORLD_TILES.WATER : MAX_WALKABLE_TILE;
        const indexOfTile = coordinateToIndex( fastRound( targetX ), fastRound( targetY ), environment ); // translate coordinate to 1D list index
        const targetTile  = environment.terrain[ indexOfTile ];

        if ( targetTile > maxTile ) {
            return; // unnavigateable destination
        }

        let startTime = getters.gameTime;
        let startX = fastRound( character.x );
        let startY = fastRound( character.y );

        const firstEffects = [];
        if ( pendingMovements.length > 1 ) {
            for ( let i = 0; i < 2; ++i ) {
                const effect = pendingMovements[ i ];
                switch ( effect.mutation ) {
                    case xMutation:
                        startX = effect.endValue;
                        break;
                    case yMutation:
                        startY = effect.endValue;
                        break;
                }
                firstEffects.push( effect );
            }
        }
        // cancel existing movements and enqueue new waypoints
        commit( "removeEffectsByTargetAndMutation", { target: character.id, types: [ xMutation, yMutation ] });

        // keep the first waypoint of the pending movements active though
        // (this prevents sudden jumps when changing movement directions)
        firstEffects.forEach( effect => {
            commit( "addEffect", effect );
            startTime = effect.startTime + effect.duration;
        });

        // calculate waypoints from the last position to the target position
        const waypoints = findPath(
            environment, startX, startY,
            fastRound( targetX ), fastRound( targetY ), maxTile
        );

        // enqueue animated movement for each waypoint as an Effect
        const duration = DEFAULT_WALK_SPEED / Math.max( 0.1, CharacterActions.getSpeed( character ));
        let lastX      = startX;
        let lastY      = startY;
        let effect;

        waypoints.forEach(({ x, y }, index ) => {
            // waypoints can move between two axes at a time
            if ( x !== lastX ) {
                effect = EffectFactory.create(
                    xMutation, startTime, duration, lastX, x, updateMutation, character.id
                );
                commit( "addEffect", effect );
                lastX = x;
            }
            if ( y !== lastY ) {
                effect = EffectFactory.create(
                    yMutation, startTime, duration, lastY, y, updateMutation, character.id
                );
                commit( "addEffect", effect );
                lastY = y;
            }
            if ( effect ) {
                startTime += effect.duration; // add effects scaled duration to next start time
            }
        });
        return waypoints;
    },
    /**
     * Performs a collision detection with the environments interactive
     * elements present at the environments current x, y coordinate.
     *
     * @param {Object} Vuex store getters, commit and dispatch methods
     * @param {Object} environment environment to traverse
     * @return {boolean} whether we've hit something
     */
    hitTest({ dispatch, commit, getters }, environment ) {
        const { characters, shops, buildings } = environment;
        // round the coordinates (in case character is currently moving)
        const x = fastRound( environment.x );
        const y = fastRound( environment.y );
        let hit, dispatchFn, dispatchValue;

        if ( hit = internalHitTest( x, y, characters )) {
            // hit a character, do something!!!
            dispatchFn = "interactWithCharacter";
        } else if ( environment.type === WORLD_TYPE ) {
            if ( hit = internalHitTest( x, y, shops )) {
                // entered shop, open the shop page
                dispatchFn = "enterShop";
            }
            else if ( hit = internalHitTest( x, y, buildings )) {
                // entered building
                dispatchFn = "enterBuilding";
            }
        } else if ( environment.type === BUILDING_TYPE ) {
            if ( hit = internalHitTest( x, y, environment.exits )) {
                dispatchFn = "changeFloor";
                const isDown = environment.exits.indexOf( hit ) === 0;
                dispatchValue = isDown ? getters.floor - 1 : getters.floor + 1;
            } else if ( hit = internalHitTest( x, y, environment.hotels )) {
                // entered hotel
                dispatchFn = "enterHotel";
            }
        }
        if ( hit ) {
            // here we ensures that when we're done with the action (e.g. leaving
            // a building) we don't collide with the same object (re-entering the building again)
            commit( "setYPosition", { value: y + 1 });
            // dispatch after updating position (otherwise y is changed for new environment)
            dispatch( dispatchFn, dispatchValue ?? hit );
        }
        return hit !== null;
    },
};

/* internal methods */

function fastRound( number ) {
    return ( number + 0.5 ) << 0;
}

function internalHitTest( x, y, collection = [] ) {
    let i = collection.length;
    while ( i-- ) {
        const compare = collection[ i ];
        if ( fastRound( compare.x ) === x && fastRound( compare.y ) === y ) {
            return compare;
        }
    }
    return null;
}
