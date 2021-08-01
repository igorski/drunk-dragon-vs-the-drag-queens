import { Map }            from "rot-js";
import PriceTypes         from "@/definitions/price-types";
import HashUtil           from "@/utils/hash-util";
import { FURNITURE }      from "@/utils/sprite-cache"
import WorldCache         from "@/utils/world-cache";
import { generateDragQueenName } from "@/utils/name-generator";
import CharacterFactory   from "./character-factory";
import EnvironmentFactory from "./environment-factory";
import {
    random, randomInRangeInt, randomFromList, randomBool
} from "@/utils/random-util";
import {
    positionAtFirstFreeTileType, positionAtLastFreeTileType, positionAtRandomFreeTileType,
    coordinateToIndex, getRandomFreeTilePosition, assertSurroundingTilesOfTypeAroundPoint
} from "@/utils/terrain-util";
import { reserveObject } from "@/utils/map-util";

export const BUILDING_TYPE = "Building";
export const FLOOR_TYPES = {
    BAR: 0,
    HOTEL: 1
};

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
 * Get the highest index within the tiles list that given character can walk on.
 * Depending on our inventory / other character properties we can navigate over
 * different tiles (e.g. walk on water)
 */
export const getMaxWalkableTile = character => BUILDING_TILES.STAIRS;

