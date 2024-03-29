import { zThread, zThreader } from "zthreader";
import { Loader }             from "zcanvas";
import { createPixelCanvas }  from "@/utils/canvas-util";
import SpriteCache            from "@/utils/sprite-cache";
import WorldCache             from "@/utils/world-cache";
import { generateBitmap }     from "@/renderers/character-queen-bitmap";

import { BUILDING_TYPE, BUILDING_TILES, FLOOR_TYPES } from "@/model/factories/building-factory";
import { WORLD_TYPE, WORLD_TILES } from "@/model/factories/world-factory";

const NONE = undefined;

/**
 * This method takes in the terrain of the given environment and renders
 * its contents onto a Bitmap image. This image is then consumed by the environment
 * specific renderers in the @/renderers folder. Basically this precaches the
 * entire environment contents for fast direct-from-memory blitting in the sprite
 * reducing the need for repeated recalculation of non-dynamic content
 */
export const renderEnvironment = ( environment, player ) =>
{
    const { width, height, terrain, type, characters } = environment;

    return new Promise(( resolve, reject ) => {
        const { tileWidth, tileHeight } = WorldCache;
        const { cvs, ctx } = createPixelCanvas( tileWidth * width, tileHeight * height );

        // we render the above coordinates, with addition of one extra
        // tile outside of the tiles (prevents blank screen during movement)

        let rl = 0, rr = width;
        let rt = 0, rb = height;

        let i, j, l, x, y, terrainTile;

        // use zThreader and zThreads as this can be quite a heavy operation
        // investigate how we can have a canvas and images available in a Worker

        zThreader.init( .5, 60 );

        // here we define our own custom override of the zThread internal execution handler to
        // render all columns of a single row, one by one

        const MAX_ITERATIONS = rb;    // all rows
        let iterations       = rt - 1;

        const thread = new zThread({
            executionFn: () => {
                // the amount of times we call the "render"-function
                // per iteration of the internal execution method
                const stepsPerIteration = 1;

                for ( let i = 0; i < stepsPerIteration; ++i ) {
                    if ( iterations >= MAX_ITERATIONS ) {
                        // process the finalRenders and we're done
                        while ( finalRenders.length ) {
                            finalRenders.shift()();
                        }
                        return true;
                    }
                    else {
                        // execute operation (and increment iteration)
                        render( ++iterations );
                    }
                }
                return false;
            },
            completeFn: async () => {
            // store the result
            // TODO : investigate https://github.com/imaya/CanvasTool.PngEncoder for 8-bit PNG ?

            let target;
            switch ( environment.type ) {
                default:
                    throw new Error(`Unknown environment "${environment.type}"`);
                case WORLD_TYPE:
                    target = SpriteCache.ENV_WORLD;
                    break;
                case BUILDING_TYPE:
                    target = SpriteCache.ENV_BUILDING;
                    break;
            }
            const image = new Image();
           
            image.src    = cvs.toDataURL( "image/png" );
            image.width  = cvs.width;
            image.height = cvs.height;

            target.bitmap = image;

            // Environment terrain rendered, await Bitmap ready
            await Loader.onReady( image );
            
            // generate player Bitmap
            const bitmap = await generateBitmap( player );
            player.asset = { bitmap, width: bitmap.width, height: bitmap.height };

            // ensure all Characters also have their Bitmaps cached
            for ( i = 0, l = characters.length; i < l; ++i ) {
                const character = characters[ i ];
                if ( !characters.asset ) {
                    const bitmap = await generateBitmap( character );
                    character.asset = { bitmap, width: bitmap.width, height: bitmap.height };
                }
            }
            resolve( target );
        }});

        // function to render the sprites onto the Canvas

        const finalRenders = [];
        function render( aIteration ) {
            for ( i = aIteration, l = aIteration + 1; i < l; ++i ) { // rows
                for ( j = rl; j < rr; ++j ) { // columns
                    x = j * tileWidth;
                    y = i * tileHeight;
                    drawTileForSurroundings( ctx, j, i, x, y, environment, finalRenders );
                }
            }
        }

        // TODO : separate into individual tiles for mobile ?

        thread.run(); // start crunching
    });
};

/* internal methods */

