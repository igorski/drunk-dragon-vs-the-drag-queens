import { WORLD_TILES }       from '@/model/factories/world-factory';
import { createPixelCanvas } from '@/utils/canvas-util';
import { coordinateToIndex } from '@/utils/terrain-util';

/**
 * @param {Object} environment (is world)
 * @param {number} targetWidth the target width of the resulting Image
 * @return {Image}
 */
export default function( environment, targetWidth ) {
    const { width : cols, height : rows } = environment;

    const targetHeight = targetWidth * rows / cols;
    const { cvs, ctx } = createPixelCanvas( targetWidth, targetHeight );

    const tileWidth  = Math.round( targetWidth  / cols  );
    const tileHeight = Math.round( targetHeight / rows );

    // render the terrain

    let tx, ty;

    for ( let x = 0, y = 0; y < cols; x = ( ++x == rows ? ( x % rows + ( ++y & 0 ) ) : x ) ) {
        const index = coordinateToIndex( x, y, { width: rows });
        tx = Math.round( x * tileWidth );
        ty = Math.round( y * tileHeight );

        const color = 'grey';

        switch ( environment.terrain[ index ] ) {
            case WORLD_TILES.GRASS:
                color = 'green';
                break;

            case WORLD_TILES.WATER:
                color = '#0066FF';
                break;

            case WORLD_TILES.MOUNTAIN:
                color = '#AAA';
                break;

            case WORLD_TILES.SAND:
                color = '#FFFF00';
                break;

            case WORLD_TILES.TREE:
                color = '#00FF65';
                break;

            case WORLD_TILES.ROAD:
                color = '#333';
                break;
        }
        ctx.fillStyle = color;
        ctx.fillRect(
            tx - ( Math.floor( tileWidth / 2 )),
            ty - ( Math.floor( tileHeight / 2 )),
            tileWidth, tileHeight
        );
    }

    const { buildings, shops } = environment;

    drawItems( ctx, buildings, 4, tileWidth, tileHeight, 'purple' );
    drawItems( ctx, shops,     4, tileWidth, tileHeight, 'blue' );

    // draw player

    ctx.fillStyle = '#FFF';
    const size = 8;
    ctx.fillRect(
        ( environment.x * tileWidth )  - size / 2,
        ( environment.y * tileHeight ) - size / 2,
        size, size
    );
    const out = new Image();
    out.src = cvs.toDataURL( 'image/png' );

    return out;
};

function drawItems( ctx, items, size, tileWidth, tileHeight, color ) {
    items.forEach(({ x, y }) => {
        const tx = x * tileWidth;
        const ty = y * tileHeight;

        ctx.fillStyle = color;
        ctx.fillRect( tx, ty, size, size );
    });
}