const MIN_FLOOR_AMOUNT  = 3;
const MIN_CORRIDOR_SIZE = 1;
const MIN_ROOM_SIZE     = MIN_CORRIDOR_SIZE * 4;
const MAX_ROOM_SIZE     = MIN_ROOM_SIZE * 3;

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
     * generate the terrain for the given building and game hash
     * as separate floors
     *
     * @param {string} hash
     * @param {Object} building
     * @param {Object} player
     */
    generateFloors( hash, building, player ) {
        const playerLevel = player?.xp ?? 1;
        const floorAmount = playerLevel % 30 + MIN_FLOOR_AMOUNT;
        const floors      = [];
        const floorTypes  = Object.values( FLOOR_TYPES );

        // generate terrain for each floor

        const maxFloor = floorAmount - 1;
        let i, floorWidth, floorHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight;

        for ( i = 0; i < floorAmount; ++i ) {
            floorWidth    = Math.round( randomInRangeInt( 0, 50 )) + 10;
            floorHeight   = Math.round( randomInRangeInt( 0, 50 )) + 10;
            // size of the rooms / corridors within the floor
            // the only thing that makes a room a corridor is when its size if belows the MIN_ROOM_SIZE
            minRoomWidth  = Math.round( randomInRangeInt( MIN_CORRIDOR_SIZE, MIN_ROOM_SIZE ));
            minRoomHeight = Math.round( randomInRangeInt( MIN_CORRIDOR_SIZE, MIN_ROOM_SIZE ));
            maxRoomWidth  = Math.min( randomInRangeInt( minRoomWidth, MAX_ROOM_SIZE ),  floorWidth  );
            maxRoomHeight = Math.min( randomInRangeInt( minRoomHeight, MAX_ROOM_SIZE ), floorHeight );

            // make sure the maximum dimensions exceed the minimum dimensions !

            maxRoomWidth  = Math.max( minRoomWidth,  maxRoomWidth );
            maxRoomHeight = Math.max( minRoomHeight, maxRoomHeight );

            // a bit bruteforce sillyness as every now and then ROT fails to create a terrain, just retry
            let tries = 255;
            const generate = (lastError = null) => {
                if ( --tries === 0 ) {
                    return lastError;
                }
                try {
                    return digger( floorWidth, floorHeight, minRoomWidth, minRoomHeight, maxRoomWidth, maxRoomHeight );
                } catch ( e ) {
                    return generate( e );
                }
            };
            const terrain = generate();
            if ( process.env.NODE_ENV === "development" ) {
                if ( terrain instanceof Error ) {
                    console.error(
                        `BuildingFactory::ERROR "${terrain.message}" occurred when generating for size:
                        ${floorWidth} x ${floorHeight} with min room size:
                        ${minRoomWidth} x ${minRoomHeight} and max room size:
                        ${maxRoomWidth} x ${maxRoomHeight} with ${tries} left`
                    );
                }
            }

            // create the exit to the previous floor/outside world

            terrain[ positionAtFirstFreeTileType( terrain, BUILDING_TILES.GROUND ) ] = BUILDING_TILES.STAIRS;

            let floorType = randomBool() ? FLOOR_TYPES.BAR : FLOOR_TYPES.HOTEL;
            if ( i === maxFloor ) {
                // the last floor should always be a hotel, ensure there is a hotel tile
                floorType = FLOOR_TYPES.HOTEL;
            } else {
                // all floors except for the last one have an the exit to the next floor
                terrain[ positionAtLastFreeTileType( terrain, BUILDING_TILES.GROUND ) ] = BUILDING_TILES.STAIRS;
            }
            floors.push( createFloor( floorWidth, floorHeight, terrain, floorType, player ));
        }
        building.floors = floors; // commit the floors to the Building
    },

    /**
     * assemble a serialized JSON structure
     * back into a building structure
     */
    assemble( data ) {
        const out  = EnvironmentFactory.assemble( data );

        out.floor  = data.f ?? NaN,
        out.floors = ( data.fs ?? [] ).map( floor => ({
            ...EnvironmentFactory.assemble( floor ),
            floorType: floor.ft,
            exits: floor.ex,
            hotels: floor.ho,
        }));
        return out;
    },

    /**
     * serializes a building structure into a JSON structure
     */
     disassemble( building ) {
         const out = EnvironmentFactory.disassemble( building );

         out.f  = building.floor;
         out.fs = building.floors.map( floor => ({
             ...EnvironmentFactory.disassemble( floor ),
             ft: floor.floorType,
             ex: floor.exits,
             ho: floor.hotels
         }));
         return out;
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
 * @param {number} floorType
 * @param {Object} player Character
 */
function createFloor( width, height, terrain = [], floorType, player ) {
    const environment = { width, height, terrain }; // temporarily used for Object positioning
    const characters  = [];
    const out = {
        ...EnvironmentFactory.create( 0, 0, width, height, characters, terrain ),
        type: BUILDING_TYPE,
        floorType,
        exits: [],
        hotels: [],
    };

    // create exits

    for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
        const tile = terrain[ coordinateToIndex( x, y, environment ) ];
        if ( tile === BUILDING_TILES.STAIRS ) {
            out.exits.push({ x, y });
        }
    }

    // create hotel

    if ( floorType === FLOOR_TYPES.HOTEL ) {
        let tries = 255; // let's not recurse forever
        while ( true ) {
            const priceList = [ PriceTypes.AVERAGE, PriceTypes.EXPENSIVE, PriceTypes.LUXURY ];
            const price = Math.round(( randomFromList( priceList ) * Math.random() ) + ( player.level * 2 ));
            const { x, y } = getRandomFreeTilePosition( out, BUILDING_TILES.GROUND );
            const hotel = { x, y, ...WorldCache.sizeHotel, price };
            const position = reserveObject( hotel, out );
            if ( position ) {
console.warn("generated hotel.");
                hotel.x = position.x;
                hotel.y = position.y;
                out.hotels.push( hotel );
                break;
            } else if ( --tries === 0 ) {
console.error("DRAT! (could not place hotel)");
                floorType = out.floorType = FLOOR_TYPES.BAR;
                break;
            }
        }
    }

    // create characters (TODO)
/*
    const totalCharacters  = Math.round( terrain.filter( type => type === BUILDING_TILES.GROUND ).length / 50 );
    const characterIndices = [];

    for ( let i = 0; i < totalCharacters; ++i ) {
        let x = randomInRangeInt( 0, width - 1 );
        let y = randomInRangeInt( 0, height - 1 );
        for ( ; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
            const index = coordinateToIndex( x, y, environment );
            if ( terrain[ index ] === BUILDING_TILES.GROUND ) {
                if ( assertSurroundingTilesOfTypeAroundPoint( x, y, environment, BUILDING_TILES.GROUND )
                     && !characterIndices.includes( index ))
                 {
                    out.characters.push( CharacterFactory.create({ x, y }, { name: generateDragQueenName() }));
                    characterIndices.push( index );
                    break; // on to next character
                }
            }
        }
    }

    if ( process.env.NODE_ENV === "development" ) {
        console.warn( `Generated ${characterIndices.length} characters for a possible max of ${totalCharacters}` );
    }
*/
    // determine Players begin offset

    for ( let x = 0, y = 0; y < height; x = ( ++x === width ? ( x % width + ( ++y & 0 ) ) : x )) {
        // use first instance of ground as the start offset
        if ( terrain[ coordinateToIndex( x, y, environment ) ] === BUILDING_TILES.GROUND ) {
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