/**
 * draws a tile taking the surrounding tiles into account for an aesthetically
 * pleasing result by linking the adjacent tiletypes
 *
 * @param {CanvasRenderingContext2D} ctx to draw on
 * @param {number} tx x index of the tile in the terrain map
 * @param {number} ty y index of the tile in the terrain map
 * @param {number} x targetX to draw the tile at on the ctx
 * @param {number} y targetY to draw the tile at on the ctx
 * @param {Object} environment the environment we're rendering
 * @param {Array<Function>} finalRenders list of items to render last (above everything else)
 */
function drawTileForSurroundings( ctx, tx, ty, x, y, environment, finalRenders ) {
    const tile     = getTileDescription( tx, ty, environment );
    const tileType = tile.type;

    // TODO : can we make this more generic ?

    if ( environment.type === WORLD_TYPE ) {
        const SIDEWALK_TYPE = WORLD_TILES.GROUND;
        switch ( tileType ) {
            default:
            case SIDEWALK_TYPE:
            case WORLD_TILES.GRASS:
            case WORLD_TILES.ROAD:
                drawTile( ctx, getSheetCache( environment, tile ), 0, x, y );
                break;

            case WORLD_TILES.SAND:
            case WORLD_TILES.WATER:
            case WORLD_TILES.MOUNTAIN:
                drawTile( ctx, getSheetCache( environment, tile ), 0, x, y ); // draw tile underground first
                drawAdjacentTiles( tile, tx, ty, x, y, environment, ctx );
                break;

            case WORLD_TILES.TREE:
                drawTile( ctx, SpriteCache.GRASS, 0, x, y ); // grassy underground first
                // trees goe on top of everything, render last
                finalRenders.push(() => {
                    drawTile( ctx, SpriteCache.TREE,  0, x, y );
                });
                break;
        }
        // draw sidewalk edges when applicable (the sidewalk in the world environment gets
        // custom treatment as it receives a tiny hint of depth
        const {
            tileLeft, tileRight, tileAbove, tileAboveLeft, tileAboveRight,
            tileBelow, tileBelowLeft, tileBelowRight,
        } = getSurroundingTiles( tileType, tx, ty, environment );

        if ( tileType === SIDEWALK_TYPE ) return; // only draw when surrounding tiles are sidewalks
        if ( tileAbove === SIDEWALK_TYPE ) {
            let sheetX = 160;
            if ( tileAboveRight !== SIDEWALK_TYPE ) sheetX = 180;
            else if ( tileAboveLeft !== SIDEWALK_TYPE ) sheetX = 200;
            drawTile( ctx, SpriteCache.GROUND, sheetX, x, y );
        }/*
        if ( tileBelow === SIDEWALK_TYPE ) {
            let sheetX = 140;
            if ( tileBelowRight !== SIDEWALK_TYPE ) sheetX = 220;
            else if ( tileBelowLeft !== SIDEWALK_TYPE ) sheetX = 240;
            drawTile( ctx, SpriteCache.GROUND, sheetX, x, y );
        }*/
    }
    else if ( environment.type === BUILDING_TYPE ) {
        switch ( tileType ) {
            case BUILDING_TILES.GROUND:
                return drawTile( ctx, getFloorCache( environment ), 0, x, y );

            case BUILDING_TILES.WALL:
                drawAdjacentTiles( tile, tx, ty, x, y, environment, ctx  );
                break;

            case BUILDING_TILES.STAIRS:
                return drawTile( ctx, getFloorCache( environment ), 260, x, y );

            default:
            case BUILDING_TILES.NOTHING:
                return;
        }
    }
    else {
        throw new Error( `unknown Environment "${environment.type}"` );
    }
}

/**
 * actual rendering of a single tile onto the canvas
 *
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 * @param {{ bitmap: Image }} entry source spritesheet
 * @param {number} tileSourceX source x-coordinate of the tile (relative
 *                 to its spritesheet aBitmap)
 * @param {number} targetX target x-coordinate of the tile inside the given context
 * @param {number} targetY target y-coordinate of the tile inside the given context
 */
function drawTile( aCanvasContext, entry, tileSourceX, targetX, targetY ) {
    if ( tileSourceX < 0 ) {
        return;
    }
    aCanvasContext.drawImage(
        entry.bitmap,
        tileSourceX, 0, TILE_SIZE, TILE_SIZE,
        targetX, targetY, TILE_SIZE, TILE_SIZE
    );
}

