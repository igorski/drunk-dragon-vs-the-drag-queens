/**
 * Fail an assertion with a custom message when in development mode, when
 * in production mode, this will fail gracefully.
 */
function fail( msg ) {
    if ( process.env.NODE_ENV !== "production" ) {
        throw new Error( msg );
    }
    return false;
}

export const validateProperties = properties => {
    // these are expected to be within 0 - 1 range
    [ "intoxication", "boost" ].forEach(prop => {
        const value = properties[ prop ];
        if ( typeof value !== "number" || ( value < 0 || value > 1 )) {
            return fail( `Property ${prop} should be in 0 - 1 range` );
        }
    });
    if ( typeof properties.speed !== "number" || properties.speed < 0 ) {
        return fail( "Speed should be a positive number" );
    }
    return true;
};

export const validateInventory = inventory => {
    if ( typeof inventory.cash !== "number" ) {
        return fail( `Expected cash to be a numerical value, got ${typeof inventory.cash} instead` );
    }
    if ( !Array.isArray( inventory.items )) {
        return fail( `Expected items to be Array, got ${typeof inventory.items} instead` );
    }
    return true;
};
