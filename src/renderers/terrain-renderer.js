import SpriteCache from '@/utils/sprite-cache';
import { BUILDING_TYPE, BUILDING_TILES } from '@/model/factories/building-factory';
import { WORLD_TYPE, WORLD_TILES } from '@/model/factories/world-factory';

export default
{
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
     * @param {Array<Number>} terrain the terrain we're drawing from
     */
    drawTileForSurroundings( ctx, tx, ty, x, y, environment, terrain )
    {
        const tile     = getTileDescription( tx, ty, terrain, environment );
        const tileType = tile.type;

        // TODO : can we make this more generic ?

        if ( environment.type === WORLD_TYPE ) {
            switch ( tileType ) {
                default:
                case WORLD_TILES.GROUND:
                case WORLD_TILES.GRASS:
                    drawTile( ctx, getSheet( environment, tile ), 0, x, y ); // the lowest tiles in World underground
                    // ctx.font = "6px Verdana";
                    //ctx.fillText( `${ty}`, x, y);
                    break;

                case WORLD_TILES.SAND:
                case WORLD_TILES.WATER:
                case WORLD_TILES.MOUNTAIN:
                    drawTile( ctx, getSheet( environment, tile ), 0, x, y ); // draw tile underground first
                    drawAdjacentTiles( tile, tx, ty, x, y, environment, terrain, ctx );
                    break;

                case WORLD_TILES.TREE:
                    drawTile( ctx, SpriteCache.GRASS, 0, x, y ); // grassy underground first
                    drawTile( ctx, SpriteCache.TREE,  0, x, y ); // tree second
                    break;
            }
        }
        else if ( environment.type === BUILDING_TYPE ) {
            switch ( tileType ) {
                case BUILDING_TILES.GROUND:
                    return drawTile( ctx, SpriteCache.FLOOR, 0, x, y );

                case BUILDING_TILES.WALL:
                    drawAdjacentTiles( tile, tx, ty, x, y, environment, terrain, ctx  );
                    break;

                case BUILDING_TILES.STAIRS:
                    return drawTile( ctx, SpriteCache.FLOOR, 260, x, y );

                default:
                case BUILDING_TILES.NOTHING:
                    return;
            }
        }
        else {
            throw new Error( `unknown Environment "${environment.type}"` );
        }
    }
};

/* internal methods */

/**
 * actual rendering of a single tile onto the canvas
 *
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 * @param {Image} aBitmap source spritesheet
 * @param {number} tileSourceX source x-coordinate of the tile (relative
 *                 to its spritesheet aBitmap)
 * @param {number} targetX target x-coordinate of the tile inside the given context
 * @param {number} targetY target y-coordinate of the tile inside the given context
 */
function drawTile( aCanvasContext, aBitmap, tileSourceX, targetX, targetY )
{
    if ( tileSourceX < 0 ) {
        return;
    }
    aCanvasContext.drawImage( aBitmap,
                              tileSourceX, 0,   TILE_SIZE, TILE_SIZE,
                              targetX, targetY, TILE_SIZE, TILE_SIZE );
}

/**
 * get the sprite value for a given tile
 * returns the tile type (determines the sprite sheet)
 * and the the visible area of the tile (see enumeration below)
 *
 * @param {number} tx x-coordinate of the tile
 * @param {number} ty y-coordinate of the tile
 * @param {Array<Number>} terrain the terrain the tile resides in
 * @param {Object} environment the environment the terrain belongs to
 * @param {boolean=} blockRecursion optionally block recursion, defaults to false
 *
 * @return {{ type: number, area: number }}
 */
