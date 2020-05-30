/**
 * Created by IntelliJ IDEA.
 * User: igor.zinken
 * Date: 17-10-11
 * Time: 10:06
 */
var SocialSharer = module.exports =
{
    /**
     * creates a deeplink to a given page for Facebook using the new sharer
     * allowing us to format the meta data directly
     *
     * @public
     *
     * @param aURL         {String} URL to the page
     * @param aTitle       {String} title of the page
     * @param aDescription {String} description of the page, max. 400 chars
     * @param aImages      {String/Array.<String>=} optional: either a single String containing an image path
     *                     or an Array containing image path Strings.
     */
    facebook : function( aURL, aTitle, aDescription, aImages )
    {
        var theURL = "https://www.facebook.com/sharer/sharer.php?s=100";

        if ( aURL.indexOf( "#" ) > -1 )
        {
            aURL = aURL.replace( "#", "?deeplink=" );
        }

        theURL += "&p[url]="     + aURL;
        theURL += "&p[title]="   + aTitle;
        theURL += "&p[summary]=" + aDescription.split( " " ).join( "+" );

        if ( aImages )
        {
            var theImages;

            if ( aImages instanceof Array )
            {
                theImages = aImages;
            }
            else
            {
                theImages = [ aImages ];
            }
            for ( var i = 0; i < theImages.length; ++i )
            {
                theURL += "&p[images][" + i + "]=" + theImages[ i ];
            }
        }
        window.open( encodeURI( theURL ));
    },

    /**
     * regular Facebook share method (reads page META
     * to show in Facebook feed)
     *
     * @public
     *
     * @param {string} aURL
     * @param {string} aText
     */
    facebookShare : function( aURL, aText )
    {
        window.open( "http://www.facebook.com/share.php?u=" + aURL + "&t=" + aText, "_blank" );
    },

    /**
     * post a message to Twitter
     *
     * @public
     *
     * @param {String} aURL
     * @param {String} aText
     */
    twitter : function( aURL, aText )
    {
        window.open( "http://twitter.com/share?url=" + encodeURI( aURL ) + "&text=" + encodeURI( aText ), "_blank" );
    },

    /**
     * post a message to Google+
     *
     * @public
     * @param {String} aURL
     */
    googlePlus : function( aURL )
    {
        window.open( "https://plus.google.com/share?url=" + aURL, "_blank" );
    }
};
