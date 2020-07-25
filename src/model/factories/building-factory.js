import { Map }            from 'rot-js';
import HashUtil           from '@/utils/hash-util';
import WorldCache         from '@/utils/world-cache';
import CharacterFactory   from './character-factory';
import EnvironmentFactory from './environment-factory';
import { positionAtRandomFreeTileType, coordinateToIndex } from '@/utils/terrain-util';

export const BUILDING_TYPE = 'Building';

/**
 * the tile types for rendering a Building
 */
export const BUILDING_TILES = {
    GROUND  : 0,
    STAIRS  : 1,
    WALL    : 2,
    NOTHING : 3
};
/**
* Highest index within the tiles list which is associated
* with a tile type that the player can walk on
*/
export const MAX_WALKABLE_TILE = BUILDING_TILES.STAIRS;

const BuildingFactory =
{
    create( x = 0, y = 0 ) {
        const { width, height } = WorldCache.sizeBuilding;
        const building = EnvironmentFactory.create( x, y, width, height );

        building.type   = BUILDING_TYPE;
        building.floor  = NaN; // the current floor within the building where the player is at
        building.floors = [];  // the terrains for all floors

        return building;
    },

    /**
     * generate the terrain for the given Building and game hash
     *
     * @param {string} aHash
     * @param {Object} aBuilding
     * @param {Object} aPlayer
     */
    generateFloors( aHash, aBuilding, aPlayer ) {
        const playerLevel = aPlayer.level || 1; // TODO : how to increment player skill
        const floorAmount = playerLevel % 30 + 1;
        const floors      = [];

        // generate terrain for each floor

        const maxFloor = floorAmount - 1;
        let i, floorWidth, floorHeight, minFloorWidth, minFloorHeight, maxFloorWidth, maxFloorHeight;

        for ( i = 0; i < floorAmount; ++i ) {
            floorWidth     = Math.round( Math.random() * 50 ) + 10;
            floorHeight    = Math.round( Math.random() * 50 ) + 10;
            minFloorWidth  = Math.min( Math.round( Math.random() * 10 ) + 2, floorWidth );
            minFloorHeight = Math.min( Math.round( Math.random() * 10 ) + 2, floorHeight );
            maxFloorWidth  = Math.min( Math.round( Math.random() * playerLevel * 10 ) + 2, floorWidth  );
            maxFloorHeight = Math.min( Math.round( Math.random() * playerLevel * 10 ) + 2, floorHeight );

            // make sure the maximum dimensions exceed the minimum dimensions !

            maxFloorWidth  = Math.max( minFloorWidth,  maxFloorWidth );
            maxFloorHeight = Math.max( minFloorHeight, maxFloorHeight );

            // a bit bruteforce sillyness every now and then ROT fails to create a terrain, just retry
            let tries = 255;
            const generate = (lastError = null) => {
                if ( --tries === 0 ) {
                    return lastError;
                }
                try {
                    return digger( floorWidth, floorHeight, minFloorWidth, minFloorHeight, maxFloorWidth, maxFloorHeight );
                } catch ( e ) {
                    return generate( e );
                }
            };
            const terrain = generate();
            if ( terrain instanceof Error ) {
                console.error(
                    `BuildingFactory::ERROR "${terrain.message}" occurred when generating for size:
                    ${floorWidth} x ${floorHeight} with min floor size:
                    ${minFloorWidth} x ${minFloorHeight} and max floor size:
                    ${maxFloorWidth} x ${maxFloorHeight} with ${tries} left`
                );
            }

            // create the exit to the next floor

            if ( i !== maxFloor ) {
                terrain[ positionAtRandomFreeTileType( terrain, BUILDING_TILES.GROUND ) ] = BUILDING_TILES.STAIRS;
            }
            else {
                // or the treasure that leads to the outside
                // TODO ... make treasure for now we just add another STAIRS
                terrain[ positionAtRandomFreeTileType( terrain, BUILDING_TILES.GROUND ) ] = BUILDING_TILES.STAIRS;
                // E.O .TODO
            }
            floors.push( createFloor( floorWidth, floorHeight, terrain ));
        }
        aBuilding.floors = floors; // commit the floors to the Building
    },

    /**
     * assemble a serialized JSON structure
     * back into a building structure
     */
    assemble( data ) {
        return {
            x: data.x,
            y: data.y,
            width: data.w,
            height: data.h,
            characters: data.c.map( c => CharacterFactory.assemble( c )),
            terrain: data.t,
            type: data.ty,
            floor: data.f ?? NaN,
            floors: data.fs
        };
    },

    /**
     * serializes a building structure into a JSON structure
     */
     disassemble( building ) {
         return {
             x: building.x,
             y: building.y,
             w: building.width,
             h: building.height,
             c: building.characters.map( c => CharacterFactory.disassemble( c )),
             t: building.terrain,
             ty: building.type,
             f: building.floor,
             fs: building.floors,
         };
     }
};
export default BuildingFactory;

/* internal methods */

/**
 * A floor is essentially an environment within a building
 *
 * @param {number} width
 * @param {number} height
 * @param {Array<number>} terrain
 */
function createFloor( width, height, terrain = [] ) {
    const characters = [];
    const out = {
        ...EnvironmentFactory.create( 0, 0, width, height, characters, terrain ),
        type: BUILDING_TYPE,
        exits: [],
        treasures: []
    };

    // create exit

    for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
        // found the exit ?
        if ( terrain[ coordinateToIndex( x, y, { width }) ] === BUILDING_TILES.STAIRS ) {
            out.exits.push({ x, y });
        }
    }

    // TODO : no treasures yet

    // determine Players begin offset

    for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
        // use first instance of ground as the start offset
        if ( terrain[ coordinateToIndex( x, y, { width }) ] === BUILDING_TILES.GROUND ) {
            out.x = x;
            out.y = y;
            break;
        }
    }
    return out;
};

function digger( roomWidth, roomHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight ) {
    // do size - 1 since algorithm puts rooms up against side, and we need to create walls there later
    const digger = new Map.Digger( roomWidth - 1, roomHeight - 1, {
        roomWidth      : [ minRoomWidth,  maxRoomWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoomHeight, maxRoomHeight ], /* room minimum and maximum height */
        corridorLength : [ 3, 10 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of floor area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    });
    const map = [];

    // init output terrain map

    for ( let x = 0; x < roomWidth; ++x ) {
        map[ x ] = new Array( roomHeight ).fill( BUILDING_TILES.NOTHING );
    }

    // create map
    digger.create(( x, y, tile ) => {
        switch( tile ) {
            case 1:
                map[ x + 1 ][ y + 1 ] = BUILDING_TILES.NOTHING;
                break;
            case 0:
                map[ x + 1 ][ y + 1 ] = BUILDING_TILES.GROUND;
                break;
        }
    });
    const xl = map.length;
    const yl = map[ 0 ].length;

    // setup walls
    for ( let x = 0; x < xl; ++x ) {
        for ( let y = 0; y < yl; ++y ) {
            if ( map[ x ][ y ] === BUILDING_TILES.GROUND ) {
                for ( let xx = x - 1; xx <= x + 1 && xx > 0; ++xx ) {
                    for ( let yy = y - 1; yy <= y + 1 && yy > 0; ++yy ) {
                        if ( map[ xx ][ yy ] === BUILDING_TILES.NOTHING ) {
                            map[ xx ][ yy ] = BUILDING_TILES.WALL;
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
