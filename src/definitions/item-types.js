/**
 * All different types of item a Character can carry
 * in their Inventory.
 *
 * NOTE: because we're lazy all String values are also used
 * as identifiers for i18n and assets !
 *
 * @see ItemFactory, IntentFactory
 */
export default {
    JEWELRY    : 0,
    CLOTHES    : 1,
    LIQUOR     : 2,
    HEALTHCARE : 3
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
