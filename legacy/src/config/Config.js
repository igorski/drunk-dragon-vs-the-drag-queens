/**
 * Created by igorzinken on 09-03-15.
 */
var Config = module.exports =
{
    /**
     * calculate the base URL the application is running on, is
     * used to resolve assets NOT for sharing purposes !
     *
     * @public
     * @return {string}
     */
    getBaseURL : function()
    {
        var url = window.location.href;

        // TODO :

        if ( url.indexOf( "igorski.nl" ) > -1 )
            return "https://www.igorski.nl/assets/applications/rpg/";

        return "./";
    }
};
