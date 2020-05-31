export default
{
    /**
     * creates a deeplink to a given page for Facebook using the new sharer
     * allowing us to format the meta data directly
     *
     * @param aURL         {String} URL to the page
     * @param aTitle       {String} title of the page
     * @param aDescription {String} description of the page, max. 400 chars
     * @param aImages      {String/Array<String>=} optional: either a single String containing an image path
     *                     or an Array containing image path Strings.
     */
    facebook( aURL, aTitle, aDescription, aImages ) {
        let theURL = 'https://www.facebook.com/sharer/sharer.php?s=100';

        if ( aURL.includes( '#' )) {
            aURL = aURL.replace( '#', '?deeplink=' );
        }

        theURL += '&p[url]='     + aURL;
        theURL += '&p[title]='   + aTitle;
        theURL += '&p[summary]=' + aDescription.split( ' ' ).join( '+' );

        if ( aImages ) {
            let theImages;

            if ( aImages instanceof Array ) {
                theImages = aImages;
            }
            else {
                theImages = [ aImages ];
            }
            for ( let i = 0; i < theImages.length; ++i ) {
                theURL += '&p[images][' + i + ']=' + theImages[ i ];
            }
        }
        window.open( encodeURI( theURL ));
    },
    /**
     * regular Facebook share method (reads page META to show in Facebook feed)
     *
     * @param {string} aURL
     * @param {string} aText
     */
    facebookShare( aURL, aText ) {
        window.open( 'http://www.facebook.com/share.php?u=' + aURL + '&t=' + aText, '_blank' );
    },
    /**
     * post a message to Twitter
     *
     * @param {String} aURL
     * @param {String} aText
     */
    twitter( aURL, aText ) {
        window.open( 'http://twitter.com/share?url=' + encodeURI( aURL ) + '&text=' + encodeURI( aText ), '_blank' );
    },
};