function getTileDescription( tx, ty, terrain, environment, blockRecursion )
{
    const width = environment.width, maxX = width - 1, maxY = environment.height - 1;
    const tile  = terrain[ ty * width + tx ];
    const out   = { type : tile, area : FULL_SIZE };

    const tileLeft       = tx > 0 ?    terrain[ ty * width + ( tx - 1 ) ] : 0;
    const tileRight      = tx < maxX ? terrain[ ty * width + ( tx + 1 ) ] : 0;
    const tileAbove      = ty > 0 ?    terrain[( ty - 1 ) * width + tx ]  : 0;
    const tileBelow      = ty < maxY ? terrain[( ty + 1 ) * width + tx ]  : 0;
    const tileAboveLeft  = tx > 0 && ty > 0    ? terrain[( ty - 1 ) * width + ( tx - 1 )] : 0;
    const tileAboveRight = tx < maxX && ty > 0 ? terrain[( ty - 1 ) * width + ( tx + 1 )] : 0;

    // inner corner types first

    if ( tileLeft === tile && tileAbove === tile &&
         equalOrPassable( environment, tile, tileRight ) && tileAboveRight !== tile )
    {
        if ( getTileDescription( tx - 1, ty, terrain, environment, true ).area === TOP_LEFT )
            out.area = EMPTY_LEFT;
        else if ( tileBelow !== tile )
            out.area = EMPTY_TOP_LEFT;
        else
            out.area = EMPTY_LEFT;

        return out;
    }

    if ( equalOrPassable( environment, tile, tileLeft ) && tileAbove === tile &&
         tileRight === tile && tileAboveLeft !== tile )
    {
        if ( tileBelow === BUILDING_TILES.NOTHING )
            out.area = TOP_LEFT;
        else if ( tileBelow === tile )
            out.area = EMPTY_RIGHT;
        else
            out.area = EMPTY_TOP_RIGHT;

        return out;
    }

    if ( tileLeft === tile && equalOrPassable( environment, tile, tileAbove ) && tileRight === BUILDING_TILES.GROUND )
    {
        if ( getTileDescription( tx - 1, ty, terrain, environment, true ).area === EMPTY_RIGHT )
            out.area = EMPTY_LEFT;
        else if ( tileBelow === tile )
            out.area = EMPTY_BOTTOM_LEFT;
        else
            out.area = EMPTY_TOP_LEFT;

        return out;
    }

    if ( tileRight === tile && equalOrPassable( environment, tile, tileBelow ) && tileAbove === tile ) {
        out.area = EMPTY_TOP_RIGHT;
        return out;
    }

    if ( tileRight === tile && tileBelow === tile && tileLeft === BUILDING_TILES.GROUND &&
        equalOrPassable( environment, tile, tileAbove ))
    {
        out.area = EMPTY_BOTTOM_RIGHT;
        return out;
    }

    // outer edges second

    if ( tileLeft === BUILDING_TILES.NOTHING && tileRight === tile && tileBelow === tile )
    {
        out.area = BOTTOM_RIGHT;
        return out;
    }

    if ( tileRight === BUILDING_TILES.NOTHING && tileLeft === tile && tileBelow === tile )
    {
        out.area = BOTTOM_LEFT;
        return out;
    }

    if ( tileLeft === BUILDING_TILES.NOTHING && tileRight === tile && tileAbove === tile )
    {
        out.area = TOP_RIGHT;
        return out;
    }

    if ( tileRight === BUILDING_TILES.NOTHING && tileLeft === tile && tileAbove === tile )
    {
        out.area = TOP_LEFT;
        return out;
    }

    // vertical types

    if ( tileLeft !== tile && tileBelow === tile && equalOrPassable( environment, tile, tileRight ))
    {
        out.area = EMPTY_LEFT;
        return out;
    }

    if ( tileRight !== tile && tileBelow === tile && equalOrPassable( environment, tile, tileLeft ))
    {
        out.area = EMPTY_RIGHT;
        return out;
    }

    // horizontal types

    if ( tileLeft === tile && tileRight === tile )
    {
        if ( tileAbove === BUILDING_TILES.NOTHING || tileAbove === tile )
        {
            if ( getTileDescription( tx - 1, ty, terrain, environment, true ).area === EMPTY_RIGHT )
            {
                if ( !blockRecursion && getTileDescription( tx + 2, ty, terrain, environment, true ).area === FULL_SIZE )
                    out.area = BOTTOM_RIGHT;
                else
                    out.area = EMPTY_LEFT;
            }
            else
                out.area = EMPTY_TOP;
        }
        else if ( equalOrPassable( environment, tile, tileAbove ))
            out.area = EMPTY_BOTTOM;

        return out;
    }
    return out;
}

