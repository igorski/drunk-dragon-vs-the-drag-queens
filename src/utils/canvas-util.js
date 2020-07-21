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
