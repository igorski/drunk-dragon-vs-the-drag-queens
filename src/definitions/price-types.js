/**
 * Here we define the price ranges of products
 * and in what category these prices fall (in dollars)
 */
const PRICE_TYPES =
{
    CHEAP     : 1,
    AVERAGE   : 10,
    EXPENSIVE : 100,
    LUXURY    : 1000
};
export default PRICE_TYPES;

/**
 * Item effectivity is analogous to its price
 * This returns an index in the range of 0 - 3 which
 * can be mapped to custom "effectivity" Arrays per item type
 */
export const getItemEffectivityByPriceType = price => {
    if ( price < PRICE_TYPES.AVERAGE ) {
        return 0;
    }
    if ( price < PRICE_TYPES.EXPENSIVE ) {
        return 1;
    }
    if ( price < PRICE_TYPES.LUXURY ) {
        return 2;
    }
    return 3;
};
