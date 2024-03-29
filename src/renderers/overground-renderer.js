import { Sprite } from "zcanvas";
import { QUEEN, DRAB, DRAGON } from "@/definitions/character-types";
import { WORLD_TILES, getMaxWalkableTile } from "@/model/factories/world-factory";
import { SHOP_TYPES } from "@/model/factories/shop-factory";
import SpriteCache, { QUEEN_SHEET, getSpriteForCharacter } from "@/utils/sprite-cache";
import WorldCache from "@/utils/world-cache";
import { coordinateToIndex } from "@/utils/terrain-util";
import { findPath } from "@/utils/path-finder";

let commit, getters, dispatch; // Vuex store hooks

const DEBUG = process.env.NODE_ENV === "development";

const MOVE_KEYS      = [ 37, 38, 39, 40 ];
const CURSOR_NEUTRAL = 0;
const CURSOR_LOCKED  = 1;
const CURSOR_INVALID = 2;

/* character sprites */

const CHARACTER_WIDTH  = QUEEN_SHEET.tileWidth;
const CHARACTER_HEIGHT = QUEEN_SHEET.tileHeight;

const { tileWidth, tileHeight, sizeBuilding, sizeShop } = WorldCache;

/* building / Object types */

const BUILDING = {
    entry  : SpriteCache.BUILDING,
    width  : sizeBuilding.width  * tileWidth,
    height : sizeBuilding.height * tileHeight
};
const SHOP = {
    entry  : SpriteCache.SHOP,
    width  : sizeShop.width  * tileWidth,
    height : sizeShop.height * tileHeight
};
const ITEMS = {
    entry  : SpriteCache.ITEMS,
    width  : tileWidth,
    height : tileHeight
};

export default class OvergroundRenderer extends Sprite {
    /**
     * @param {Object} store Vuex store reference
     * @param {number} width
     * @param {number} height
     */
    constructor( store, width, height ) {
        super({ width, height, interactive: false }); // we maintain our internal event handler

        ({ commit, getters, dispatch } = store );

        /* class properties */

        /** @protected @type {number} */ this.horizontalTileAmount = 10;
        /** @protected @type {number} */ this.verticalTileAmount   = 10;
        /** @protected @type {Object} */ this._environment;

        /**
         * The list of tiles in the tiles list that are valid targets
         * for the player to walk to
         */
        this.validNavigationTargets = [ WORLD_TILES.GROUND, WORLD_TILES.GRASS, WORLD_TILES.SAND, WORLD_TILES.ROAD ];

        /**
         * zCanvas.sprite-instance that will render the Player characters
         */
        this._playerSprite = null;

        /* keyboard control */

        this._keyListener = this.handleKeyDown.bind( this );

        /* mouse control */

        this._mouseListener = ({ pageX, pageY }) => {
            this._mouseX = pageX;
            this._mouseY = pageY;
        };

        this._clickListener = ({ offsetX, offsetY, target }) => {
            if ( target.tagName === "CANVAS" ) {
                this.handleRelease( offsetX, offsetY );
            }
        };

        this._mouseX   = 0;
        this._mouseY   = 0;
        this._cursor   = CURSOR_NEUTRAL;
        this._cursorIt = 0;

        this.addListeners();
    }

    /* public methods */


    dispose() {
        this.removeListeners();
        super.dispose();
    }

    setInteractive( value ) {
        if ( value ) {
            this.addListeners();
        } else {
            this.removeListeners();
        }
    }

    addListeners() {
        if ( this._hasListeners ) {
            return;
        }
        window.addEventListener( "keydown",     this._keyListener );
        window.addEventListener( "mousemove",   this._mouseListener );
        window.addEventListener( "pointerdown", this._clickListener );

        this._hasListeners = true;
    }

    removeListeners() {
        if ( !this._hasListeners ) {
            return;
        }
        window.removeEventListener( "keydown",     this._keyListener );
        window.removeEventListener( "mousemove",   this._mouseListener );
        window.removeEventListener( "pointerdown", this._clickListener );

        this._hasListeners = false;
    }

    /**
     * @param {Object} environment
     */
    prepare( environment, player ) {
        this._environment = environment;

        // create and cache sprites
        this._playerSprite = getSpriteForCharacter( this.canvas, this, player );
        this._playerSprite.setX( environment.x );
        this._playerSprite.setY( environment.y );

        const zcanvas = this.canvas;

        for ( const character of environment.characters ) {
            const resourceId = `res_${character.id}`;
            zcanvas.loadResource( resourceId, character.asset.bitmap );
            character.asset.resourceId = resourceId;
        }
        console.info(environment);
    }

    /**
     * @param {number} aWidth
     * @param {number} aHeight
     */
    setTileDimensions( aWidth, aHeight ) {
        this.horizontalTileAmount = aWidth  / WorldCache.tileWidth;
        this.verticalTileAmount   = aHeight / WorldCache.tileHeight;

        // ensure the hit area matches the bounding box, make up for canvas scale factor
        const { x, y } = this.canvas._scale;

        this.setWidth( aWidth * x );
        this.setHeight( aHeight * y );
    }