function getSurroundingTiles( tile, tx, ty, environment ) {
    const { width, height, terrain } = environment;
    const maxX = width - 1, maxY = environment.height - 1;

    // whether there are tiles surrounding this tile

    const hasLeft  = tx > 0;
    const hasRight = tx < maxX;
    const hasAbove = ty > 0;
    const hasBelow = ty < maxY;

    // cache the surrounding tiles

    const tileLeft       = hasLeft  ? terrain[ ty * width + ( tx - 1 ) ] : NONE;
    const tileRight      = hasRight ? terrain[ ty * width + ( tx + 1 ) ] : NONE;
    const tileAbove      = hasAbove ? terrain[( ty - 1 ) * width + tx ]  : NONE;
    const tileAboveLeft  = hasAbove && hasLeft  ? terrain[( ty - 1 ) * width + ( tx - 1 )] : NONE;
    const tileAboveRight = hasAbove && hasRight ? terrain[( ty - 1 ) * width + ( tx + 1 )] : NONE;
    const tileBelow      = hasBelow ? terrain[( ty + 1 ) * width + tx ]  : NONE;
    const tileBelowLeft  = hasBelow && hasLeft  ? terrain[( ty + 1 ) * width + ( tx - 1 )] : NONE;
    const tileBelowRight = hasBelow && hasRight ? terrain[( ty + 1 ) * width + ( tx + 1 )] : NONE;

    return {
        width, height, maxX, maxY,
        hasLeft, hasRight, hasAbove, hasBelow,
        tileLeft, tileRight, tileAbove, tileAboveLeft, tileAboveRight,
        tileBelow, tileBelowLeft, tileBelowRight,
    };
}

/**
 * get the sprite value for a given tile
 * returns the tile type (determines the sprite sheet)
 * and the the visible area of the tile (see enumeration below)
 *
 * @param {number} tx x-coordinate of the tile
 * @param {number} ty y-coordinate of the tile
 * @param {Object} environment the environment owning the tiles terrain
 * @param {boolean=} blockRecursion optionally block recursion, defaults to false
 *
 * @return {{ type: number, area: number }}
 */
