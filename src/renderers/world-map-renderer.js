import { WORLD_TILES } from '@/model/factories/world-factory';
import { createPixelCanvas } from '@/utils/canvas-util';

export default
{
    /**
     * @param {Object} world
     * @param {number=} magnification optional magnification to grow / shrink
     *        the total map size
     *
     * @return {Image}
     */
    render( world, magnification = 1 ) {
        // TODO : use magnification (scale up element in CSS)

        const { width, height } = world;
        const { cvs, ctx } = createPixelCanvas();

        cvs.width  = width;
        cvs.height = height;

        const cols = width;
        const rows = height;
        const tileWidth  = Math.round( width  / cols  );
        const tileHeight = Math.round( height / rows );
        let i, l, x, y;

        // don't render the map, for now floodfill the world with green
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect( 0, 0, width, height );
        // outline
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.moveTo( 0, 0 );
        ctx.lineTo( width, 0 );
        ctx.lineTo( width, height );
        ctx.lineTo( 0, height );
        ctx.lineTo( 0, 0 );
        ctx.stroke();

        // render the terrain

        const SX = 2, SY = 2;
        let tx, ty;

        for ( x = 0, y = 0; y < height; x = ( ++x == width ? ( x % width + ( ++y & 0 ) ) : x ) ) {
            const index = y * width + x;
            tx = x * SX;
            ty = y * SY;

            const color = '#F00';

            switch ( world.terrain[ index ] ) {
                case WORLD_TILES.GRASS:
                    continue;
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
            }
            ctx.fillStyle = color;
            ctx.fillRect( x, y, 1, 1 );
        }

        var dotSize = 3;

        // draw caves

        for ( i = 0, l = world.caves.length; i < l; ++i ) {
            const cave = world.caves[ i ];

            x = cave.x * tileWidth;
            y = cave.y * tileHeight;

            ctx.fillStyle = 'rgba(255,0,255,1)';
            ctx.fillRect( x, y, dotSize, dotSize );
        }

        // draw shops

        for ( i = 0, l = world.shops.length; i < l; ++i ) {
            const shop = world.shops[ i ];

            x = shop.x * tileWidth;
            y = shop.y * tileHeight;

            ctx.fillStyle = 'white';
            ctx.fillRect( x, y, dotSize, dotSize );
        }

        // draw enemies

        for ( i = 0, l = world.enemies.length; i < l; ++i ) {
            const enemy = world.enemies[ i ];

            x = enemy.x * tileWidth;
            y = enemy.y * tileHeight;

            ctx.fillStyle = 'red';
            ctx.fillRect( x, y, dotSize, dotSize );
        }

        // draw player

        ctx.fillStyle = 'white';
        dotSize = 7;
        ctx.fillRect(( world.x * tileWidth ) - dotSize / 2, ( world.y * tileHeight ) - dotSize / 2, dotSize, dotSize );

        const out = new Image();
        out.src = cvs.toDataURL( 'image/png' );

        return out;
    }
};
