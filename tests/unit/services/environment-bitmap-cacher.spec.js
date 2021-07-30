import {
    getTileDescription,
    FULL_SIZE,
    BOTTOM_RIGHT,
    BOTTOM_LEFT,
    TOP_RIGHT,
    TOP_LEFT,
    EMPTY_LEFT,
    EMPTY_RIGHT,
    EMPTY_TOP,
    EMPTY_BOTTOM,
    EMPTY_BOTTOM_RIGHT,
    EMPTY_BOTTOM_LEFT,
    EMPTY_TOP_RIGHT,
    EMPTY_TOP_LEFT
} from "@/services/environment-bitmap-cacher";
import BuildingFactory, { BUILDING_TYPE, BUILDING_TILES } from "@/model/factories/building-factory";
import { coordinateToIndex } from "@/utils/terrain-util";

jest.mock( "zcanvas", () => ({
    loader: {
        onReady: new Promise(resolve => resolve())
    },
    sprite: jest.fn()
}));

describe("Environment bitmap cacher", () => {
    it.skip("should calculate the correct tile sheet indices for the floor terrain walls", () => {
        const environment = BuildingFactory.create();

        // cache the building tile types (makes it easier to "view" the map
        // in below terrain list)

        const n = BUILDING_TILES.NOTHING;
        const g = BUILDING_TILES.GROUND;
        const X = BUILDING_TILES.STAIRS;
        const W = BUILDING_TILES.WALL;

        // create a floor with a terrain that covers most edge cases (mostly double walls!)

        const x = 2, y = 2, width = 12, height = 12;
        const floor = {
            x, y, width, height,
            type: BUILDING_TYPE,
            exits: [{ x: 5, y: 10 }],
            terrain: [
                n, n, n, n, n, n, n, n, n, n, n, n,
                n, W, W, W, W, n, n, n, n, n, n, n,
                n, W, g, g, W, W, W, W, W, W, W, n,
                n, W, g, g, g, g, g, g, g, g, W, n,
                n, W, W, W, W, W, W, W, g, g, W, n,
                n, n, W, g, g, g, g, g, g, W, W, n,
                W, W, W, g, g, g, W, W, W, W, n, n,
                W, g, g, g, g, g, W, n, n, n, n, n,
                W, W, W, W, W, g, W, n, n, n, n, n,
                n, n, n, n, W, g, W, n, n, n, n, n,
                n, n, n, n, W, X, W, n, n, n, n, n,
                n, n, n, n, W, W, W, n, n, n, n, n,
            ]
        };

        // all above walls mapped to their expected tile indices

        const expected = [
            BOTTOM_RIGHT, EMPTY_TOP, EMPTY_TOP, BOTTOM_LEFT,
            EMPTY_LEFT, EMPTY_TOP_RIGHT, EMPTY_TOP, EMPTY_TOP, EMPTY_TOP, EMPTY_TOP, EMPTY_TOP, BOTTOM_LEFT,
            EMPTY_LEFT, EMPTY_RIGHT,
            TOP_RIGHT, EMPTY_BOTTOM_LEFT, EMPTY_TOP, EMPTY_TOP, EMPTY_TOP, EMPTY_TOP, EMPTY_TOP, EMPTY_RIGHT,
            EMPTY_LEFT, EMPTY_BOTTOM_RIGHT, TOP_LEFT,
            BOTTOM_RIGHT, EMPTY_TOP, EMPTY_TOP_LEFT, EMPTY_BOTTOM_RIGHT, EMPTY_BOTTOM, EMPTY_BOTTOM, TOP_LEFT,
            EMPTY_LEFT, EMPTY_RIGHT,
            TOP_RIGHT, EMPTY_BOTTOM, EMPTY_BOTTOM, EMPTY_BOTTOM, EMPTY_BOTTOM_LEFT, EMPTY_RIGHT,
            EMPTY_LEFT, EMPTY_RIGHT,
            EMPTY_LEFT, EMPTY_RIGHT,
            TOP_RIGHT, EMPTY_BOTTOM, TOP_LEFT
        ];

        // assemble the tile descriptions

        const areas = [];
        for ( let x = 0; x < floor.width; ++x ) { // rows
            for ( let y = 0; y < floor.height; ++y ) { // columns
                const desc = getTileDescription( x, y, floor );
                // only push the wall types as we only want to assert these
                if ([ BUILDING_TILES.WALL ].includes( desc.type )) {
                    areas[ coordinateToIndex( x, y, floor )] = desc.area;
                }
            }
        }

        // assert the list looks as expected

        expect( areas.filter( value => value !== undefined )).toEqual( expected );
    });
});
