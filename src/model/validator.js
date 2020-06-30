/**
 * Fail an assertion with a custom message when in development mode, when
 * in production mode, this will fail gracefully.
 */
function fail( msg ) {
    if (process.env.NODE_ENV !== 'production') {
        throw new Error( msg );
    }
    return false;
};

export const validateAppearance = appearance => {
    // these should be valid enumerations
    if (!['M', 'F'].includes( appearance.sex )) {
        return fail( 'Invalid sex specified' );
    }
    return true;
};

export const validateProperties = properties => {
    // these are expected to be within 0 - 1 range
    [ 'speed', 'intoxication', 'boost' ].forEach(prop => {
        const value = properties[ prop ];
        if ( typeof value !== 'number' || ( value < 0 || value > 1 )) {
            return fail( `Property ${prop} should be in 0 - 1 range` );
        }
    });
    return true;
};

export const validateInventory = inventory => {
    if ( typeof inventory.cash !== 'number' ) {
        return fail( `Expected cash to be a numerical value, got ${typeof inventory.cash} instead` );
    }
    if ( !Array.isArray( inventory.jewelry )) {
        return fail( `Expected jewelry to be Array, got ${typeof inventory.jewelry} instead` );
    }
    return true;
};
