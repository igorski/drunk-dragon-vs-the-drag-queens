import ItemTypes from "@/definitions/item-types";

/**
 * Here we define the price ranges of products
 * and in what category these prices fall (in dollars)
 */
const PRICE_TYPES =
{
    CHEAP     : 1,
    AVERAGE   : 10,
    MEDIUM    : 25,
    EXPENSIVE : 100,
    LUXURY    : 500
};
export default PRICE_TYPES;

/**
 * Certain items come in different price ranges
 * (e.g. jewelry is more expensive than healthcare)
 */
export const getPriceRangeForItemType = type => {
    switch ( type ) {
        default:
        case ItemTypes.HEALTHCARE:
            return [ PRICE_TYPES.AVERAGE, PRICE_TYPES.EXPENSIVE ];
        case ItemTypes.LIQUOR:
        case ItemTypes.DRUGS:
            return [ PRICE_TYPES.AVERAGE, PRICE_TYPES.EXPENSIVE ];
        case ItemTypes.CLOTHES:
        case ItemTypes.JEWELRY:
            return [ PRICE_TYPES.EXPENSIVE, PRICE_TYPES.LUXURY ];
        case ItemTypes.FOOD:
            return [ PRICE_TYPES.AVERAGE, PRICE_TYPES.MEDIUM ];
    }
};

/**
 * Returns the price type given price falls in
 */
export const getPriceTypeForPrice = price => {
    if ( price < PRICE_TYPES.AVERAGE ) {
        return PRICE_TYPES.CHEAP;
    }
    if ( price < PRICE_TYPES.MEDIUM ) {
        return PRICE_TYPES.AVERAGE;
    }
    if ( price < PRICE_TYPES.EXPENSIVE ) {
        return PRICE_TYPES.MEDIUM;
    }
    if ( price < PRICE_TYPES.LUXURY ) {
        return PRICE_TYPES.EXPENSIVE;
    }
    return PRICE_TYPES.LUXURY;
};

/**
 * Item effectivity is analogous to its price
 * This returns an index in the range of 0 - n which
 * can be mapped to custom "effectivity" Arrays (of n length) per item type
 * (for instance: more expensive liquor is more potent)
 *
 * @see item-actions.js
 */
export const getItemEffectivityByPriceType = ({ price, type }) => {
    const range = getPriceRangeForItemType( type );
    let i = range.length;
    while ( i-- ) {
        const comparePrice = range[ i ];
        if ( price >= comparePrice ) {
            return i;
        }
    }
    return 0;
};
