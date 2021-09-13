import { coordinateToIndex, distance } from "@/utils/terrain-util";
import { WORLD_TILES, WORLD_TYPE } from "@/model/factories/world-factory";
import { BUILDING_TILES, BUILDING_TYPE } from "@/model/factories/building-factory";
import ExecuteWithRetry from "@/utils/execute-with-retry";

/**
 * Reserves space for a given object at the given coordinate
 *
 * if the requested coordinate isn't free/available, this method
 * will search for the next free position as close as possible to
 * the the requested coordinate
 *
 * @param {Object} object to place
 * @param {Object} environment the environment the object should fit in
 * @param {Array<Object>=} others Array of Objects that should be checked against
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @return {Object|null} coordinates at which Object has been reserved
 */
export function reserveObject( object, environment, others = [], optTileWhitelist ) {
    let compare = [ ...others ];
    let unwalkableTile;
    // assemble the list of Objects we shouldn't collide with
    if ( environment.type === BUILDING_TYPE ) {
        compare = [ ...environment.exits, ...environment.hotels, ...environment.items, ...compare ];
        unwalkableTile = BUILDING_TILES.NOTHING;
    } else if ( environment.type = WORLD_TYPE ) {
        compare = [ ...environment.shops, ...environment.buildings, ...environment.items, ...compare ];
        unwalkableTile = WORLD_TILES.MOUNTAIN;
    }
    let { x, y } = object;

    const success = ExecuteWithRetry(() => {
        if ( checkIfFree({ ...object, x, y }, environment, compare, true, optTileWhitelist )) {

            // bit of a cheat... add a wall around the object entrance (which is always at the
            // horizontal middle of the vertical bottom) so the player can't enter/walk outside of the entrace

            const halfWidth = Math.round( object.width / 2 );
            for ( let xd = x - ( halfWidth - 1 ); xd < x + halfWidth; ++xd ) {
                for ( let yd = y - ( object.height - 1 ); yd <= y; ++yd ) {
                    if ( xd === x && yd === y ) {
                        continue;
                    }
                    environment.terrain[ coordinateToIndex( xd, yd, environment )] = unwalkableTile;
                }
            }
            return true;
        }

        // which direction we'll try next

        const left = x > environment.width  / 2;
        const up   = y > environment.height / 2;

        if ( left ) {
            --x;
        } else {
            ++x;
        }
        if ( up ) {
            --y;
        } else {
            ++y;
        }

        // keep within environment bounds though

        x = Math.max( 0, Math.min( x, environment.width ));
        y = Math.max( 0, Math.min( y, environment.height ));
    });
    if ( success ) {
        return { x, y };
    }
    return null; // didn't find a spot... :(
}

/**
 * check whether there is nothing occupying the given
 * bounding box in the environment
 *
 * @param {Object} area rectangle to verify if is free
 * @param {Object} environment
 * @param {Array<Object>} objects
 * @param {boolean=} assertTiles default to true, ensures the tiles at the coordinate ara available
 * @param {Array<Number>=} optTileWhitelist optional list of tiles the group can be placed on
 * @return {boolean} whether the position is free
 */
export function checkIfFree( area, environment, objects, assertTiles = true, optTileWhitelist = null ) {
    const { width, height } = area;

    // check if the underlying tile types around the object coordinate are valid for placement
    if ( assertTiles ) {
        const envList = environment.type === BUILDING_TYPE ? [ BUILDING_TILES.GROUND ] : [ WORLD_TILES.GROUND, WORLD_TILES.SAND ];
        const whitelist = Array.isArray( optTileWhitelist ) ? optTileWhitelist : envList;
        // ensure we have this amount of tiles around the object entrance (ensures we can walk there)
        const PADDING = 2;
        // uncomment width and height in below loop conditions if the ENTIRE object surface
        // needs to be on top of the whitelisted tiles
        for ( let x = Math.max( 0, area.x - PADDING ), xt = Math.min( environment.width, area.x + /*width +*/ PADDING ); x < xt; ++x ) {
            for ( let y = Math.max( 0, area.y - PADDING ), yt = Math.min( environment.height, area.y + /*height +*/ PADDING ); y < yt; ++y ) {
                const tile = environment.terrain[ coordinateToIndex( x, y, environment )];
                if ( !whitelist.includes( tile )) {
                    return false;
                }
            }
        }
    }

    // check if there is no other Object registered at this position
    const { x, y } = area;
    const radius = Math.max( width, height ) / 2;
    for ( let i = 0, l = objects.length; i < l; ++i ) {
        const compare = objects[ i ];
        const compareRadius = Math.max( compare.width, compare.height );
        const dist = distance( x, y, compare.x, compare.y );

        if ( dist < radius + compareRadius ) {
            return false;
        }
    }
    return true;
}
