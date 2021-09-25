import OvergroundRenderer from "./overground-renderer";
import TerrainUtil from "@/utils/terrain-util";
import WorldCache from "@/utils/world-cache";
import SpriteCache, { FURNITURE } from "@/utils/sprite-cache";

import { BUILDING_TILES, getMaxWalkableTile } from "@/model/factories/building-factory";

const DEBUG = process.env.NODE_ENV !== "production";
let getters;

export default class BuildingRenderer extends OvergroundRenderer {
    /**
     * @param {Object} store Vuex store reference
     * @param {number} width
     * @param {number} height
     */
    constructor( store, width, height ) {
        super( store, width, height );
        ({ getters } = store );

        this.validNavigationTargets = [ BUILDING_TILES.GROUND, BUILDING_TILES.STAIRS ];
    }

    /* public methods */

    /**
     * @override
     * overrides as it uses the getMaxWalkableTile() method of a different factory !
     */
    getMaxWalkableTile() {
        return getMaxWalkableTile( getters.player );
    }

    /**
     * @override
     * @param {CanvasRenderingContext2D} aCanvasContext to draw on
     */
    draw( aCanvasContext ) {
        const floor  = this._environment;
        const vx     = floor.x;
        const vy     = floor.y;

        const { width, height } = floor;
        const { tileWidth, tileHeight } = WorldCache;

        const visibleTiles = this.getVisibleTiles();
        const {
            left, right, top, bottom,
            halfHorizontalTileAmount, halfVerticalTileAmount
        } = visibleTiles;

        // render terrain from cache

        let sourceX = left * tileWidth;
        let sourceY = top * tileHeight;
        let targetX = 0;
        let targetY = 0;
        const canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

        // at world edges, we correct the source/target coordinates (and render empty space)
        if ( sourceX < 0 ) {
            targetX = Math.abs( sourceX );
            sourceX = 0;
        }
        if ( sourceY < 0 ) {
            targetY = Math.abs( sourceY );
            sourceY = 0;
        }

        aCanvasContext.drawImage(
            SpriteCache.ENV_BUILDING,
            sourceX, sourceY, canvasWidth, canvasHeight,
            targetX, targetY, canvasWidth, canvasHeight
        );

        // render objects

        this.renderObjects( aCanvasContext, floor, visibleTiles );
        renderFurniture( aCanvasContext, floor.hotels, visibleTiles, FURNITURE.bed );

        // render characters

        this.renderCharacters( aCanvasContext, floor.characters, visibleTiles );
        this._playerSprite.render( aCanvasContext, vx, vy, left, top );

        // draw path when walking to waypoint

        if ( DEBUG ) {
            this.renderWaypoints( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
        }

        // render UI
        this.renderUI( aCanvasContext );
    }
}

/* internal methods */

function renderFurniture( aCanvasContext, objectList, { left, top, right, bottom }, spriteObject ) {
    const { tileWidth, tileHeight } = WorldCache;
    const { width, height } = spriteObject;
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

            aCanvasContext.drawImage( SpriteCache.FURNITURE, spriteObject.x, spriteObject.y, width, height, targetX, targetY, width, height );
        }
    }
}