    /**
     * Determine whether given tileType is a valid type to travel to for the current environment
     *
     * @param {number} tileType
     * @return {boolean}
     */
    isValidTarget( tileType ) {
        return this.validNavigationTargets.includes( tileType ) || ( tileType === this.getMaxWalkableTile() );
    }

    /**
     * Get the maximum tile index we can navigate over.
     * This wraps around the getter in the environments factory so we can
     * override this in inheriting renderer classes.
     */
    getMaxWalkableTile() {
        return getMaxWalkableTile( getters.player );
    }

    /**
     * Calculate the waypoint to given coordinate and navigate when valid.
     *
     * @param {number} tx destination x-coordinate
     * @param {number} ty destination y-coordinate
     */
    async navigateToTile( x, y, optCallback ) {
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
            this.setCursor( CURSOR_INVALID );
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
            optCallback?.();
        }});
        if ( DEBUG ) {
            this.target = waypoints;
        }
    }

    /**
     * Calculates which tiles are currently visible inside the viewport. This also
     returns the dimensions of tiles for tile-to-pixel-bounding-box math.
     */
    getVisibleTiles() {
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
    }

    /**
     * @override
     * @param {IRenderer} zCanvas.IRenderer to draw on
     */
    draw( renderer ) {
        const world = this._environment;
        const vx    = world.x;
        const vy    = world.y;

        const { width, height }         = world;
        const { tileWidth, tileHeight } = WorldCache;

        const visibleTiles = this.getVisibleTiles();
        const {
            left, right, top, bottom,
            halfHorizontalTileAmount, halfVerticalTileAmount
        } = visibleTiles;

        // render terrain from cache

        let sourceX = left * tileWidth;
        let sourceY = top  * tileHeight;
        let targetX = 0;
        let targetY = 0;

        const canvasWidth  = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();

        // at world edges, we correct the source/target coordinates (and render empty space)
        if ( sourceX < 0 ) {
            targetX = Math.abs( sourceX );
            sourceX = 0;
        }
        if ( sourceY < 0 ) {
            targetY = Math.abs( sourceY );
            sourceY = 0;
        }

        renderer.drawImageCropped(
            SpriteCache.ENV_WORLD.resourceId,
            sourceX, sourceY, canvasWidth, canvasHeight,
            targetX, targetY, canvasWidth, canvasHeight
        );

        this.renderObjects( renderer, world, visibleTiles );

        // transform lighting

        this.applyLighting( renderer, canvasWidth, canvasHeight );

        // render characters

        this.renderCharacters( renderer, world.characters, visibleTiles );
        this._playerSprite.render( renderer, vx, vy, left, top );

        // draw path when walking to waypoint

        if ( DEBUG ) {
            this.renderWaypoints( renderer, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
        }

        // render UI
        this.renderUI( renderer );
    }

    renderObjects( renderer, environment, visibleTiles ) {
        renderObjects( renderer, environment.buildings, visibleTiles, BUILDING );
        renderObjects( renderer, environment.shops,     visibleTiles, SHOP );
        renderObjects( renderer, environment.items,     visibleTiles, ITEMS, 16 );
    }

    renderCharacters( renderer, characters = [], { left, top, right, bottom }) {
        const { tileWidth, tileHeight } = WorldCache;
        for ( let i = 0, l = characters.length; i < l; ++i ) {
            const character = characters[ i ];
            const { x, y }  = character;

            // determine whether character is within visual bounds
            if ( x >= left && x <= right && y >= top  && y <= bottom )
            {
                switch ( character.type ) {
                    default:
                        getSpriteForCharacter( this.canvas, this, character )?.render( renderer, x, y, left, top );
                        break;
                    // Queen is special for the time being (should render like the _playerSprite
                    // once the tilesheet is complete to match all character creation options)
                    case QUEEN:
                        if ( !character.asset ) {
                            continue; // likely renderer is disposed during render cycle
                        }
                        // TODO: these should become CharacterRenderer instances too
                        const characterWidth  = 24;
                        const characterHeight = 24;
                        const targetX = (( x - left ) * tileWidth  ) - ( characterWidth  * 0.5 - tileWidth  * 0.5 );
                        const targetY = (( y - top )  * tileHeight ) - ( characterHeight * 0.5 - tileHeight * 0.5 );

                        const { width, height } = character.asset;
                        renderer.drawImageCropped(
                            character.asset.resourceId,
                            0, 0, width, height,
                            targetX, targetY, characterWidth, characterHeight
                        );
                        break;
                }
            }
        }
    }

    applyLighting( renderer, canvasWidth, canvasHeight ) {
        const alpha = 0.8; // something between 0.3 and 0.95 as time progresses ?
        renderer.drawRect( 0, 0, canvasWidth, canvasHeight, "#262373" /* see _colors.scss */, undefined, {
            alpha,
            blendMode: "multiply",
        });
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
    }

    renderWaypoints( renderer, left, top, halfHorizontalTileAmount, halfVerticalTileAmount ) {
        if ( Array.isArray( this.target )) {
            const { tileWidth, tileHeight } = WorldCache;
            this.target.forEach(({ x, y }) => {
                const tLeft   = (( x - left ) * tileWidth )  + halfHorizontalTileAmount;
                const tTop    = (( y - top  ) * tileHeight ) + halfVerticalTileAmount;

                renderer.drawRect( tLeft - 2, tTop - 2, 4, 4, "red" );
            });
        }
    }

    renderUI( renderer ) {
        if ( this._mouseX === 0 ) {
            return; // likely on touch screen
        }
        const scale  = this.canvas._scale;
        const offset = 8;
        renderer.drawImageCropped(
            SpriteCache.CROSSHAIRS.resourceId, this._cursor * 25, 0, 25, 25,
            Math.round(( this._mouseX / scale.x ) - offset ), Math.round(( this._mouseY / scale.y ) - offset ), 16, 16
        );
        if ( this._cursor !== CURSOR_NEUTRAL && Math.max( 0, --this._cursorIt ) === 0 ) {
            this._cursor = CURSOR_NEUTRAL;
        }
    }

    setCursor( cursorType ) {
        if ( this._cursor !== cursorType ) {
            this._cursor   = cursorType; // set new cursor state
            this._cursorIt = 60; // amount of frames new state will show
        }
    }

    /* event handlers */

    /**
     * @param {number} pointerX mouse pointer coordinate
     * @param {number} pointerY mouse pointer coordinate
     */
    handleRelease( pointerX, pointerY ) {
        const { x, y, terrain } = this._environment;
        const { left, top }     = this.getVisibleTiles();

        // determine which tile has been clicked by translating the pointer coordinate
        // local to the current canvas size against the amount of tiles we can display for this size

        const cvsWidth  = this.canvas.getWidth();
        const cvsHeight = this.canvas.getHeight();

        let tx = Math.floor( left + ( pointerX / cvsWidth )  * this.horizontalTileAmount );
        let ty = Math.floor( top  + ( pointerY / cvsHeight ) * this.verticalTileAmount );

        // keep within bounds (necessary when player is at environment edges)
        tx = Math.max( 0, Math.min( tx, cvsWidth  * this.horizontalTileAmount ));
        ty = Math.max( 0, Math.min( ty, cvsHeight * this.verticalTileAmount ));

        const indexOfTile   = coordinateToIndex( tx, ty, this._environment ); // translate coordinate to 1D list index
        const targetTile    = terrain[ indexOfTile ];
        const isValidTarget = this.isValidTarget( targetTile );

        if ( DEBUG ) {
            console.warn( `Clicked tile at ${tx} x ${ty} (player is at ${x.toFixed(2)} x ${y.toFixed(2)}) (local click pointer coordinates ${Math.round(pointerX)} x ${Math.round(pointerY)}), underlying terrain type: ${targetTile}. Is valid target: ${isValidTarget}` );
        }

        if ( isValidTarget ) {
            this.navigateToTile( tx, ty );
            this.setCursor( CURSOR_LOCKED );
        } else {
            this.setCursor( CURSOR_INVALID );
        }
    }

    handleKeyDown({ keyCode }) {
        if ( !MOVE_KEYS.includes( keyCode )) {
            return;
        }
        if ( keyCode !== this._lastKey ) {
            this._keyLock = false; // change in direction should be immediate
            this._lastKey = keyCode;
        } else if ( this._keyLock ) {
            return;
        }
        let targetX = this._environment.x, targetY = this._environment.y;
        switch ( keyCode ) {
            default:
                return;
            case 37: // left
                --targetX;
                break;
            case 39: // right
                ++targetX;
                break;
            case 38: // up
                --targetY;
                break;
            case 40: // down
                ++targetY;
                break;
        }
        const targetTile = this._environment.terrain[
            coordinateToIndex( Math.round( targetX ), Math.round( targetY ), this._environment )
        ];
        if ( this.isValidTarget( targetTile )) {
            this._keyLock = true;
            this.navigateToTile( targetX, targetY, () => {
                this._keyLock = false;
            });
        }
    }
}

/* internal methods */

function renderObjects( renderer, objectList = [], { left, top, right, bottom }, objectType, optTileSize = 0 ) {
    const { tileWidth, tileHeight } = WorldCache;
    const { entry, width, height } = objectType;
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
            targetX -= (( width  - tileWidth )  * 0.5 ); // align horizontally
            targetY -= (( height - tileHeight )); // entrance is on lowest side

            renderer.drawImage(
                entry.resourceId, targetX, targetY,
                optTileSize || width,
                optTileSize || height
            );

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
                    case SHOP_TYPES.FOOD:
                        text = "Food";
                        break;
                    case SHOP_TYPES.DEALER:
                        text = "Dealer";
                        break;
                }

                // @todo cache this obj
                renderer.drawText({
                    text,
                    color: "#FFF",
                    font: "Arial",
                    size: 30,
                    unit: "px",
                }, targetX - 15, targetY - 15 );
            }
        }
    }
}
