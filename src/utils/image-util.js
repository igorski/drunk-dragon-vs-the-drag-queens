const ImageUtil =
{
    /**
     * a quick query to check whether the Image is ready for rendering
     *
     * @param {Image} image
     * @return {Boolean}
     */
    isReady( image ) {
        // IE (should be supported by most browsers bar Gecko)

        if ( !image.complete ) {
            return false;
        }

        if ( typeof image.naturalWidth !== 'undefined' && image.naturalWidth === 0 ) {
            return false;
        }
        return image.src && image.src !== '';
    },

    /**
     * @param {Image} image
     * @param {!Function} callback
     */
    onReady( image, callback ) {
        const MAX_ITERATIONS = 255;
        let iterations = 0;

        function readyCheck() {
            if ( ImageUtil.isReady( image ) ||
                ++iterations === MAX_ITERATIONS ) {
                callback();
            }
            else {
                window.requestAnimationFrame( readyCheck );
            }
        }
        callback();
    }
};
export default ImageUtil;