export function getTileDescription( tx, ty, environment, blockRecursion ) {
    const { terrain } = environment;
    const tile  = terrain[ ty * environment.width + tx ];
    const out   = { type : tile, area : FULL_SIZE };

    const {
        tileLeft, tileRight, tileAbove, tileAboveLeft, tileAboveRight,
        tileBelow, tileBelowLeft, tileBelowRight,
    } = getSurroundingTiles( tile, tx, ty, environment );

    // TODO: make a generic tile index for "nothing" (e.g. -1)
    const empty = ct => environment.type === BUILDING_TYPE && ct === BUILDING_TILES.NOTHING;
    const emptyOrUnequal = ( t1, ttc ) => empty( ttc ) || t1 !== ttc;
    const emptyOrNonExisting = ct => ct === NONE || empty( ct ); // non existing implies current tile is at world edge
    const emptyOrUnequalOrNonExisting = ct => ct === NONE || emptyOrNonExisting( ct );

    // special treatment for building walls
    // depending on the surroundings tiles walls change their direction / shape

    if ( environment.type === BUILDING_TYPE && tile === BUILDING_TILES.WALL ) {
        const { GROUND, WALL } = BUILDING_TILES;
        const isGroundType = ct => ct < WALL;
        const emptyOrGroundType = ct => emptyOrNonExisting( ct ) || isGroundType( ct );
        const groundOrWallType = ct => ct === WALL || emptyOrGroundType( ct );

        // default : horizontal line
        out.area = emptyOrNonExisting( tileBelow ) || isGroundType( tileAbove ) ? EMPTY_BOTTOM : [ 0, EMPTY_TOP ];

        // 1. horizontals
        if ( emptyOrNonExisting( tileAbove )) {
            out.area = [ 0, EMPTY_TOP ];
        }
        if ( emptyOrNonExisting( tileBelow )) {
            out.area = EMPTY_BOTTOM;
        }

        // 2. verticals
        if ( emptyOrNonExisting( tileLeft )) {
            out.area = emptyOrNonExisting( tileBelow ) ? TOP_RIGHT : EMPTY_LEFT;
        }
        if ( emptyOrNonExisting( tileRight )) {
            out.area = emptyOrNonExisting( tileBelow ) ? TOP_LEFT : EMPTY_RIGHT;
        }

        // default : vertical line
        if ( isGroundType( tileLeft ) && isGroundType( tileRight )) {
            out.area = EMPTY_RIGHT;
        }

        // 3. corners

        if ( isGroundType( tileLeft ) && ( emptyOrNonExisting( tileBelowRight ) || isGroundType( tileBelowRight ))) {
            if ( emptyOrNonExisting( tileRight ) || emptyOrUnequalOrNonExisting( tileBelowRight )) {
                out.area = [ out.area, EMPTY_RIGHT ]; // |
            } else {
                out.area = [ 0, out.area, EMPTY_RIGHT ]; // ┌
            }
        }

        if ( isGroundType( tileRight ) && emptyOrNonExisting( tileBelowLeft )) {
            out.area = [ out.area, EMPTY_LEFT ]; // ┐
        }

        if ( isGroundType( tileBelow ) && tileBelowLeft === WALL && tileLeft === WALL && !emptyOrNonExisting( tileAbove )) {
            if ( isGroundType( tileRight )) {
                out.area = [ 0, EMPTY_TOP ];
            } else {
                out.area = [ 0, EMPTY_BOTTOM ];
            }
        }

        if ( tileAbove === WALL && tileLeft === WALL && isGroundType( tileRight ) && isGroundType( tileAboveRight )) {
            out.area = [ 0, isGroundType( tileBelow ) && !emptyOrNonExisting( tileAboveLeft ) ? EMPTY_BOTTOM : EMPTY_TOP ]; // ┘
        }

        if ( tileAbove === WALL && tileRight === WALL && isGroundType( tileLeft ) && isGroundType( tileAboveLeft )) {
            out.area = [ 0, isGroundType( tileBelow ) && !emptyOrNonExisting( tileAboveRight ) ? EMPTY_BOTTOM : EMPTY_TOP ]; // └
        }

        // 4. T sections

        if ( isGroundType( tileRight ) && tileAbove === WALL && emptyOrNonExisting( tileBelowLeft ) && tileLeft === WALL ) {
            out.area = [ EMPTY_BOTTOM, EMPTY_LEFT ]; // ┤
        }

        if ( isGroundType( tileLeft ) && tileAbove === WALL && emptyOrNonExisting( tileAboveRight ) && tileRight === WALL && tileBelow === WALL ) {
            out.area = [ 0, EMPTY_TOP, EMPTY_RIGHT ]; // ├
        }

        // ┬
        if ( isGroundType( tileAbove ) && tileBelow === WALL && tileLeft === WALL && tileRight === WALL ) {
            if ( emptyOrNonExisting( tileBelowRight )) {
                out.area = [ EMPTY_BOTTOM, EMPTY_RIGHT ];
            } else if ( emptyOrNonExisting( tileBelowLeft )) {
                out.area = [ EMPTY_BOTTOM, EMPTY_LEFT ];
            }
        }

        // ┴
        if ( isGroundType( tileBelow ) && tileAbove === WALL && tileLeft === WALL && tileRight === WALL ) {
            if ( emptyOrUnequalOrNonExisting( tileAboveLeft )) {
                out.area = [ 0, isGroundType( tileBelowLeft ) ? EMPTY_TOP : EMPTY_BOTTOM ];
            } else if ( emptyOrNonExisting( tileAboveRight )) {
                out.area = [ 0, EMPTY_BOTTOM ];
            }
        }
        if ( tileBelow === WALL && emptyOrNonExisting( tileAboveLeft ) && tileLeft === WALL && isGroundType( tileRight )) {
            out.area = [ 0, EMPTY_BOTTOM, EMPTY_RIGHT ];
        }
        return out;
    }

    // when tile is between horizontally different tiles or at horizontal world ege

    if ( emptyOrUnequal( tile, tileRight )) {
        out.area = out.area === EMPTY_LEFT && !emptyOrNonExisting( tileRight ) ? EMPTY_LEFT : EMPTY_RIGHT;
    }

    if ( emptyOrUnequal( tile, tileLeft )) {
        out.area = emptyOrUnequalOrNonExisting( tileRight ) ? EMPTY_RIGHT : EMPTY_LEFT;
    }

    // when tile is between vertically different tiles or at vertical world edge

    if ( emptyOrUnequal( tile, tileBelow )) {
        out.area = EMPTY_BOTTOM;
    }

    if ( emptyOrUnequal( tile, tileAbove )) {
        out.area = emptyOrUnequalOrNonExisting( tileBelow ) ? EMPTY_BOTTOM : EMPTY_TOP;
    }

    // inner corners

    if ( tileBelow !== tile && tileAbove === tile && tileRight === tile ) {
        out.area = EMPTY_TOP_RIGHT;
    } else if ( tileAbove !== tile && tileBelow === tile && tileLeft === tile ) {
        out.area = EMPTY_BOTTOM_LEFT;
    }

    if ( tileBelow !== tile && tileAbove === tile && tileLeft === tile ) {
        out.area = EMPTY_TOP_LEFT;
    } else if ( tileAbove !== tile && tileBelow === tile && tileRight === tile ) {
        out.area = EMPTY_BOTTOM_RIGHT;
    }
    return out;
}

