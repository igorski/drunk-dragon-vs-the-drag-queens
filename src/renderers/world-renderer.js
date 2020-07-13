export default WorldRenderer;

import { sprite }  from 'zcanvas';
import { WORLD_TILES } from '@/model/factories/world-factory';
import SpriteCache from '@/utils/sprite-cache';
import WorldCache  from '@/utils/world-cache';
import { coordinateToIndex, indexToCoordinate } from '@/utils/terrain-util';
import { findPath } from '@/utils/path-finder';

let commit, dispatch; // Vuex store hooks

const DEBUG = true;

/**
 * @constructor
 * @extends {zSprite}
 *
 * @param {Object} store Vuex store reference
 * @param {number} width
 * @param {number} height
 */
function WorldRenderer( store, width, height ) {
    WorldRenderer.super( this, 'constructor', { width, height, interactive: true });

    commit   = store.commit;
    dispatch = store.dispatch;
}

sprite.extend( WorldRenderer );

/* class properties */

/** @protected @type {number} */ WorldRenderer.prototype.maxTilesInWidth  = 10;
/** @protected @type {number} */ WorldRenderer.prototype.maxTilesInHeight = 10;

/** @protected @type {World} */  WorldRenderer.prototype._world;
/** @protected @type {Player} */ WorldRenderer.prototype._player;

/* public methods */

/**
 * @param {World} aWorld
 * @param {Player} aPlayer
 */
WorldRenderer.prototype.render = function( aWorld, aPlayer ) {
    this._world  = aWorld;
    this._player = aPlayer;
};

/**
 * @override
 *
 * @param {Image|string=} aImage image, can be either HTMLImageElement or base64 encoded string
 * image is optional as we might be interested in just scaling the
 *                        current image using aNewWidth and aNewHeight
 * @param {number=} aNewWidth optional new width of the image
 * @param {number=} aNewHeight optional new height of the image
 */
WorldRenderer.prototype.updateImage = function( aImage, aNewWidth, aNewHeight ) {
    WorldRenderer.super( this, 'updateImage', aImage, aNewWidth, aNewHeight );

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
        if ( this.maxTilesInWidth % 2 === 0 ) {
            ++this.maxTilesInWidth;
        }
    }
};

/**
 * @param {number} aWidth
 * @param {number} aHeight
 */
WorldRenderer.prototype.setTileDimensions = function( aWidth, aHeight ) {
    this.maxTilesInWidth  = aWidth  / WorldCache.tileWidth;
    this.maxTilesInHeight = aHeight / WorldCache.tileHeight;

    // ensure the hit area matches the bounding box, make up for canvas scale factor
    const { x, y } = this.canvas._scale;

    this.setWidth( aWidth * x );
    this.setHeight( aHeight * y );
};

/**
 * @param {number} pointerX mouse pointer coordinate
 * @param {number} pointerY mouse pointer coordinate
 */
WorldRenderer.prototype.handleRelease = function( pointerX, pointerY ) {
    const { x, y, terrain } = this._world;
    const { left, top }     = this.getVisibleTiles();

    // determine which tile has been clicked by translating the pointer coordinate
    // local to the current canvas size against the amount of tiles we can display for this size

    const tx = Math.floor( left + ( pointerX / this.canvas.getWidth() )  * this.maxTilesInWidth );
    const ty = Math.floor( top  + ( pointerY / this.canvas.getHeight() ) * this.maxTilesInHeight );

    const indexOfTile = coordinateToIndex( tx, ty, this._world ); // translate coordinate to 1D list index
    const targetTile = terrain[ indexOfTile ];

    if ( DEBUG ) {
        console.warn( `Clicked tile at ${tx} x ${ty} (player is at ${x} x ${y}) (local click pointer coordinates ${pointerX} x ${pointerY}), underlying terrain type: ${targetTile}` );
    }

    if ( this.isValidTarget( targetTile )) {
        this.target = findPath( this._world, Math.round( x ), Math.round( y ), tx, ty, WORLD_TILES.SAND );
        dispatch( 'moveToDestination', this.target );
    }
};

/**
 * Determine whether given tileType is a valid type to travel to for the current environment
 *
 * @protected
 * @param {number} tileType
 * @return {boolean}
 */
WorldRenderer.prototype.isValidTarget = function( tileType ) {
    return [ WORLD_TILES.GROUND, WORLD_TILES.GRASS, WORLD_TILES.SAND ].includes( tileType );
};

