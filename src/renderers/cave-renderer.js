/**
 * Created by igorzinken on 01-03-15.
 */
export default CaveRenderer;

import WorldRenderer from './world-renderer';
import TerrainUtil   from '@/utils/terrain-util';
import WorldCache    from '@/utils/world-cache';
import SpriteCache   from '@/utils/sprite-cache';

/**
 * @constructor
 * @extends {WorldRenderer}
 *
 * @param {number} aWidth
 * @param {number} aHeight
 */
function CaveRenderer( aWidth, aHeight ) {
    CaveRenderer.super( this, aWidth, aHeight );
}

WorldRenderer.extend( CaveRenderer );

/* class properties */

/** @protected @type {Cave} */  CaveRenderer.prototype._cave;

/* public methods */

/**
 * @param {Cave} aCave
 * @param {Player} aPlayer
 */
CaveRenderer.prototype.render = function( aCave, aPlayer ) {
    this._cave   = aCave;
    this._player = aPlayer;
};

/**
 * @override
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 */
CaveRenderer.prototype.draw = function( aCanvasContext )
{
    // update player movement
    this._player.update();

    var vx = this._player.x;
    var vy = this._player.y;

    var cave      = this._cave;
    var level     = cave.levels[ cave.level ];
    var caveWidth = level.width, caveHeight = level.height;

    var tileWidth  = WorldCache.tileWidth;
    var tileHeight = WorldCache.tileHeight;

    // the amount of tiles on either side of the player
    var widthTiles      = this.maxTilesInWidth;
    var heightTiles     = this.maxTilesInHeight;
    var halfWidthTiles  = Math.floor( widthTiles  / 2 );
    var halfHeightTiles = Math.floor( heightTiles / 2 );

    // the rectangle to draw, all relative in world coordinates (tiles)

    var left   = cave.x - halfWidthTiles;
    var right  = cave.x + halfWidthTiles;
    var top    = cave.y - halfHeightTiles;
    var bottom = cave.y + halfHeightTiles;

    // flood fill the cave with black
    aCanvasContext.fillStyle = '#000000';
    aCanvasContext.fillRect( 0, 0, caveWidth, caveHeight );

    // render terrain from cache

    var sourceX     = ( left * tileWidth ) + vx, sourceY = ( top * tileHeight ) + vy;
    var canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

    // contrary to the overground, the player is always bang in the middle

    aCanvasContext.drawImage( SpriteCache.CAVE_LEVEL,
                              sourceX, sourceY, canvasWidth, canvasHeight,
                              0, 0, canvasWidth, canvasHeight );

    var i, l, x, y;

    /* OLD : live rendering
    // rows first

    for ( i = rt; i < rb; ++i )    // rows
    {
        for ( j = rl; j < rr; ++j ) // columns
        {
            x = ( j - left ) * tileWidth;
            y = ( i - top )  * tileHeight;

            x -= vx;
            y -= vy;

            TerrainUtil.drawTileForSurroundings( aCanvasContext, tileWidth, j, i, x, y, cave, terrain );
        }
    }
    */

    // draw player

    x = ( cave.x - left ) * tileWidth;
    y = ( cave.y - top  ) * tileHeight;

    aCanvasContext.fillStyle = 'blue';
    aCanvasContext.fillRect( x, y, tileWidth, tileHeight );

    // draw enemies
    var enemy;

    for ( i = 0, l = cave.enemies.length; i < l; ++i )
    {
        enemy = cave.enemies[ i ];

        if ( enemy.x >= left && enemy.x <= right &&
             enemy.y >= top  && enemy.y <= bottom )
        {
            x = ( enemy.x - left ) * tileWidth;
            y = ( enemy.y - top )  * tileHeight;

            x -= 5; y-= 5;  // enemy sprite is 30x30, world is 20x20...

            aCanvasContext.drawImage( SpriteCache.DRONE, x  - vx, y - vy, 30, 30 );
        }
    }

    // QQQ : map overlay
    if ( !TEMP_MAP ) {
        TEMP_MAP = new Image();
        TEMP_MAP.style.position = 'absolute';
        TEMP_MAP.style.bottom = '1em';
        TEMP_MAP.style.right = '1em';
        document.body.appendChild( TEMP_MAP );
    }
    if ( !_pendingInterval ) {
        setTimeout( function()
        {
            TEMP_MAP.src = mapRenderer.render(cave, 1.25).src;
            _pendingInterval = false;
        }, 1500 );
        _pendingInterval = true;
    }
    // E.O. QQQ
};

// TODO QQQ : remove
import mapRenderer from '@/renderers/cave-map-renderer';
var _pendingInterval = false;
var TEMP_MAP;
// E.O. QQQ
