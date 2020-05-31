/**
 * HashUtil contains convenience methods to use the game's unique hash
 * values to generate numerical values (to be used when generating the world)
 */
const HashUtil =
{
    // convenience methods to turn (parts of) the worlds String hash into numerical values

    charsToNum( characters ) {
        let num = 0;
        for ( let i = 0, l = characters.length; i < l; ++i ) {
            num += HashUtil.charToNum( characters.charAt( i ));
        }
        return num;
    },
    charToNum( character ) {
        return parseInt( character, 16 );
    }
};

export default HashUtil;
