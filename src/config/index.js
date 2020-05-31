/**
 * calculate the base URL the application is running on, this is
 * used to resolve assets, not application paths for social sharing
 *
 * @return {string}
 */
export const getBaseURL = () => {
    const { href } = window.location;

    if ( href.includes( 'igorski.nl' )) {
        return 'https://www.igorski.nl/assets/applications/rpg/';
    }
    return './';
}
