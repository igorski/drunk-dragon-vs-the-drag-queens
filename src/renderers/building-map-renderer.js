import { BUILDING_TILES }    from "@/model/factories/building-factory";
import { coordinateToIndex } from "@/utils/terrain-util";
import { createPixelCanvas } from "@/utils/canvas-util";

/**
 * @param {Object} environment (is building floor)
 * @param {number} targetWidth the target width of the resulting Image
 * @return {Image}
 */
export default function( environment, targetWidth ) {
    const { width : cols, height : rows, terrain } = environment;

    const targetHeight = targetWidth * rows / cols;
    const { cvs, ctx } = createPixelCanvas( targetWidth, targetHeight );
    let x, y;

    // floodfill the background with black
    ctx.fillStyle = "#000";
    ctx.fillRect( 0, 0, targetWidth, targetHeight );

    // outline
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo( 0, 0 );
    ctx.lineTo( targetWidth, 0 );
    ctx.lineTo( targetWidth, targetHeight );
    ctx.lineTo( 0, targetHeight );
    ctx.lineTo( 0, 0 );
    ctx.stroke();

    let tx, ty, color, tileWidth, tileHeight;
    let rendered = 0;

    for ( x = 0, y = 0; y < rows; x = ( ++x == cols ? ( x % cols + ( ++y & 0 ) ) : x )) {
        const index = coordinateToIndex( x, y, { width: cols });

        if ( !environment.visitedTerrain.includes( index )) {
            continue; // only render visited tiles
        }

        ++rendered;

        tx = Math.round( x * tileWidth );
        ty = Math.round( y * tileHeight );

        tileWidth  = Math.round( targetWidth  / cols );
        tileHeight = Math.round( targetHeight / rows );

        color = "#F00";

        switch ( terrain[ index ] ) {
            case BUILDING_TILES.NOTHING:
                continue;

            case BUILDING_TILES.GROUND:
                color = "#0066FF";
                break;

            case BUILDING_TILES.WALL:
                color = "#AAA";
                break;

            case BUILDING_TILES.STAIRS:
                color = "#FF00FF";
                tileWidth = tileHeight = 4;
                break;
        }
        ctx.fillStyle = color;
        ctx.fillRect(
            tx - ( Math.floor( tileWidth / 2 )),
            ty - ( Math.floor( tileHeight / 2 )),
            tileWidth, tileHeight
        );
    }

    // draw hotels

    const { hotels } = environment;

    drawItems( ctx, environment, hotels, 4, tileWidth, tileHeight, "purple" );

    // draw player

    ctx.fillStyle = "white";
    const dotSize = 4;
    ctx.fillRect(
        ( environment.x * tileWidth )  - dotSize / 2,
        ( environment.y * tileHeight ) - dotSize / 2,
        dotSize, dotSize
    );
    return { src: cvs.toDataURL( "image/png" ), rendered };
};

function drawItems( ctx, environment, items, size, tileWidth, tileHeight, color ) {
    items.forEach(({ x, y }) => {
        const tx = x * tileWidth;
        const ty = y * tileHeight;

        const index = coordinateToIndex( tx, ty, environment);
        if ( !environment.visitedTerrain.includes( index )) {
            return; // only render visited items
        }
        ctx.fillStyle = color;
        ctx.fillRect( tx, ty, size, size );
    });
}
