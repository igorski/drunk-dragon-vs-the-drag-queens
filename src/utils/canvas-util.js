/**
 * Creates an instance of an HTMLCanvasElement that
 * is configured for pixel art style crispness
 */
export const createPixelCanvas = ( width, height ) => {
    const cvs = document.createElement( 'canvas' );
    const ctx = cvs.getContext( '2d' );

    cvs.width  = width;
    cvs.height = height;

    const props = [
        'imageSmoothingEnabled',  'mozImageSmoothingEnabled',
        'oImageSmoothingEnabled', 'webkitImageSmoothingEnabled'
    ];
    props.forEach( prop => {
        if ( ctx[ prop ] !== undefined )
            ctx[ prop ] = false;
    });
    ctx.imageSmoothingEnabled = false;

    return { cvs, ctx };
};

/**
 * Replaces all the RED pixels inside given image with pixels
 * of given colorToFillInHex
 *
 * @param {HTMLImageElement} image
 * @param {String} colorToFillInHex
 * @return {HTMLCanvasElement} as it is a drawable
 */
export const changeImageColor = ( image, colorToFillInHex ) => {
    const { width, height } = image;
    const { cvs, ctx }      = createPixelCanvas( width, height );
    const { r, g, b}        = hexToRgb( colorToFillInHex );

    ctx.drawImage( image, 0, 0 );
    const data   = ctx.getImageData( 0, 0, width, height );
    const pixels = data.data;

    // loop through RGBA values
    for ( let i = 0; i < pixels.length; i += 4 ) {
        const red   = pixels[ i ];
        const green = pixels[ i + 1 ];
        const blue  = pixels[ i + 2 ];
        const alpha = pixels[ i + 3 ];

        if ( red === 255 && green === 0 && blue === 0 && alpha === 255 ) {
            pixels[ i ]     = r;
            pixels[ i + 1 ] = g;
            pixels[ i + 2 ] = b;
        }
    }
    ctx.putImageData( data, 0, 0 );
    return cvs;
};

/* internal methods */

function hexToRgb( hex ) {
    const value = parseInt( hex.replace( '#', '' ), 16 );
    const r = ( value >> 16 ) & 255;
    const g = ( value >> 8 )  & 255;
    const b = value & 255;

    return { r, g, b };
}