function drawAdjacentTiles( tile, tx, ty, x, y, env, ctx ) {
    const { terrain }    = env;
    const { type, area } = tile;

    const {
        width, height, maxX, maxY,
        hasLeft, hasRight, hasAbove, hasBelow
    } = getSurroundingTiles( tile, tx, ty, env );

    const tileLeft  = hasLeft  ? getTileDescription( tx - 1, ty,     env ) : NONE;
    const tileRight = hasRight ? getTileDescription( tx + 1, ty,     env ) : NONE;
    const tileAbove = hasAbove ? getTileDescription( tx,     ty - 1, env ) : NONE;
    const tileBelow = hasBelow ? getTileDescription( tx,     ty + 1, env ) : NONE;

    if ( env.type === WORLD_TYPE ) {
        // alters the input tile t depending on its surroundings
        // it should be exchanged for a different tile

        function sanitize( t ) {
            // trees should act as grass when used to connect adjacent tiles
            if ( t.type === WORLD_TILES.TREE ) {
                t.type = WORLD_TILES.GRASS;
            }
            return t;
        }
        // do not render non existing tiles, tiles of the same type and
        // ground type tiles (as these are rendered in drawTileForSurroundings())
        const forbiddenTypes = [ NONE, tile, WORLD_TILES.GROUND ];

        if ( !forbiddenTypes.includes( tileLeft?.type ))
            drawTile( ctx, getSheetCache( env, sanitize( tileLeft )), 120, x, y );

        if ( !forbiddenTypes.includes( tileRight?.type ))
            drawTile( ctx, getSheetCache( env, sanitize( tileRight )), 100, x, y );

        if ( !forbiddenTypes.includes( tileAbove?.type ))
            drawTile( ctx, getSheetCache( env, sanitize( tileAbove )), 160, x, y );

        if ( !forbiddenTypes.includes( tileBelow?.type ))
            drawTile( ctx, getSheetCache( env, sanitize( tileBelow )), 140, x, y );

        return;
    }

    if ( env.type === BUILDING_TYPE ) {
        // queries whether given compareTile is either
        // empty or of a type different to the current tile
        function inequalOrEmpty( compareTile ) {
            if ( !compareTile ) {
                return false;
            }
            return ( compareTile.type !== BUILDING_TILES.NOTHING &&
                     compareTile.type !== type );
        }

        function drawFloor( x, y ) {
            drawTile( ctx, getFloorCache( env ), 0, x, y );
        }

        // vertical and horizontal walls in between ground tiles should always draw a floor background

        if (( tileLeft?.type  === BUILDING_TILES.GROUND && tileRight?.type === BUILDING_TILES.GROUND ) ||
            ( tileAbove?.type === BUILDING_TILES.GROUND && tileBelow?.type === BUILDING_TILES.GROUND )) {
            drawFloor( x, y );
        }

        const areas = Array.isArray( area ) ? area : [ area ];
        areas.forEach( a => {
            if ([ EMPTY_TOP_LEFT_ALT, EMPTY_TOP_RIGHT_ALT ].includes( a )) {
                drawFloor( x, y );
            }
            drawTile( ctx, getSheetCache( env, tile ), getSheetOffset({ area: a }), x, y );
        });
    }
}

/**
 * retrieve the spritesheet for given tileDescription for given environment
 *
 * @param {Object} environment
 * @param {{ type: number, area: number }} tileDescription
 * @return {{ bitmap: Image }}
 */
