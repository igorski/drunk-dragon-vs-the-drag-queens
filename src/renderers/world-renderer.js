export default WorldRenderer;

import { sprite } from "zcanvas";
import { WORLD_TILES, getMaxWalkableTile } from "@/model/factories/world-factory";
import { SHOP_TYPES } from "@/model/factories/shop-factory";
import SpriteCache, { PLAYER_SHEET } from "@/utils/sprite-cache";
import WorldCache from "@/utils/world-cache";
import { coordinateToIndex, indexToCoordinate } from "@/utils/terrain-util";
import { findPath } from "@/utils/path-finder";

let commit, dispatch; // Vuex store hooks

const DEBUG          = process.env.NODE_ENV === "development";
const CHARACTER_SIZE = 23;

const { tileWidth, tileHeight, sizeBuilding, sizeShop } = WorldCache;

/* building / Object types */

const BUILDING = {
    bitmap: SpriteCache.BUILDING,
    width: sizeBuilding.width * tileWidth,
    height: sizeBuilding.height * tileHeight
};
const SHOP = {
    bitmap: SpriteCache.SHOP,
    width: sizeShop.width * tileWidth,
    height: sizeShop.height * tileHeight
};

/**
 * @constructor
 * @extends {zCanvas.Sprite}
 *
 * @param {Object} store Vuex store reference
 * @param {number} width
 * @param {number} height
 */
function WorldRenderer( store, width, height ) {
    WorldRenderer.super( this, "constructor", { width, height, interactive: true });

    commit   = store.commit;
    dispatch = store.dispatch;

    /**
     * The list of tiles in the tiles list that are valid targets
     * for the player to walk to
     *
     * @protected
     * @type {Array<number>}
     */
    this.validNavigationTargets = [ WORLD_TILES.GROUND, WORLD_TILES.GRASS, WORLD_TILES.SAND, WORLD_TILES.ROAD ];

    /**
     * Bitmap that renders the player character. Will
     * be lazily created once rendering starts.
     */
    this.playerBitmap = null;
}
sprite.extend( WorldRenderer );

/* class properties */

/** @protected @type {number} */ WorldRenderer.prototype.horizontalTileAmount = 10;
/** @protected @type {number} */ WorldRenderer.prototype.verticalTileAmount   = 10;

/** @protected @type {Object} */ WorldRenderer.prototype._environment;
/** @protected @type {Object} */ WorldRenderer.prototype._player;

/* public methods */

/**
 * @param {Object} aWorld
 * @param {Object} aPlayer
 */
WorldRenderer.prototype.render = function( aWorld, aPlayer ) {
    this._environment = aWorld;
    this._player      = aPlayer;

    // cache player Bitmap dimensions
    this._playerBitmap = new sprite({
        bitmap: SpriteCache.PLAYER,
        sheetTileWidth: 23,
        sheetTileHeight: 23,
        sheet: PLAYER_SHEET
    });
    // cache last known properties for player sprite animation
    this._lastX   = aWorld.x;
    this._lastY   = aWorld.y;
    this._lastDir = 0;

    this.addChild( this._playerBitmap );
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
    WorldRenderer.super( this, "updateImage", aImage, aNewWidth, aNewHeight );

    const isPortrait = aNewHeight > aNewWidth;

    if ( !isPortrait ) {
        this.horizontalTileAmount  = aNewWidth < 500 ? 7 : 15;

        WorldCache.tileWidth  = this._bounds.width  / this.horizontalTileAmount;
        WorldCache.tileHeight = WorldCache.tileWidth; // tiles are squares
        this.verticalTileAmount = ( aNewHeight / WorldCache.tileHeight ) + 1;

        // odd numbers please...
        if ( this.verticalTileAmount % 2 === 0 )
            ++this.verticalTileAmount;
    }
    else
    {
        this.verticalTileAmount = aNewHeight < 500 ? 7 : 15;

        WorldCache.tileHeight = this._bounds.height / this.verticalTileAmount;
        WorldCache.tileWidth  = WorldCache.tileHeight;   // tiles are squares
        this.horizontalTileAmount  = ( aNewWidth / WorldCache.tileWidth ) + 1;

        // odd numbers please...
        if ( this.horizontalTileAmount % 2 === 0 ) {
            ++this.horizontalTileAmount;
        }
    }
};

/**
 * @param {number} aWidth
 * @param {number} aHeight
 */
