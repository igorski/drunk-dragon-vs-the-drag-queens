/**
 * Created by igorzinken on 01-03-15.
 */
export default WorldRenderer;

import zCanvas     from 'zcanvas';
import SpriteCache from '@/utils/sprite-cache';
import WorldCache  from '@/utils/world-cache';

/**
 * @constructor
 * @extends {zSprite}
 *
 * @param {number} aWidth
 * @param {number} aHeight
 */
function WorldRenderer( aWidth, aHeight ) {
    this.super( this, 'constructor', 0, 0, aWidth, aHeight );
}

zCanvas.sprite.extend( WorldRenderer );

/* class properties */

/** @protected @type {number} */ WorldRenderer.prototype.maxTilesInWidth  = 10;
/** @protected @type {number} */ WorldRenderer.prototype.maxTilesInHeight = 10;

/** @protected @type {World} */  WorldRenderer.prototype._world;
/** @protected @type {Player} */ WorldRenderer.prototype._player;

/* public methods */

/**
 * @public
 *
 * @param {World} aWorld
 * @param {Player} aPlayer
 */
WorldRenderer.prototype.render = function( aWorld, aPlayer ) {
    this._world  = aWorld;
    this._player = aPlayer;
};

/**
 * @override
 * @public
 *
 * @param {Image|string=} aImage image, can be either HTMLImageElement or base64 encoded string
 * image is optional as we might be interested in just scaling the
 *                        current image using aNewWidth and aNewHeight
 * @param {number=} aNewWidth optional new width of the image
 * @param {number=} aNewHeight optional new height of the image
 */
WorldRenderer.prototype.updateImage = function( aImage, aNewWidth, aNewHeight ) {
    this.super( this, 'updateImage', aImage, aNewWidth, aNewHeight );

    const isPortrait = aNewHeight > aNewWidth;

    if ( !isPortrait ) {
        this.maxTilesInWidth  = aNewWidth < 500 ? 7 : 15;

        WorldCache.tileWidth  = this._bounds.width  / this.maxTilesInWidth;
        WorldCache.tileHeight = WorldCache.tileWidth; // tiles are squares
        this.maxTilesInHeight = ( aNewHeight / WorldCache.tileHeight ) + 1;

        // odd numbers please...
        if ( this.maxTilesInHeight % 2 === 0 )
            ++this.maxTilesInHeight;
    }
    else
    {
        this.maxTilesInHeight = aNewHeight < 500 ? 7 : 15;

        WorldCache.tileHeight = this._bounds.height / this.maxTilesInHeight;
        WorldCache.tileWidth  = WorldCache.tileHeight;   // tiles are squares
        this.maxTilesInWidth  = ( aNewWidth / WorldCache.tileWidth ) + 1;

        // odd numbers please...
        if ( this.maxTilesInWidth % 2 === 0 )
            ++this.maxTilesInWidth;
    }
};

/**
 * @public
 *
 * @param {number} aWidth
 * @param {number} aHeight
 */
WorldRenderer.prototype.setTileDimensions = function( aWidth, aHeight )
{
    this.maxTilesInWidth  = aWidth  / WorldCache.tileWidth;
    this.maxTilesInHeight = aHeight / WorldCache.tileHeight;
};

