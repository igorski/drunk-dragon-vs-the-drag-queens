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
            transformed = highlyIntoxicated ? `${transformed}sss` : `${transformed}s`
        } else if ( transformed !== word ) {
            transformed = `${transformed}${last}`;
        }
        out.push( transformed );
    });
    let ret = out.join( " " );
        if ( highlyIntoxicated ) {
        replacements.forEach(([ key, replacement ]) => {
            ret = ret.split( key ).join( replacement );
        });
    }
    return ret.charAt( 0 ).toUpperCase() + ret.slice( 1 );
};

// TODO: these are very English centered

const replacements = [
    [ "what the", "wadda" ],
    [ "ter", "'er'" ],
    [ "ing", "in'" ],
    [ "I'm", "Imma" ],
    [ "ai", "ey" ],
    [ "'ll'", "'lll'" ]
];
