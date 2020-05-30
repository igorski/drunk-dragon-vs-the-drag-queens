/**
 * Created by izinken on 25/03/15.
 */
var ImageUtil = module.exports =
{
    /**
     * a quick query to check whether the Image is ready for rendering
     *
     * @public
     *
     * @param {Image} aImage
     * @return {boolean}
     */
    isReady : function( aImage )
    {
        // IE (should be supported by most browsers bar Gecko)

        if ( !aImage.complete ) {
            return false;
        }

        if ( typeof aImage.naturalWidth !== "undefined" && aImage.naturalWidth === 0 ) {
            return false;
        }

        return aImage.src && aImage.src !== "";
    },

    /**
     * XE-10117 All easy.Image operations are synchronous, except on Safari
     * where occassionally the Image is not actually ready while it should.
     *
     * @public
     *
     * @param {Image} aImage
     * @param {!Function} aCallback
     */
    onReady : function( aImage, aCallback )
    {
        var MAX_ITERATIONS = 255, iterations = 0;

        function readyCheck()
        {
            if ( ImageUtil.isReady( aImage ) ||
                ++iterations === MAX_ITERATIONS )
            {
                aCallback();
            }
            else {
                requestAnimationFrame( readyCheck );
            }
        }
        readyCheck();
    }
};