/**
 * @override
 * @public
 *
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 */
WorldRenderer.prototype.draw = function( aCanvasContext )
{
    // update player movement
    this._player.update();

    var vx = this._player.x;
    var vy = this._player.y;

    var world      = this._world;
    var worldWidth = world.width, worldHeight = world.height;

    var tileWidth  = WorldCache.tileWidth;
    var tileHeight = WorldCache.tileHeight;

    // the amount of tiles on either side of the player
    var widthTiles      = this.maxTilesInWidth;
    var heightTiles     = this.maxTilesInHeight;
    var halfWidthTiles  = Math.floor( widthTiles  / 2 );
    var halfHeightTiles = Math.floor( heightTiles / 2 );

    // the rectangle to draw, all relative in world coordinates (tiles)

    var left   = world.x - halfWidthTiles;
    var right  = world.x + halfWidthTiles;
    var top    = world.y - halfHeightTiles;
    var bottom = world.y + halfHeightTiles;

    // render terrain from cache

    var sourceX     = ( left * tileWidth ) + vx, sourceY = ( top * tileHeight ) + vy;
    var canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

    // if player is at world edge, stop scrolling terrain

    if ( world.x <= halfWidthTiles )
        sourceX = 0;
    else if ( left > worldWidth - widthTiles - 1 )
        sourceX = ( worldWidth - widthTiles ) * tileWidth;

    if ( world.y <= halfHeightTiles )
        sourceY = 0;
    else if ( top > worldHeight - heightTiles - 1 )
        sourceY = ( worldHeight - heightTiles ) * tileHeight;

    aCanvasContext.drawImage( SpriteCache.WORLD,
                              sourceX, sourceY, canvasWidth, canvasHeight,
                              0, 0, canvasWidth, canvasHeight );

    var i, l, x, y;

    // draw caves
    var cave;

    for ( i = 0, l = world.caves.length; i < l; ++i )
    {
        cave = world.caves[ i ];

        if ( cave.x >= left && cave.x <= right &&
             cave.y >= top  && cave.y <= bottom )
        {
            x = ( cave.x - left ) * tileWidth;
            y = ( cave.y - top )  * tileHeight;

            aCanvasContext.fillStyle = 'rgba(255,0,255,1)';
            aCanvasContext.fillRect( x - vx, y - vy, tileWidth, tileHeight );
        }
    }

    // draw shops
    var shop;

    for ( i = 0, l = world.shops.length; i < l; ++i )
    {
        shop = world.shops[ i ];

        if ( shop.x >= left && shop.x <= right &&
             shop.y >= top  && shop.y <= bottom )
        {
            x = ( shop.x - left ) * tileWidth;
            y = ( shop.y - top )  * tileHeight;

            aCanvasContext.fillStyle = 'white';
            aCanvasContext.fillRect( x - vx, y - vy, tileWidth, tileHeight );
        }
    }

    // draw player

    x = ( world.x - left ) * tileWidth;
    y = ( world.y - top  ) * tileHeight;

    // if player is at world edge draw player out of center

    if ( world.x <= halfWidthTiles - 1 )
        x = ( world.x * tileWidth ) + vx;
    else if ( world.x >= ( worldWidth - halfWidthTiles - 1 ))
        x = (( widthTiles - ( worldWidth - world.x )) * tileWidth ) + vx;

    if ( world.y <= halfHeightTiles - 1 )
        y = ( world.y * tileHeight ) + vy;
    else if ( world.y >= ( worldHeight - halfHeightTiles - 1 ))
        y = (( heightTiles - ( worldHeight - world.y )) * tileHeight ) + vy;

    aCanvasContext.fillStyle = 'blue';
    aCanvasContext.fillRect( x, y, tileWidth, tileHeight );

    // draw enemies
    var enemy;

    for ( i = 0, l = world.enemies.length; i < l; ++i )
    {
        enemy = world.enemies[ i ];

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
            if ( !TEMP_MAP ) return;
            TEMP_MAP.src = mapRenderer.render(world, 1.25).src;
            _pendingInterval = false;
        }, 1500 );
        _pendingInterval = true;
    }
    // E.O. QQQ
};

// TODO QQQ : remove
import mapRenderer from './world-map-renderer';
var _pendingInterval = false;
var TEMP_MAP;

WorldRenderer.prototype.disposeInternal = function()
{
    if ( TEMP_MAP && TEMP_MAP.parentNode ) {
        TEMP_MAP.parentNode.removeChild( TEMP_MAP );
        TEMP_MAP = null;
    }
    Inheritance.super( this, 'disposeInternal' );
};
// E.O. QQQ
