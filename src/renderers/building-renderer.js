export default BuildingRenderer;

import WorldRenderer from './world-renderer';
import TerrainUtil   from '@/utils/terrain-util';
import WorldCache    from '@/utils/world-cache';
import SpriteCache   from '@/utils/sprite-cache';

import { BUILDING_TILES, MAX_WALKABLE_TILE } from '@/model/factories/building-factory';

const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * @constructor
 * @extends {WorldRenderer}
 *
 * @param {Object} store Vuex store reference
 * @param {number} width
 * @param {number} height
 */
function BuildingRenderer( store, width, height ) {
    BuildingRenderer.super( this, 'constructor', store, width, height );

    this.maxWalkableTileNum     = MAX_WALKABLE_TILE;
    this.validNavigationTargets = [ BUILDING_TILES.GROUND, BUILDING_TILES.STAIRS ];
}
WorldRenderer.extend( BuildingRenderer );

/* public methods */

/**
 * @override
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 */
BuildingRenderer.prototype.draw = function( aCanvasContext ) {
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

    // flood fill the building with black
    aCanvasContext.fillStyle = '#000000';
    aCanvasContext.fillRect( 0, 0, width, height );

    // render terrain from cache

    const sourceX = left * tileWidth;
    const sourceY = top * tileHeight;
    const targetX = 0;
    const targetY = 0;
    const canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

    aCanvasContext.drawImage( SpriteCache.ENV_BUILDING,
                              sourceX, sourceY, canvasWidth, canvasHeight,
                              targetX, targetY, canvasWidth, canvasHeight );

    this.renderPlayer( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
    this.renderCharacters( aCanvasContext, floor.characters, left, top );

    // draw path when walking to waypoint

    if ( DEBUG ) {
        this.renderWaypoints( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
    }
};
