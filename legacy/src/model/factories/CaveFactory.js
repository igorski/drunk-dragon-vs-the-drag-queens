/**
 * Created by igorzinken on 12-03-15.
 */
var HashUtil    = require( "../../utils/HashUtil" );
var TerrainUtil = require( "../../utils/TerrainUtil" );
var Cave        = require( "../vo/Cave" );
var CaveLevel   = require( "../vo/CaveLevel" );
var ROT         = require( "../../modules/third_party/ROT" );

var CaveFactory = module.exports =
{
    /**
     * generate the caves terrain for the given
     * Cave aCave and the given game hash
     *
     * @public
     *
     * @param {string} aHash
     * @param {Cave} aCave
     * @param {Player} aPlayer
     */
    generate : function( aHash, aCave, aPlayer )
    {
        var levelAmount = aPlayer.level % 30 + 1;
        var levels      = [];

        // generate terrain for each level

        var maxLevel = levelAmount - 1;
        var i, MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_WIDTH, MIN_ROOM_HEIGHT, MAX_ROOM_WIDTH, MAX_ROOM_HEIGHT;
        var terrain;

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

            try
            {
                terrain = digger( MAP_WIDTH, MAP_HEIGHT, MIN_ROOM_WIDTH, MIN_ROOM_HEIGHT, MAX_ROOM_WIDTH, MAX_ROOM_HEIGHT );
            }
            catch ( e ) {
                console.log( "CaveFactory::ERROR '" + e.message + "' occurred when generating for size: " +
                MAP_WIDTH + " x " + MAP_HEIGHT + " with min room size: " + MIN_ROOM_WIDTH + " x " + MIN_ROOM_HEIGHT +
                " and max room size: " + MAX_ROOM_WIDTH + " x " + MAX_ROOM_HEIGHT );
            }

            // create the tunnel to the next level

            if ( i !== maxLevel )
            {
                terrain[ TerrainUtil.positionAtRandomFreeTileType( terrain, Cave.Tiles.GROUND ) ] = Cave.Tiles.TUNNEL;
            }
            else {
                // or the treasure that leads to the outside
                // TODO ... make treasure for now we just add another tunnel
                terrain[ TerrainUtil.positionAtRandomFreeTileType( terrain, Cave.Tiles.GROUND ) ] = Cave.Tiles.TUNNEL;
                // E.O .TODO
            }
            levels.push( new CaveLevel( MAP_WIDTH, MAP_HEIGHT, terrain ));
        }
        aCave.levels = levels; // commit the levels to the Cave
    }
};

// taken from dungen https://github.com/englercj/dungen

function digger( dungeonWidth, dungeonHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight )
{
    //do size - 1 since algo puts rooms up against side, and we need to create walls there later
    var digger = new ROT.Map.Digger( dungeonWidth - 1, dungeonHeight - 1,
    {
        roomWidth      : [ minRoomWidth,  maxRoomWidth  ], /* room minimum and maximum width */
        roomHeight     : [ minRoomHeight, maxRoomHeight ], /* room minimum and maximum height */
        corridorLength : [ 3, 10 ], /* corridor minimum and maximum length */
        dugPercentage  : 0.2, /* we stop after this percentage of level area has been dug out */
        timeLimit      : 1000 /* we stop after this much time has passed (msec) */
    }),
    map = [];

    // init map

    var x, y;

    for( x = 0; x < dungeonWidth; ++x )
    {
        map[ x ] = [];
        for( y = 0; y < dungeonHeight; ++y ) {
            map[ x ][ y ] = Cave.Tiles.NOTHING;
        }
    }

    // create map
    digger.create( function( i, j, tile )
    {
        switch( tile )
        {
            case 1:
                map[ i + 1 ][ j + 1 ] = Cave.Tiles.NOTHING;
                break;

            case 0:
                map[ i + 1 ][ j + 1 ] = Cave.Tiles.GROUND;
                break;
        }
    });

    var xl = map.length;
    var yl = map[ 0 ].length;

    // setup walls
    for ( x = 0; x < xl; ++x )
    {
        for( y = 0; y < yl; ++y )
        {
            if ( map[ x ][ y ] === Cave.Tiles.GROUND )
            {
                for ( var xx = x - 1; xx <= x + 1 && xx > 0; ++xx )
                {
                    for( var yy = y - 1; yy <= y + 1 && yy > 0; ++yy )
                    {
                        if ( map[ xx ][ yy ] === Cave.Tiles.NOTHING )
                            map[ xx ][ yy ] = Cave.Tiles.WALL;
                    }
                }
            }
        }
    }

    // convert two dimensional array to one dimensional terrain map

    var terrain = [];

    for ( x = 0; x < xl; ++x )
    {
        for ( y = 0; y < yl; ++y ) {
            terrain[ y * xl + x ] = map[ x ][ y ];
        }
    }
    return terrain;
}
