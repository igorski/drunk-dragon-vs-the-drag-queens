export const createPixelCanvas = () => {
    const cvs = document.createElement( 'canvas' );
    const ctx = cvs.getContext( '2d' );

    const props = [
        'imageSmoothingEnabled',  'mozImageSmoothingEnabled',
        'oImageSmoothingEnabled', 'webkitImageSmoothingEnabled'
    ];
    props.forEach( prop => {
        if ( ctx[ prop ] !== undefined )
            ctx[ prop ] = false;
    });
    return { cvs, ctx };
};