function drawAdjacentTiles( tile, tx, ty, x, y, env, terrain, ctx )
{
    const width = env.width, maxX = width - 1, maxY = env.height - 1;
    const { type, area } = tile;

    // get the surrounding tiles

    const tileLeft       = tx > 0 ?                 getTileDescription( tx - 1, ty,     terrain, env ) : 0;
    const tileRight      = tx < maxX ?              getTileDescription( tx + 1, ty,     terrain, env ) : 0;
    const tileAbove      = ty > 0 ?                 getTileDescription( tx,     ty - 1, terrain, env ) : 0;
    const tileBelow      = ty < maxY ?              getTileDescription( tx,     ty + 1, terrain, env ) : 0;
    const tileBelowLeft  = tx > 0    && ty < maxY ? getTileDescription( tx - 1, ty + 1, terrain, env ) : 0;
    const tileBelowRight = tx < maxX && ty < maxY ? getTileDescription( tx + 1, ty + 1, terrain, env ) : 0;

    if ( env.type === WORLD_TYPE )
    {
        // alters the input tile t depending on its surroundings
        // it should be exchanged for a different tile

        function sanitize( t )
        {
            // trees should act as grass when used to connect adjacent tiles

            if ( t.type === WORLD_TILES.TREE )
                t.type = WORLD_TILES.GRASS;

            return t;
        }

        if ( tileLeft && tileLeft.type !== type )
            drawTile( ctx, getSheet( env, sanitize( tileLeft )), 120, x, y );

        if ( tileRight && tileRight.type !== type )
            drawTile( ctx, getSheet( env, sanitize( tileRight )), 100, x, y );

        if ( tileAbove && tileAbove.type !== type )
            drawTile( ctx, getSheet( env, sanitize( tileAbove )), 160, x, y );

        if ( tileBelow && tileBelow.type !== type )
            drawTile( ctx, getSheet( env, sanitize( tileBelow )), 140, x, y );

        return;
    }

    if ( env.type === BUILDING_TYPE )
    {
        // queries whether given compareTile is either
        // empty or of a type different to the current tile

        function inequalOrEmpty( compareTile )
        {
            if ( !compareTile )
                return true;

            return ( compareTile.type !== BUILDING_TILES.NOTHING &&
                     compareTile.type !== type );
        }

        // inner corner types

        if ( area === EMPTY_BOTTOM_LEFT && inequalOrEmpty( tileBelowLeft )) {
            drawTile( ctx, getSheet( env, tileBelowLeft ), getSheetOffset( tileBelowLeft ), x, y );
        }
        else if ( area === EMPTY_BOTTOM_RIGHT && inequalOrEmpty( tileBelowRight )) {
            drawTile( ctx, getSheet( env, tileBelowRight ), getSheetOffset( tileBelowRight ), x, y );
        }

        // outer edges

        // vertical types

        if ( area === EMPTY_LEFT )
        {
            if ( tileRight === BUILDING_TILES.WALL && tileLeft.type !== type )
                drawTile( ctx, getSheet( env, tileLeft ), getSheetOffset( tileLeft ), x, y );

            else if ( inequalOrEmpty( tileLeft ))
                drawTile( ctx, getSheet( env, tileLeft ), getSheetOffset( tileLeft ), x, y );
        }
        else if ( area === EMPTY_RIGHT && inequalOrEmpty( tileRight )) {
            drawTile( ctx, getSheet( env, tileRight ), getSheetOffset( tileRight ), x, y );
        }

        // horizontal types

        if ( area === EMPTY_BOTTOM && inequalOrEmpty( tileBelow )) {
            drawTile( ctx, getSheet( env, tileBelow ), getSheetOffset( tileBelow ), x, y );
        }
        else if ( area === EMPTY_TOP && inequalOrEmpty( tileAbove )) {
            drawTile( ctx, getSheet( env, tileAbove ), getSheetOffset( tileAbove ), x, y );
        }

        // draw tile
        drawTile( ctx, getSheet( env, tile ), getSheetOffset( tile ), x, y );
    }
}

/**
 * retrieve the spritesheet for given tileDescription for given environment
 *
 * @param {Object} environment
 * @param {{ type: number, area: number }} tileDescription
 * @return {Image}
 */
function getSheet( environment, tileDescription )
{
    if ( environment.type === BUILDING_TYPE ) {
        return SpriteCache.FLOOR;   // single sheet for a full floor
    }
    else if ( environment.type === WORLD_TYPE )
    {
        switch ( tileDescription.type )
        {
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

            case WORLD_TILES.TREE:
                return SpriteCache.TREE;
        }
    }
    throw new Error( `could not find sheet for tiletype "${tileDescription.type}" for given environment "${environment.type}"` );
}

/**
 * get the x-offset in the Spritesheet for a tile of given tileType
 * and a visible area of given tileArea
 *
 * @param {{ type: number, area: number }} tileDescription
 * @return {number} -1 in case tile describes no known sheet offset
 */
function getSheetOffset( tileDescription )
{
    switch ( tileDescription.type )
    {
        case WORLD_TILES.GROUND:
        case BUILDING_TILES.GROUND:
            return 0;
            break;

        default:
        //case BUILDING_TILES.WALL:   // wall

            switch ( tileDescription.area )
            {
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

const FULL_SIZE          = 0,
      BOTTOM_RIGHT       = 1,
      BOTTOM_LEFT        = 2,
      TOP_RIGHT          = 3,
      TOP_LEFT           = 4,
      EMPTY_LEFT         = 5,
      EMPTY_RIGHT        = 6,
      EMPTY_TOP          = 7,
      EMPTY_BOTTOM       = 8,
      EMPTY_BOTTOM_RIGHT = 9,
      EMPTY_BOTTOM_LEFT  = 10,
      EMPTY_TOP_RIGHT    = 11,
      EMPTY_TOP_LEFT     = 12;
