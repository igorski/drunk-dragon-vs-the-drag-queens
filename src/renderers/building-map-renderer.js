import { BUILDING_TILES } from '@/model/factories/building-factory';
import { createPixelCanvas } from '@/utils/canvas-util';

export default
{
    /**
     * @param {Object} building
     * @param {number=} magnification optional magnification to grow / shrink
     *        the total map size
     *
     * @return {Image}
     */
    render( building, magnification = 1 ) {
        // TODO : use magnification (scale up element in CSS)

        const floor = building.floors[ building.floor ];

        const { width, height, terrain } = floor;
        const { cvs, ctx } = createPixelCanvas();

        cvs.width  = width;
        cvs.height = height;

        let x, y;

        // don't render the map, for now floodfill the world with black
        ctx.fillStyle = 'rgba(0,0,0,1)';
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

        const SX = 2, SY = 2;
        let tx, ty, color, tileWidth, tileHeight;

        for ( x = 0, y = 0; y < height; x = ( ++x == width ? ( x % width + ( ++y & 0 ) ) : x )) {
            const index = y * width + x;
            tx = x * SX;
            ty = y * SY;

            color = '#F00';
            tileWidth = tileHeight = 1;

            switch ( terrain[ index ] )
            {
                case BUILDING_TILES.NOTHING:
                    continue;
                    break;

                case BUILDING_TILES.GROUND:
                    color = '#0066FF';
                    break;

                case BUILDING_TILES.WALL:
                    color = '#AAA';
                    break;

                case BUILDING_TILES.TUNNEL:
                    color = '#FF00FF';
                    tileWidth = tileHeight = 3;
                    break;
            }
            ctx.fillStyle = color;
            ctx.fillRect( x - ( Math.floor( tileWidth / 2 )), y - ( Math.floor( tileHeight / 2 )), tileWidth, tileHeight );
        }

        // draw player

        ctx.fillStyle = 'white';
        const dotSize = 3;
        ctx.fillRect(
            ( building.x * tileWidth ) - dotSize / 2,
            ( building.y * tileHeight ) - dotSize / 2,
            dotSize, dotSize
        );
        const out = new Image();
        out.src = cvs.toDataURL( 'image/png' );

        return out;
    }
};
