export default BuildingRenderer;

import WorldRenderer from './world-renderer';
import TerrainUtil   from '@/utils/terrain-util';
import WorldCache    from '@/utils/world-cache';
import SpriteCache   from '@/utils/sprite-cache';

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
}
WorldRenderer.extend( BuildingRenderer );

/* public methods */

/**
 * @override
 * @param {CanvasRenderingContext2D} aCanvasContext to draw on
 */
BuildingRenderer.prototype.draw = function( aCanvasContext ) {
    const building  = this._environment;
    const vx        = building.x;
    const vy        = building.y;

    const floor      = building.floors[ building.floor ];
    const floorWidth = floor.width, floorHeight = floor.height;

    const { tileWidth, tileHeight } = WorldCache;

    const visibleTiles = this.getVisibleTiles();
    const {
        left, right, top, bottom,
        halfHorizontalTileAmount, halfVerticalTileAmount
    } = visibleTiles;

    // flood fill the building with black
    aCanvasContext.fillStyle = '#000000';
    aCanvasContext.fillRect( 0, 0, floorWidth, floorHeight );

    // render terrain from cache

    const sourceX     = ( left * tileWidth ) + vx, sourceY = ( top * tileHeight ) + vy;
    const canvasWidth = this.canvas.getWidth(), canvasHeight = this.canvas.getHeight();

    // contrary to the overground, the player is always bang in the middle

    aCanvasContext.drawImage( SpriteCache.BUILDING,
                              sourceX, sourceY, canvasWidth, canvasHeight,
                              0, 0, canvasWidth, canvasHeight );

    this.renderPlayer( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
    this.renderCharacters( aCanvasContext, building.enemies, left, top );

    // draw path when walking to waypoint

    if ( DEBUG ) {
        this.renderWaypoints( aCanvasContext, left, top, halfHorizontalTileAmount, halfVerticalTileAmount );
    }
};