/**
 * Calculates which tiles are currently visible inside the viewport. This also
 returns the dimensions of tiles for tile-to-pixel-bounding-box math.
 */
WorldRenderer.prototype.getVisibleTiles = function() {
    // the amount of tiles on either side of the player
    const widthTiles      = this.maxTilesInWidth;
    const heightTiles     = this.maxTilesInHeight;
    const halfWidthTiles  = Math.floor( widthTiles  / 2 );
    const halfHeightTiles = Math.floor( heightTiles / 2 );

    // the rectangle to draw, all relative in world coordinates (tiles)

    const { x, y } = this._world;

    const left   = x - halfWidthTiles;
    const right  = x + halfWidthTiles;
    const top    = y - halfHeightTiles;
    const bottom = y + halfHeightTiles;

    return {
        widthTiles, heightTiles, halfWidthTiles, halfHeightTiles,
        left, right, top, bottom
    };
};

/**
 * @override
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 */
WorldRenderer.prototype.draw = function( aCanvasContext ) {
    const vx = this._world.x || 0;
    const vy = this._world.y || 0;

    const world      = this._world;
    const worldWidth = world.width, worldHeight = world.height;

    const { tileWidth, tileHeight } = WorldCache;

    const {
        left, right, top, bottom,
        widthTiles, heightTiles, halfWidthTiles, halfHeightTiles
    } = this.getVisibleTiles();

    // render terrain from cache

    const sourceX     = ( left * tileWidth ), sourceY = ( top * tileHeight );
    const canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

    // if player is at world edge, stop scrolling terrain

    if ( world.x <= halfWidthTiles ) {
        sourceX = 0;
    } else if ( left > worldWidth - widthTiles - 1 ) {
        sourceX = ( worldWidth - widthTiles ) * tileWidth;
    }

    if ( world.y <= halfHeightTiles ) {
        sourceY = 0;
    } else if ( top > worldHeight - heightTiles - 1 ) {
        sourceY = ( worldHeight - heightTiles ) * tileHeight;
    }

    aCanvasContext.drawImage( SpriteCache.WORLD,
                              sourceX, sourceY, canvasWidth, canvasHeight,
                              0, 0, canvasWidth, canvasHeight );

    const { caves, shops, enemies } = world;
    let x, y;

    // draw caves

    for ( let i = 0, l = caves.length; i < l; ++i )
    {
        const cave = caves[ i ];

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

    for ( let i = 0, l = shops.length; i < l; ++i )
    {
        const shop = shops[ i ];

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

    if ( world.x <= halfWidthTiles - 1 ) {
        x = ( world.x * tileWidth ) + vx;
    } else if ( world.x >= ( worldWidth - halfWidthTiles - 1 )) {
        x = (( widthTiles - ( worldWidth - world.x )) * tileWidth ) + vx;
    }

    if ( world.y <= halfHeightTiles - 1 ) {
        y = ( world.y * tileHeight ) + vy;
    } else if ( world.y >= ( worldHeight - halfHeightTiles - 1 )) {
        y = (( heightTiles - ( worldHeight - world.y )) * tileHeight ) + vy;
    }

    aCanvasContext.fillStyle = 'rgba(0,0,255,.5)';
    aCanvasContext.fillRect( x, y, tileWidth, tileHeight );

    // draw enemies

    for ( let i = 0, l = enemies.length; i < l; ++i ) {
        const enemy = enemies[ i ];

        if ( enemy.x >= left && enemy.x <= right &&
             enemy.y >= top  && enemy.y <= bottom )
        {
            x = ( enemy.x - left ) * tileWidth;
            y = ( enemy.y - top )  * tileHeight;

            x -= 5; y-= 5;  // enemy sprite is 30x30, world is 20x20...

            aCanvasContext.drawImage( SpriteCache.DRONE, x  - vx, y - vy, 30, 30 );
        }
    }

    // draw target QQQ

    if ( DEBUG && Array.isArray( this.target )) {
        this.target.forEach(({ x, y }) => {
            const tLeft   = ((x - left ) * tileWidth ) + halfWidthTiles;
            const tTop    = ((y - top )  * tileHeight ) +halfHeightTiles;

            aCanvasContext.fillStyle = 'red';
            aCanvasContext.fillRect( tLeft - 2, tTop - 2, 4, 4 );
        });
    }
};
