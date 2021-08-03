/**
 * All different types of item a Character can carry
 * in their Inventory.
 *
 * NOTE: because we're lazy all String values are also used
 * as identifiers for i18n and assets !
 *
 * @see ItemFactory, IntentFactory
 */
const ItemTypes = {
    JEWELRY    : 0,
    CLOTHES    : 1,
    LIQUOR     : 2,
    HEALTHCARE : 3
};
export default ItemTypes;

export const namesForType = type => {
    switch ( type ) {
        case ItemTypes.JEWELRY:
            return JEWELRY_TYPES;
        case ItemTypes.LIQUOR:
            return LIQUOR_TYPES;
        case ItemTypes.HEALTCHARE:
            return HEALTHCARE_TYPES;
        case ItemTypes.CLOTHES:
            return CLOTHING_TYPES;
    }
    return [];
};

export const getItemsForType = type => {
    switch ( type ) {
        default:
        case ItemTypes.HEALTHCARE:
            return HEALTHCARE_TYPES;
        case ItemTypes.CLOTHES:
            return CLOTHING_TYPES;
        case ItemTypes.JEWELRY:
            return JEWELRY_TYPES;
        case ItemTypes.LIQUOR:
            return LIQUOR_TYPES;
    }
};

/* jewelry */

export const JEWELRY_NECKLACE = "necklace";
export const JEWELRY_BRACELET = "bracelet";
export const JEWELRY_RING     = "ring";
export const JEWELRY_TYPES    = [ JEWELRY_NECKLACE, JEWELRY_BRACELET, JEWELRY_RING ];

/* clothing */

export const SHOE_HEELS    = "heels";
export const SHOE_SNEAKERS = "sneakers";
export const SHOE_FLIPPERS = "flippers";
export const SHOE_TYPES    = [ SHOE_HEELS, SHOE_SNEAKERS, SHOE_FLIPPERS ];

export const CLOTHING_TYPES = [ ...SHOE_TYPES ];

/* liquor */

export const LIQUOR_WINE   = "wine";
export const LIQUOR_GIN    = "gin";
export const LIQUOR_COGNAC = "cognac";
export const LIQUOR_TYPES =  [ LIQUOR_WINE, LIQUOR_GIN, LIQUOR_COGNAC ];

/* healthcare */

export const HEALTHCARE_BANDAID = "bandaid";
export const HEALTHCARE_ASPIRIN = "aspirin";
export const HEALTHCARE_TYPES   = [ HEALTHCARE_BANDAID, HEALTHCARE_ASPIRIN ];
