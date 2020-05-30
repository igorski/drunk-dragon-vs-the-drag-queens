/**
 * Created by igorzinken on 07-04-15.
 */
var Cave        = require( "../model/vo/Cave" );
var World       = require( "../model/vo/World" );
var SpriteCache = require( "./SpriteCache" );

var TerrainRenderer = module.exports =
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
     * @param {Environment} env the environment we're rendering
     * @param {Array.<number>} terrain the terrain we're drawing from
     */
    drawTileForSurroundings : function( ctx, tx, ty, x, y, env, terrain )
    {
        var tile     = getTileDescription( tx, ty, terrain, env );
        var tileType = tile.type;

        // TODO : can we make this more generic ?

        if ( env instanceof World )
        {
            switch ( tileType )
            {
                default:
                case World.Tiles.GRASS:
                    drawTile( ctx, getSheet( env, tile ), 0, x, y ); // grass is the default World underground
                    break;

                case World.Tiles.SAND:
                case World.Tiles.WATER:
                case World.Tiles.MOUNTAIN:
                    drawTile( ctx, getSheet( env, tile ), 0, x, y ); // draw tile underground first
                    drawAdjacentTiles( tile, tx, ty, x, y, env, terrain, ctx );
                    break;

                case World.Tiles.TREE: // tree
                    drawTile( ctx, SpriteCache.GRASS, 0, x, y ); // grassy underground first
                    drawTile( ctx, SpriteCache.TREE,  0, x, y ); // tree second
                    break;
            }
        }
        else if ( env instanceof Cave )
        {
            switch ( tileType )
            {
                case Cave.Tiles.GROUND:
                    return drawTile( ctx, SpriteCache.CAVE, 0, x, y );

                case Cave.Tiles.WALL: // wall
                    drawAdjacentTiles( tile, tx, ty, x, y, env, terrain, ctx  );
                    break;

                case Cave.Tiles.TUNNEL: // tunnel
                    return drawTile( ctx, SpriteCache.CAVE, 260, x, y );

                default:
                case Cave.Tiles.NOTHING: // nothing
                    return;
            }
        }
        else {
            throw new Error( "unknown Environment '" + env + "'" );
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
    if ( tileSourceX < 0 )
        return;

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
 * @param {Array.<number>} terrain the terrain the tile resides in
 * @param {Environment} env the environment the terrain belongs to
 * @param {boolean=} blockRecursion optionally block recursion, defaults to false
 *
 * @return {{ type: number, area: number }}
 */
function getTileDescription( tx, ty, terrain, env, blockRecursion )
{
    var width = env.width, maxX = width - 1, maxY = env.height - 1;
    var tile  = terrain[ ty * width + tx ];
    var out   = { type : tile, area : FULL_SIZE };

    var tileLeft       = tx > 0 ?    terrain[ ty * width + ( tx - 1 ) ] : 0;
    var tileRight      = tx < maxX ? terrain[ ty * width + ( tx + 1 ) ] : 0;
    var tileAbove      = ty > 0 ?    terrain[( ty - 1 ) * width + tx ]  : 0;
    var tileBelow      = ty < maxY ? terrain[( ty + 1 ) * width + tx ]  : 0;
    var tileAboveLeft  = tx > 0 && ty > 0    ? terrain[( ty - 1 ) * width + ( tx - 1 )] : 0;
    var tileAboveRight = tx < maxX && ty > 0 ? terrain[( ty - 1 ) * width + ( tx + 1 )] : 0;

    // inner corner types first

    if ( tileLeft === tile && tileAbove === tile &&
         equalOrPassable( env, tile, tileRight ) && tileAboveRight !== tile )
    {
        if ( getTileDescription( tx - 1, ty, terrain, env, true ).area === TOP_LEFT )
            out.area = EMPTY_LEFT;
        else if ( tileBelow !== tile )
            out.area = EMPTY_TOP_LEFT;
        else
            out.area = EMPTY_LEFT;

        return out;
    }

    if ( equalOrPassable( env, tile, tileLeft ) && tileAbove === tile &&
         tileRight === tile && tileAboveLeft !== tile )
    {
        if ( tileBelow === Cave.Tiles.NOTHING )
            out.area = TOP_LEFT;
        else if ( tileBelow === tile )
            out.area = EMPTY_RIGHT;
        else
            out.area = EMPTY_TOP_RIGHT;

        return out;
    }

    if ( tileLeft === tile && equalOrPassable( env, tile, tileAbove ) && tileRight === Cave.Tiles.GROUND )
    {
        if ( getTileDescription( tx - 1, ty, terrain, env, true ).area === EMPTY_RIGHT )
            out.area = EMPTY_LEFT;
        else if ( tileBelow === tile )
            out.area = EMPTY_BOTTOM_LEFT;
        else
            out.area = EMPTY_TOP_LEFT;

        return out;
    }

    if ( tileRight === tile && equalOrPassable( env, tile, tileBelow ) && tileAbove === tile ) {
        out.area = EMPTY_TOP_RIGHT;
        return out;
    }

    if ( tileRight === tile && tileBelow === tile && tileLeft === Cave.Tiles.GROUND &&
        equalOrPassable( env, tile, tileAbove ))
    {
        out.area = EMPTY_BOTTOM_RIGHT;
        return out;
    }

    // outer edges second

    if ( tileLeft === Cave.Tiles.NOTHING && tileRight === tile && tileBelow === tile )
    {
        out.area = BOTTOM_RIGHT;
        return out;
    }

    if ( tileRight === Cave.Tiles.NOTHING && tileLeft === tile && tileBelow === tile )
    {
        out.area = BOTTOM_LEFT;
        return out;
    }

    if ( tileLeft === Cave.Tiles.NOTHING && tileRight === tile && tileAbove === tile )
    {
        out.area = TOP_RIGHT;
        return out;
    }

    if ( tileRight === Cave.Tiles.NOTHING && tileLeft === tile && tileAbove === tile )
    {
        out.area = TOP_LEFT;
        return out;
    }

    // vertical types

    if ( tileLeft !== tile && tileBelow === tile && equalOrPassable( env, tile, tileRight ))
    {
        out.area = EMPTY_LEFT;
        return out;
    }

    if ( tileRight !== tile && tileBelow === tile && equalOrPassable( env, tile, tileLeft ))
    {
        out.area = EMPTY_RIGHT;
        return out;
    }

    // horizontal types

    if ( tileLeft === tile && tileRight === tile )
    {
        if ( tileAbove === Cave.Tiles.NOTHING || tileAbove === tile )
        {
            if ( getTileDescription( tx - 1, ty, terrain, env, true ).area === EMPTY_RIGHT )
            {
                if ( !blockRecursion && getTileDescription( tx + 2, ty, terrain, env, true ).area === FULL_SIZE )
                    out.area = BOTTOM_RIGHT;
                else
                    out.area = EMPTY_LEFT;
            }
            else
                out.area = EMPTY_TOP;
        }
        else if ( equalOrPassable( env, tile, tileAbove ))
            out.area = EMPTY_BOTTOM;

        return out;
    }
    return out;
}

function drawAdjacentTiles( tile, tx, ty, x, y, env, terrain, ctx )
{
    var width    = env.width, maxX = width - 1, maxY = env.height - 1;
    var tileType = tile.type, tileArea = tile.area;

    // get the surrounding tiles

    var tileLeft       = tx > 0 ?                 getTileDescription( tx - 1, ty,     terrain, env ) : 0;
    var tileRight      = tx < maxX ?              getTileDescription( tx + 1, ty,     terrain, env ) : 0;
    var tileAbove      = ty > 0 ?                 getTileDescription( tx,     ty - 1, terrain, env ) : 0;
    var tileBelow      = ty < maxY ?              getTileDescription( tx,     ty + 1, terrain, env ) : 0;
    var tileBelowLeft  = tx > 0    && ty < maxY ? getTileDescription( tx - 1, ty + 1, terrain, env ) : 0;
    var tileBelowRight = tx < maxX && ty < maxY ? getTileDescription( tx + 1, ty + 1, terrain, env ) : 0;

    if ( env instanceof World )
    {
        // alters the input tile t depending on its surroundings
        // it should be exchanged for a different tile

        function sanitize( t )
        {
            // trees should act as grass when used to connect adjacent tiles

            if ( t.type === World.Tiles.TREE )
                t.type = World.Tiles.GRASS;

            return t;
        }

        if ( tileLeft && tileLeft.type !== tileType )
            drawTile( ctx, getSheet( env, sanitize( tileLeft )), 120, x, y );

        if ( tileRight && tileRight.type !== tileType )
            drawTile( ctx, getSheet( env, sanitize( tileRight )), 100, x, y );

        if ( tileAbove && tileAbove.type !== tileType )
            drawTile( ctx, getSheet( env, sanitize( tileAbove )), 160, x, y );

        if ( tileBelow && tileBelow.type !== tileType )
            drawTile( ctx, getSheet( env, sanitize( tileBelow )), 140, x, y );

        return;
    }

    if ( env instanceof Cave )
    {
        // queries whether given compareTile is either
        // empty or of a type different to the current tile

        function inequalOrEmpty( compareTile )
        {
            if ( !compareTile )
                return true;

            return ( compareTile.type !== Cave.Tiles.NOTHING &&
                     compareTile.type !== tileType );
        }

        // inner corner types

        if ( tileArea === EMPTY_BOTTOM_LEFT && inequalOrEmpty( tileBelowLeft )) {
            drawTile( ctx, getSheet( env, tileBelowLeft ), getSheetOffset( tileBelowLeft ), x, y );
        }
        else if ( tileArea === EMPTY_BOTTOM_RIGHT && inequalOrEmpty( tileBelowRight )) {
            drawTile( ctx, getSheet( env, tileBelowRight ), getSheetOffset( tileBelowRight ), x, y );
        }

        // outer edges

        // vertical types

        if ( tileArea === EMPTY_LEFT )
        {
            if ( tileRight === Cave.Tiles.WALL && tileLeft.type !== tileType )
                drawTile( ctx, getSheet( env, tileLeft ), getSheetOffset( tileLeft ), x, y );

            else if ( inequalOrEmpty( tileLeft ))
                drawTile( ctx, getSheet( env, tileLeft ), getSheetOffset( tileLeft ), x, y );
        }
        else if ( tileArea === EMPTY_RIGHT && inequalOrEmpty( tileRight )) {
            drawTile( ctx, getSheet( env, tileRight ), getSheetOffset( tileRight ), x, y );
        }

        // horizontal types

        if ( tileArea === EMPTY_BOTTOM && inequalOrEmpty( tileBelow )) {
            drawTile( ctx, getSheet( env, tileBelow ), getSheetOffset( tileBelow ), x, y );
        }
        else if ( tileArea === EMPTY_TOP && inequalOrEmpty( tileAbove )) {
            drawTile( ctx, getSheet( env, tileAbove ), getSheetOffset( tileAbove ), x, y );
        }

        // draw tile
        drawTile( ctx, getSheet( env, tile ), getSheetOffset( tile ), x, y );
    }
}

/**
 * retrieve the spritesheet for given tileDescription for given environment
 *
 * @param {Environment} env
 * @param {{ type: number, area: number }} tileDescription
 * @return {Image}
 */
function getSheet( env, tileDescription )
{
    if ( env instanceof Cave )
    {
        return SpriteCache.CAVE;   // single sheet for a full cave
    }
    else if ( env instanceof World )
    {
        switch ( tileDescription.type )
        {
            default:
            case World.Tiles.GRASS:
                return SpriteCache.GRASS;

            case World.Tiles.SAND:
                return SpriteCache.SAND;

            case World.Tiles.WATER:
                return SpriteCache.WATER;

            case World.Tiles.MOUNTAIN:
                return SpriteCache.ROCK;

            case World.Tiles.TREE:
                return SpriteCache.TREE;
        }
    }
    throw new Error( "could not find sheet for tiletype '" + tileDescription.type + "' for given environment '" + env + "'" );
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
        case World.Tiles.GROUND:
        case Cave.Tiles.GROUND:
            return 0;
            break;

        default:
        //case Cave.Tiles.WALL:   // wall

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
 * @param {Environment} env
 * @param {number} compareTile
 * @param {number} tileToCompare
 * @return {boolean}
 */
function equalOrPassable( env, compareTile, tileToCompare )
{
    if ( env instanceof World )
    {
        return tileToCompare === compareTile || tileToCompare === World.Tiles.GRASS || tileToCompare === World.Tiles.SAND;
    }
    else if ( env instanceof Cave ) {
        return tileToCompare === compareTile || tileToCompare === Cave.Tiles.GROUND || tileToCompare === Cave.Tiles.TUNNEL;
    }
    throw new Error( "could not evaluate unknown Environment '" + env + "'" );
}

var TILE_SIZE = 20; // size of a single tile (in pixels, tiles are squares)

// the visible area a tile can occupy, the spritesheets
// should store these tiles in this order

var FULL_SIZE          = 0,
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