function getSheetCache( environment, tileDescription )
{
    if ( environment.type === BUILDING_TYPE ) {
        return getFloorCache( environment );   // there is only a single sheet for buildings
    }
    else if ( environment.type === WORLD_TYPE ) {
        switch ( tileDescription.type ) {
            default:
            case WORLD_TILES.GROUND:
                return SpriteCache.GROUND;

            case WORLD_TILES.GRASS:
                return SpriteCache.GRASS;

            case WORLD_TILES.SAND:
                return SpriteCache.SAND;

            case WORLD_TILES.WATER:
                return SpriteCache.WATER;

            case WORLD_TILES.MOUNTAIN:
                return SpriteCache.ROCK;

            case WORLD_TILES.ROAD:
                return SpriteCache.ROAD;

            case WORLD_TILES.TREE:
                return SpriteCache.TREE;
        }
    }
    throw new Error( `could not find sheet for tiletype "${tileDescription.type}" for given environment "${environment.type}"` );
}

function getFloorCache({ floorType }) {
    switch ( floorType ) {
        default:
        case FLOOR_TYPES.BAR:
            return SpriteCache.FLOOR_BAR;
        case FLOOR_TYPES.HOTEL:
            return SpriteCache.FLOOR_HOTEL;
        case FLOOR_TYPES.CAVE:
            return SpriteCache.FLOOR_CAVE;
    }
}

/**
 * get the x-offset in the Spritesheet for a tile of given tileType
 * and a visible area of given tileArea
 *
 * @param {{ type: number, area: number }} tileDescription
 * @return {number} -1 in case tile describes no known sheet offset
 */
function getSheetOffset( tileDescription ) {
    switch ( tileDescription.type ) {
        case WORLD_TILES.GROUND:
        case BUILDING_TILES.GROUND:
            return 0;
            break;

        default:
            switch ( tileDescription.area ) {
                case FULL_SIZE:
                    return 0;

                case BOTTOM_RIGHT:
                    return 20;

                case BOTTOM_LEFT:
                    return 40;

                case TOP_RIGHT:
                    return 60;

                case TOP_LEFT:
                    return 80;

                case EMPTY_LEFT:
                    return 100;

                case EMPTY_RIGHT:
                    return 120;

                case EMPTY_TOP:
                    return 140;

                case EMPTY_BOTTOM:
                    return 160;

                case EMPTY_BOTTOM_RIGHT:
                    return 180;

                case EMPTY_BOTTOM_LEFT:
                    return 200;

                case EMPTY_TOP_RIGHT:
                    return 220;

                case EMPTY_TOP_LEFT:
                    return 240;

                case EMPTY_TOP_RIGHT_ALT:
                    return 280;

                case EMPTY_TOP_LEFT_ALT:
                    return 300;
            }
    }
    return -1;
}

/**
 * query whether given tile of type tileToCompare is equal to
 * given tile of type compareTile or is of a passable type
 *
 * @param {Object} environment
 * @param {number} compareTile
 * @param {number} tileToCompare
 * @return {boolean}
 */
function equalOrPassable( environment, compareTile, tileToCompare ) {
    if ( environment.type === WORLD_TYPE ) {
        return tileToCompare === compareTile || [ WORLD_TILES.GROUND, WORLD_TILES.GRASS, WORLD_TILES.SAND ].includes( tileToCompare );
    }
    else if ( environment.type === BUILDING_TYPE ) {
        return tileToCompare === compareTile || [ BUILDING_TILES.GROUND, BUILDING_TILES.STAIRS ].includes( tileToCompare );
    }
    throw new Error( `could not evaluate unknown Environment "${environment.type}"` );
}

const TILE_SIZE = 20; // size of a single tile (in pixels, tiles are squares)

// the visible area a tile can occupy, the spritesheets
// should store these tiles in this order

export const FULL_SIZE           = 0,
             BOTTOM_RIGHT        = 1,
             BOTTOM_LEFT         = 2,
             TOP_RIGHT           = 3,
             TOP_LEFT            = 4,
             EMPTY_LEFT          = 5,
             EMPTY_RIGHT         = 6,
             EMPTY_TOP           = 7,
             EMPTY_BOTTOM        = 8,
             EMPTY_BOTTOM_RIGHT  = 9,
             EMPTY_BOTTOM_LEFT   = 10,
             EMPTY_TOP_RIGHT     = 11,
             EMPTY_TOP_LEFT      = 12,
             EMPTY_TOP_LEFT_ALT  = 13,
             EMPTY_TOP_RIGHT_ALT = 14;
