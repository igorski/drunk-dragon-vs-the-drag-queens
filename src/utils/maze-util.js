import { Map } from "rot-js";

/**
 * Generate a terrain that is laid out as a maze.
 *
 * @param {Object} tileDefinition enumerated values for NOTHING, GROUND and WALL tiles
 * @param {number} terrainWidth width (in tiles) of the terrain to generate
 * @param {number} terrainHeight height (in tiles) of the terrain to generate
 * @param {number} minRoomWidth minimum width (in tiles) of a room
 * @param {number} minRoomHeight minimum height (in tiles) of a room
 * @param {number} maxRoomWidth maximum width (in tiles) of a room
 * @param {number} maxRoomHeight maximum height (in tiles) of a room
 */
export function generateMaze({ nothing, ground, wall }, terrainWidth, terrainHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight ) {
    // do size - 1 since algorithm puts rooms up against side, and we need to create walls there later
    const digger = new Map.Digger( terrainWidth - 1, terrainHeight - 1, {
        roomWidth      : [ minRoomWidth,  maxRoomWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoomHeight, maxRoomHeight ], /* room minimum and maximum height */
        corridorLength : [ 3, 10 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of floor area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    });
    const map = [];

    // init output terrain map

    for ( let x = 0; x < terrainWidth; ++x ) {
        map[ x ] = new Array( terrainHeight ).fill( nothing );
    }

    // create map
    digger.create(( x, y, tile ) => {
        switch( tile ) {
            case 1:
                map[ x + 1 ][ y + 1 ] = nothing;
                break;
            case 0:
                map[ x + 1 ][ y + 1 ] = ground;
                break;
        }
    });
    const xl = map.length;
    const yl = map[ 0 ].length;

    // setup walls
    for ( let x = 0; x < xl; ++x ) {
        for ( let y = 0; y < yl; ++y ) {
            if ( map[ x ][ y ] === ground ) {
                for ( let xx = x - 1; xx <= x + 1 && xx > 0; ++xx ) {
                    for ( let yy = y - 1; yy <= y + 1 && yy > 0; ++yy ) {
                        if ( map[ xx ][ yy ] === nothing ) {
                            map[ xx ][ yy ] = wall;
                        }
                    }
                }
            }
        }
    }

    // convert two dimensional array to one dimensional terrain map

    const terrain = [];

    for ( let x = 0; x < xl; ++x ) {
        for ( let y = 0; y < yl; ++y ) {
            terrain[ y * xl + x ] = map[ x ][ y ];
        }
    }
    return terrain;
}
