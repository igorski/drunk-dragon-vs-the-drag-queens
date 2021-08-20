/**
 * Adjust text to make you sound as intoxicated as you are!
 * TODO: there are some assumptions about English at the end.
 */
export const slurWords = ( text, intoxication = 0 ) => {
    if ( intoxication <= 0.25 ) {
        return text;
    }
    const words = text.split( " " );
    const out   = [];

    const highlyIntoxicated = intoxication > 0.65;

    words.forEach( word => {
        const first  = word.charAt( 0 ).toLowerCase();
        const last   = word.charAt( word.length - 1 ).toLowerCase();
        const middle = word.substring( 1, word.length - 1 );
        let transformed = word;

        if ( first === "s" ) {
            transformed = highlyIntoxicated ? `zss${middle}` : `zs${middle}`;
        }
        if ( last === "s" ) {
            transformed = highlyIntoxicated ? `${transformed}ss` : `${transformed}s`
        } else if ( transformed !== word ) {
            transformed = `${transformed}${last}`;
        }
        out.push( transformed );
    });
    let ret = out.join( " " );
        if ( highlyIntoxicated ) {
        SLUR_REPLACEMENTS.forEach(([ key, replacement ]) => {
            ret = ret.split( key ).join( replacement );
        });
    }
    return ret.charAt( 0 ).toUpperCase() + ret.slice( 1 );
};

/**
 * Formats a value in 0 - 1 range as a percentile String
 */
export const formatPercentage = number => parseFloat(( number * 100 ).toFixed( 2 ).replace( ".00", "" ));

/* internal properties */

// TODO: these are very English centered

const SLUR_REPLACEMENTS = [
    [ "what the", "wadda" ],
    [ "ter", "'er'" ],
    [ "ing", "in'" ],
    [ "I'm", "Imma" ],
    [ "ai", "ey" ],
    [ "'ll'", "'lll'" ],
    [ "Th", "Th-th" ],
    [ "ou", "ew" ]
];
