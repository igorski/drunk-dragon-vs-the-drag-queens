import { Map }            from 'rot-js';
import HashUtil           from '@/utils/hash-util';
import TerrainUtil        from '@/utils/terrain-util';
import EnvironmentFactory from './environment-factory';

export const CAVE_TYPE = 'Cave';

/**
 * the tile types for rendering a Cave
 */
export const CAVE_TILES = {
    GROUND  : 0,
    WALL    : 1,
    TUNNEL  : 2,
    NOTHING : 3
};

const CaveFactory =
{
    create( x = 0, y = 0 ) {
        const cave = EnvironmentFactory.create( x, y );

        cave.type   = CAVE_TYPE;
        cave.level  = NaN; // the current level within the cave where the player is at
        cave.levels = [];  // the terrains for all levels

        return cave;
    },

    /**
     * generate the caves terrain for the given
     * Cave aCave and the given game hash
     *
     * @param {string} aHash
     * @param {Cave} aCave
     * @param {Player} aPlayer
     */
    generateCaveLevels( aHash, aCave, aPlayer ) {
        const levelAmount = aPlayer.level % 30 + 1;
        const levels      = [];

        // generate terrain for each level

        const maxLevel = levelAmount - 1;
        let i, MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_WIDTH, MIN_ROOM_HEIGHT, MAX_ROOM_WIDTH, MAX_ROOM_HEIGHT;
        let terrain;

        for ( i = 0; i < levelAmount; ++i )
        {
            MAP_WIDTH       = Math.round( Math.random() * 50 ) + 10;
            MAP_HEIGHT      = Math.round( Math.random() * 50 ) + 10;
            MIN_ROOM_WIDTH  = Math.min( Math.round( Math.random() * 10 ) + 2, MAP_WIDTH );
            MIN_ROOM_HEIGHT = Math.min( Math.round( Math.random() * 10 ) + 2, MAP_HEIGHT );
            MAX_ROOM_WIDTH  = Math.min( Math.round( Math.random() * aPlayer.level * 10 ) + 2, MAP_WIDTH  );
            MAX_ROOM_HEIGHT = Math.min( Math.round( Math.random() * aPlayer.level * 10 ) + 2, MAP_HEIGHT );

            // make sure the maximum dimensions exceed the minimum dimensions !

            MAX_ROOM_WIDTH  = Math.max( MIN_ROOM_WIDTH, MAX_ROOM_WIDTH );
            MAX_ROOM_HEIGHT = Math.max( MIN_ROOM_HEIGHT, MAX_ROOM_HEIGHT );

            try {
                terrain = digger( MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_WIDTH, MIN_ROOM_HEIGHT, MAX_ROOM_WIDTH, MAX_ROOM_HEIGHT );
            }
            catch ( e ) {
                console.log(
                    `CaveFactory::ERROR "${e.message}" occurred when generating for size:
                    ${MAP_WIDTH} x ${MAP_HEIGHT} with min room size:
                    ${MIN_ROOM_WIDTH} x ${MIN_ROOM_HEIGHT} and max room size:
                    ${MAX_ROOM_WIDTH} x ${MAX_ROOM_HEIGHT}`
                );
            }

            // create the tunnel to the next level

            if ( i !== maxLevel )
            {
                terrain[ TerrainUtil.positionAtRandomFreeTileType( terrain, CAVE_TILES.GROUND ) ] = CAVE_TILES.TUNNEL;
            }
            else {
                // or the treasure that leads to the outside
                // TODO ... make treasure for now we just add another tunnel
                terrain[ TerrainUtil.positionAtRandomFreeTileType( terrain, CAVE_TILES.GROUND ) ] = CAVE_TILES.TUNNEL;
                // E.O .TODO
            }
            levels.push( CaveFactory.createCaveLevel( MAP_WIDTH, MAP_HEIGHT, terrain ));
        }
        aCave.levels = levels; // commit the levels to the Cave
    },

    /**
     * @param {number} width
     * @param {number} height
     * @param {Array<number>} terrain
     */
    createCaveLevel( width, height, terrain = [] )
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

        // cache treasures and exits for level

        for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x ) )
        {
            // found the exit ?
            if ( terrain[ y * width + x ] === CAVE_TILES.TUNNEL ) {
                out.exits.push({ x, y });
            }
        }

        // TODO : no treasures yet

        // determine Players begin offset

        for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x ) )
        {
            // use first instance of ground as the start offset
            if ( terrain[ y * width + x ] === CAVE_TILES.GROUND ) {
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
     * back into a cave structure
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
            level: data.l || NaN,
            levels: data.ls
        };
    },

    /**
     * serializes a cave structure into a JSON structure
     */
     disassemble( cave ) {
         return {
             x: cave.x,
             y: cave.y,
             w: cave.width,
             h: cave.height,
             e: cave.enemies,
             t: cave.terrain,
             ty: cave.type,
             l: cave.level,
             ls: cave.levels,
         };
     }
};
export default CaveFactory;

// taken from dungen https://github.com/englercj/dungen

function digger( dungeonWidth, dungeonHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight )
{
    // do size - 1 since algo puts rooms up against side, and we need to create walls there later
    const digger = new Map.Digger( dungeonWidth - 1, dungeonHeight - 1,
    {
        roomWidth      : [ minRoomWidth,  maxRoomWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoomHeight, maxRoomHeight ], /* room minimum and maximum height */
        corridorLength : [ 3, 10 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of level area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    });
    const map = [];

    // init map

    for ( let x = 0; x < dungeonWidth; ++x )
    {
        map[ x ] = [];
        for( let y = 0; y < dungeonHeight; ++y ) {
            map[ x ][ y ] = CAVE_TILES.NOTHING;
        }
    }

    // create map
    digger.create(( i, j, tile ) =>
    {
        switch( tile )
        {
            case 1:
                map[ i + 1 ][ j + 1 ] = CAVE_TILES.NOTHING;
                break;

            case 0:
                map[ i + 1 ][ j + 1 ] = CAVE_TILES.GROUND;
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
            if ( map[ x ][ y ] === CAVE_TILES.GROUND )
            {
                for ( let xx = x - 1; xx <= x + 1 && xx > 0; ++xx )
                {
                    for ( let yy = y - 1; yy <= y + 1 && yy > 0; ++yy )
                    {
                        if ( map[ xx ][ yy ] === CAVE_TILES.NOTHING )
                            map[ xx ][ yy ] = CAVE_TILES.WALL;
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
