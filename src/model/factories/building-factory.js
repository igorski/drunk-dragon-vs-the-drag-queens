import { Map }            from 'rot-js';
import HashUtil           from '@/utils/hash-util';
import { positionAtRandomFreeTileType } from '@/utils/terrain-util';
import EnvironmentFactory from './environment-factory';

export const BUILDING_TYPE = 'Building';

/**
 * the tile types for rendering a Building
 */
export const BUILDING_TILES = {
    GROUND  : 0,
    WALL    : 1,
    STAIRS  : 2,
    NOTHING : 3
};

const BuildingFactory =
{
    create( x = 0, y = 0 ) {
        const building = EnvironmentFactory.create( x, y );

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
        let i, MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_WIDTH, MIN_ROOM_HEIGHT, MAX_ROOM_WIDTH, MAX_ROOM_HEIGHT;
        let terrain;

        for ( i = 0; i < floorAmount; ++i )
        {
            MAP_WIDTH       = Math.round( Math.random() * 50 ) + 10;
            MAP_HEIGHT      = Math.round( Math.random() * 50 ) + 10;
            MIN_ROOM_WIDTH  = Math.min( Math.round( Math.random() * 10 ) + 2, MAP_WIDTH );
            MIN_ROOM_HEIGHT = Math.min( Math.round( Math.random() * 10 ) + 2, MAP_HEIGHT );
            MAX_ROOM_WIDTH  = Math.min( Math.round( Math.random() * playerLevel * 10 ) + 2, MAP_WIDTH  );
            MAX_ROOM_HEIGHT = Math.min( Math.round( Math.random() * playerLevel * 10 ) + 2, MAP_HEIGHT );

            // make sure the maximum dimensions exceed the minimum dimensions !

            MAX_ROOM_WIDTH  = Math.max( MIN_ROOM_WIDTH, MAX_ROOM_WIDTH );
            MAX_ROOM_HEIGHT = Math.max( MIN_ROOM_HEIGHT, MAX_ROOM_HEIGHT );

            try {
                terrain = digger( MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_WIDTH, MIN_ROOM_HEIGHT, MAX_ROOM_WIDTH, MAX_ROOM_HEIGHT );
            }
            catch ( e ) {
                console.log(
                    `BuildingFactory::ERROR "${e.message}" occurred when generating for size:
                    ${MAP_WIDTH} x ${MAP_HEIGHT} with min room size:
                    ${MIN_ROOM_WIDTH} x ${MIN_ROOM_HEIGHT} and max room size:
                    ${MAX_ROOM_WIDTH} x ${MAX_ROOM_HEIGHT}`
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
            floors.push( BuildingFactory.createFloor( MAP_WIDTH, MAP_HEIGHT, terrain ));
        }
        aBuilding.floors = floors; // commit the floors to the Building
    },

    /**
     * @param {number} width
     * @param {number} height
     * @param {Array<number>} terrain
     */
    createFloor( width, height, terrain = [] )
    {
        const out = {
            width,
            height,
            terrain,
            exits: [],
            treasures: [],
            startX: 0,
            startY: 0
        };

        // cache treasures and exits for floor

        for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
            // found the exit ?
            if ( terrain[ y * width + x ] === BUILDING_TILES.STAIRS ) {
                out.exits.push({ x, y });
            }
        }

        // TODO : no treasures yet

        // determine Players begin offset

        for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
            // use first instance of ground as the start offset
            if ( terrain[ y * width + x ] === BUILDING_TILES.GROUND ) {
                out.startX = x;
                out.startY = y;
                break;
            }
        }
    //        this.startX = Math.round( this.width / 2 );
    //        this.startY = Math.round( this.height / 2 );
        return out;
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
            enemies: data.e,
            terrain: data.t,
            type: data.ty,
            floor: data.f || NaN,
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
             e: building.enemies,
             t: building.terrain,
             ty: building.type,
             f: building.floor,
             fs: building.floors,
         };
     }
};
export default BuildingFactory;

// taken from dungen https://github.com/englercj/dungen

function digger( roomWidth, roomHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight )
{
    // do size - 1 since algo puts rooms up against side, and we need to create walls there later
    const digger = new Map.Digger( roomWidth - 1, roomHeight - 1,
    {
        roomWidth      : [ minRoomWidth,  maxRoomWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoomHeight, maxRoomHeight ], /* room minimum and maximum height */
        corridorLength : [ 3, 10 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of floor area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    });
    const map = [];

    // init map

    for ( let x = 0; x < roomWidth; ++x )
    {
        map[ x ] = [];
        for( let y = 0; y < roomHeight; ++y ) {
            map[ x ][ y ] = BUILDING_TILES.NOTHING;
        }
    }

    // create map
    digger.create(( i, j, tile ) =>
    {
        switch( tile )
        {
            case 1:
                map[ i + 1 ][ j + 1 ] = BUILDING_TILES.NOTHING;
                break;

            case 0:
                map[ i + 1 ][ j + 1 ] = BUILDING_TILES.GROUND;
                break;
        }
    });

    const xl = map.length;
    const yl = map[ 0 ].length;

    // setup walls
    for ( let x = 0; x < xl; ++x )
    {
        for ( let y = 0; y < yl; ++y )
        {
            if ( map[ x ][ y ] === BUILDING_TILES.GROUND )
            {
                for ( let xx = x - 1; xx <= x + 1 && xx > 0; ++xx )
                {
                    for ( let yy = y - 1; yy <= y + 1 && yy > 0; ++yy )
                    {
                        if ( map[ xx ][ yy ] === BUILDING_TILES.NOTHING )
                            map[ xx ][ yy ] = BUILDING_TILES.WALL;
                    }
                }
            }
        }
    }

    // convert two dimensional array to one dimensional terrain map

    const terrain = [];

    for ( let x = 0; x < xl; ++x )
    {
        for ( let y = 0; y < yl; ++y ) {
            terrain[ y * xl + x ] = map[ x ][ y ];
        }
    }
    return terrain;
}
