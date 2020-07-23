import MedicineTypes from '@/definitions/medicine-types';
import ItemTypes     from '@/definitions/item-types';
import WorldCache    from '@/utils/world-cache';

export default
{
    /**
     * generate a new Shop
     *
     * @param {number} x position in the world
     * @param {number} y position in the world
     * @param {Array<Object>=} items optional list of shop items
     */
    create( x, y, items = [] ) {
        const { width, height } = WorldCache.sizeShop;
        return {
            x, y, width, height, items
        };
    },

    /**
     * generate given Shops items for given aPlayers level
     *
     * @param {Shop} aShop
     * @param {Player} aPlayer
     */
    generateShopItems( aShop, aPlayer ) {
        const items = [];

        // always sell basic medicine

        items.push( generateMedicine( aPlayer.level, MedicineTypes.POTION ));

        // additional medicine ?

        aShop.items = items;
    }
};

/* internal methods */

/**
 * @param {number} aLevel the player level
 * @param {number=} aMedicineType optional medicine type, otherwise
 *                  is calculated from Player level
 *
 * @return {ShopItem}
 */
function generateMedicine( aLevel, aMedicineType )
{
    const medicineValue = typeof aMedicineType === 'number' ? aMedicineType : MedicineTypes.POTION;
    let multiplier    = 0;

    if ( typeof aMedicineType !== 'number' )
    {
        if ( aLevel >= 5 ) {
            medicineValue = MedicineTypes.MEDIKIT;
            multiplier   = 1.05;
        }
        else if ( aLevel >= 10 ) {
            medicineValue = MedicineTypes.FULL_POWER;
            multiplier   = 1.1;
        }
    }
    let price = 5;  // base price

    // calculate price

    price += ( aLevel - 1 ) * multiplier;

    return { type: ItemTypes.MEDICINE, value: medicineValue, price };
}