WorldRenderer.prototype.setTileDimensions = function( aWidth, aHeight ) {
    this.horizontalTileAmount = aWidth  / WorldCache.tileWidth;
    this.verticalTileAmount   = aHeight / WorldCache.tileHeight;

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
    const { x, y, terrain } = this._environment;
    const { left, top }     = this.getVisibleTiles();

    // determine which tile has been clicked by translating the pointer coordinate
    // local to the current canvas size against the amount of tiles we can display for this size

    let tx = Math.floor( left + ( pointerX / this.canvas.getWidth() )  * this.horizontalTileAmount );
    let ty = Math.floor( top  + ( pointerY / this.canvas.getHeight() ) * this.verticalTileAmount );

    // keep within bounds (necessary when player is at environment edges)
    tx = Math.max( 0, Math.min( tx, this.canvas.getWidth()  * this.horizontalTileAmount ));
    ty = Math.max( 0, Math.min( ty, this.canvas.getHeight() * this.verticalTileAmount ));

    const indexOfTile = coordinateToIndex( tx, ty, this._environment ); // translate coordinate to 1D list index
    const targetTile  = terrain[ indexOfTile ];

    if ( DEBUG ) {
        console.warn( `Clicked tile at ${tx} x ${ty} (player is at ${x} x ${y}) (local click pointer coordinates ${pointerX} x ${pointerY}), underlying terrain type: ${targetTile}` );
    }

    if ( this.isValidTarget( targetTile )) {
        this.navigateToTile( tx, ty );
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
    return this.validNavigationTargets.includes( tileType ) || ( tileType === this.getMaxWalkableTile() );
};

/**
 * Get the maximum tile index we can navigate over.
 * This wraps around the getter in the environments factory so we can
 * override this in inheriting renderer classes.
 */
WorldRenderer.prototype.getMaxWalkableTile = function() {
    return getMaxWalkableTile( this._player );
};

/**
 * Calculate the waypoint to given coordinate and navigate when valid.
 *
 * @protected
 * @param {number} tx destination x-coordinate
 * @param {number} ty destination y-coordinate
 */
WorldRenderer.prototype.navigateToTile = async function( x, y ) {
    // TODO: here we pre-calculate the path to prevent "easy" navigation of long distances
    // Path calculation is also done by "moveToDestination" through EnvironmentActions.moveCharacter.
    // Can we de-duplicate this ??
    let waypoints = findPath(
        this._environment,
        Math.round( this._environment.x ), Math.round( this._environment.y ),
        x, y, this.getMaxWalkableTile()
    );
    const maxLen = this.horizontalTileAmount + this.verticalTileAmount;
    if ( waypoints.length > maxLen ) {
        // if the full walkable path isn't inside visual bounds, cancel navigation, player
        // must navigate to smaller steps (prevents automagically resolving of long distances)
        return;
    }
    waypoints = await dispatch( "moveToDestination", { x, y, onProgress: () => {
        const visited = [];
        const { left, top, right, bottom } = this.getVisibleTiles();
        for ( let ix = left; ix < right; ++ix ) {
            for ( let iy = top; iy < bottom; ++ iy ) {
                visited.push( coordinateToIndex( ix, iy, this._environment ));
            }
        }
        commit( "markVisitedTerrain", visited );
    }});
    if ( DEBUG ) {
        this.target = waypoints;
    }
};

/**
 * Calculates which tiles are currently visible inside the viewport. This also
 returns the dimensions of tiles for tile-to-pixel-bounding-box math.
 */
WorldRenderer.prototype.getVisibleTiles = function() {
    // the amount of tiles on either side of the player
    const halfHorizontalTileAmount = Math.floor( this.horizontalTileAmount  / 2 );
    const halfVerticalTileAmount   = Math.floor( this.verticalTileAmount    / 2 );

    // the rectangle to draw, all relative in world coordinates (tiles)

    const { x, y } = this._environment;

    const left   = x - halfHorizontalTileAmount;
    const right  = x + halfHorizontalTileAmount;
    const top    = y - halfVerticalTileAmount;
    const bottom = y + halfVerticalTileAmount;

    return {
        halfHorizontalTileAmount, halfVerticalTileAmount,
        left, right, top, bottom
    };
};

/**
 * @override
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 */
WorldRenderer.prototype.draw = function( aCanvasContext ) {
    const world      = this._environment;
    const vx         = world.x;
    const vy         = world.y;

    const { width, height }         = world;
    const { tileWidth, tileHeight } = WorldCache;

    const visibleTiles = this.getVisibleTiles();
    const {
        left, right, top, bottom,
        halfHorizontalTileAmount, halfVerticalTileAmount
    } = visibleTiles;

    // render terrain from cache

    let sourceX       = left * tileWidth;
    let sourceY       = top  * tileHeight;
    let targetX       = 0;
    let targetY       = 0;
    const canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

    // if player is at world edge, stop scrolling terrain
/*
    if ( world.x <= halfHorizontalTileAmount ) {
        sourceX = 0;
    } else if ( left > width - this.horizontalTileAmount - 1 ) {
        sourceX = ( width - this.horizontalTileAmount ) * tileWidth;
    }

    if ( world.y <= halfVerticalTileAmount ) {
        sourceY = 0;
    } else if ( top > height - this.verticalTileAmount - 1 ) {
        sourceY = ( height - this.verticalTileAmount ) * tileHeight;
    }
*/
    aCanvasContext.drawImage( SpriteCache.ENV_WORLD,
                              sourceX, sourceY, canvasWidth, canvasHeight,
                              targetX, targetY, canvasWidth, canvasHeight );

    const { buildings, shops, characters } = world;

    renderObjects( aCanvasContext, buildings, visibleTiles, BUILDING );
    renderObjects( aCanvasContext, shops,     visibleTiles, SHOP );

    // transform lighting

    this.applyLighting( aCanvasContext, canvasWidth, canvasHeight );

    // render characters

    this.renderCharacters( aCanvasContext, characters, visibleTiles );
    this.renderPlayer( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );

    // draw path when walking to waypoint

    if ( DEBUG ) {
        this.renderWaypoints( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
    }
};

WorldRenderer.prototype.applyLighting = function( aCanvasContext, canvasWidth, canvasHeight ) {
    const orgComp = aCanvasContext.globalCompositeOperation;

    aCanvasContext.globalAlpha = 0.8; // something between 0.3 and 0.95 as time progresses ?
    aCanvasContext.globalCompositeOperation = "multiply";
    aCanvasContext.fillStyle = "#262373"; // see _colors.scss
    aCanvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

    aCanvasContext.globalAlpha = 1;
    aCanvasContext.globalCompositeOperation = orgComp;
    /*
    // get raw pixel values
    const imageData = aCanvasContext.getImageData( 0, 0, canvasWidth, canvasHeight );
    const pixels    = imageData.data;
    const factor    = 0.5;
    // modify each pixel
    for ( let i = 0; i < pixels.length; i += 4 ) {
       // red is pixels[i];
       // green is pixels[i + 1];
       // blue is pixels[i + 2];
       // alpha is pixels[i + 3];
       // all values are integers between 0 and 255
       // do with them whatever you like. Here we are reducing the color volume to 75%
       // without affecting the alpha channel
       pixels[ i ]     *= factor / 2; // red
       pixels[ i + 1 ] *= factor / 2; // green
       pixels[ i + 2 ] *= factor; // blue
    }
    // write modified pixels back to canvas
    aCanvasContext.putImageData( imageData, 0, 0 );
    */
};

WorldRenderer.prototype.renderPlayer = function( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount ) {
    const { tileWidth, tileHeight } = WorldCache;
    const world      = this._environment;
    const vx         = world.x;
    const vy         = world.y;
    const worldWidth = world.width, worldHeight = world.height;

    let x = ( world.x - left ) * tileWidth;
    let y = ( world.y - top  ) * tileHeight;

    // if player is at world edge draw player out of center
/*
    if ( world.x <= halfHorizontalTileAmount - 1 ) {
        x = ( world.x * tileWidth ) + vx;
    } else if ( world.x >= ( worldWidth - halfHorizontalTileAmount - 1 )) {
        x = (( this.horizontalTileAmount - ( worldWidth - world.x )) * tileWidth ) + vx;
    }

    if ( world.y <= halfVerticalTileAmount - 1 ) {
        y = ( world.y * tileHeight ) + vy;
    } else if ( world.y >= ( worldHeight - halfVerticalTileAmount - 1 )) {
        y = (( this.verticalTileAmount - ( worldHeight - world.y )) * tileHeight ) + vy;
    }
*/
    const targetX = x - ( CHARACTER_SIZE / 2 - tileWidth  / 2 );
    const targetY = y - ( CHARACTER_SIZE / 2 - tileHeight / 2 );

    // determine whether and in which direction we're moving by taking the
    // world coordinate (represents player position) and compare it with the cached value
    const isMoving = vx !== this._lastX || vy !== this._lastY;
    if ( isMoving ) {
        let dir = this._lastDir;
        if ( vx > this._lastX ) {
            dir = 3; // moving right
        }
        if ( vx < this._lastX ) {
            dir = 2; // moving left
        }
        if ( vy > this._lastY ) {
            dir = 1; // moving down
        }
        if ( vy < this._lastY ) {
            dir = 0; // moving up
        }
        if ( dir !== this._lastDir ) {
            this._playerBitmap.switchAnimation( dir );
            this._lastDir = dir;
        } else {
            this._playerBitmap.update(); // updates spritesheet
        }
        this._lastX = vx;
        this._lastY = vy;
    }
    this._playerBitmap.setBounds( targetX, targetY, CHARACTER_SIZE, CHARACTER_SIZE );
    this._playerBitmap.draw( aCanvasContext );
}

WorldRenderer.prototype.renderCharacters = function( aCanvasContext, characters = [], { left, top, right, bottom }) {
    const { tileWidth, tileHeight } = WorldCache;

    for ( let i = 0, l = characters.length; i < l; ++i ) {
        const character = characters[ i ];
        if ( character.x >= left && character.x <= right &&
             character.y >= top  && character.y <= bottom )
        {
            let x = ( character.x - left ) * tileWidth;
            let y = ( character.y - top )  * tileHeight;

            const { width, height } = character.bitmap;
            const xDelta = CHARACTER_SIZE / 2 - tileWidth / 2;
            const yDelta = CHARACTER_SIZE / 2 - tileHeight / 2

            aCanvasContext.drawImage(
                character.bitmap, 0, 0, width, height,
                Math.round( x - xDelta ), Math.round( y - yDelta ),
                CHARACTER_SIZE, CHARACTER_SIZE
            );
        }
    }
}

WorldRenderer.prototype.renderWaypoints = function( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount ) {
    if (Array.isArray( this.target )) {
        aCanvasContext.fillStyle = "red";
        const { tileWidth, tileHeight } = WorldCache;
        this.target.forEach(({ x, y }) => {
            const tLeft   = (( x - left ) * tileWidth )  + halfHorizontalTileAmount;
            const tTop    = (( y - top  ) * tileHeight ) + halfVerticalTileAmount;

            aCanvasContext.fillRect( tLeft - 2, tTop - 2, 4, 4 );
        });
    }
}

function renderObjects( aCanvasContext, objectList, { left, top, right, bottom }, objectType ) {
    const { tileWidth, tileHeight } = WorldCache;
    const { bitmap, width, height } = objectType;
    let targetX, targetY;

    // to broaden the visible range, add one whole coordinate
    // NOTE: this is just for determining visibility, when rendering
    // use the actual values !!

    const w = width  / tileWidth;
    const h = height / tileHeight;

    const l = left - w;
    const r = right + w;
    const t = top - h;
    const b = bottom + h;

    for ( let i = 0, l = objectList.length; i < l; ++i ) {
        const { x, y, type } = objectList[ i ];
        if ( x >= l && x <= r &&
             y >= t && y <= b )
        {
            targetX = ( x - left ) * tileWidth;
            targetY = ( y - top )  * tileHeight;
            targetX -= (( width  - tileWidth )  * .5 ); // align horizontally
            targetY -= (( height - tileHeight )); // entrance is on lowest side

            aCanvasContext.drawImage( bitmap, targetX, targetY, width, height );

            // add visual distinction to shop types
            // TODO: these will be different sprites in final version
            if ( objectType === SHOP ) {
                let text = "Shop";
                switch ( type ) {
                    default:
                        break;
                    case SHOP_TYPES.PHARMACY:
                        text = "Pharmacy";
                        break;
                    case SHOP_TYPES.LIQUOR:
                        text = "Liquor store";
                        break;
                    case SHOP_TYPES.JEWELLER:
                        text = "Jeweller";
                        break;
                    case SHOP_TYPES.PAWN:
                        text = "Pawn shop";
                        break;
                    case SHOP_TYPES.CLOTHES:
                        text = "Clothing";
                        break;
                }
                aCanvasContext.font = "30px Arial";
                aCanvasContext.fillStyle = "#FFF";
                aCanvasContext.fillText( text, targetX - 15, targetY - 15 );
            }
        }
    }
}
