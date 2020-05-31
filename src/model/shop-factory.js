import AttackTypes   from '@/definitions/attack-types';
import MedicineTypes from '@/definitions/medicine-types';
import ItemTypes     from '@/definitions/item-types';

export default
{
    /**
     * generate a new Shop
     *
     * @param {number} x position in the world
     * @param {number} y position in the world
     * @param {Array<Object>=} items optional list of shop items
     */
    generateShop( x, y, items = [] )
    {
        return {
            x, y, items
        };
    },

    /**
     * generate given Shops items for given aPlayers level
     *
     * @param {Shop} aShop
     * @param {Player} aPlayer
     */
    generateShopItems( aShop, aPlayer )
    {
        const items = [];

        // always sell basic medicine

        items.push( generateMedicine( aPlayer.level, MedicineTypes.POTION ));

        // additional medicine ?

        if ( aPlayer.level >= 5 )
            items.push( generateMedicine( aPlayer.level ));

        // weapons ?

        if ( aPlayer.XP >= 30 )
        {
            items.push( generateAttack( aPlayer.level, AttackTypes.KNIFE ));

            // additional weapons ?

            if ( aPlayer.level >= 5 )
                items.push( generateAttack( aPlayer.level ));
        }
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

/**
 * @param {number} aLevel the player level
 * @param {number=} aAttackType optional attack type, otherwise
 *                  is calculated from Player level
 *
 * @return {ShopItem}
 */
function generateAttack( aLevel, aAttackType )
{
    const attackValue = typeof aAttackType === 'number' ? aAttackType : AttackTypes.KNIFE;
    let multiplier  = 0;

    if ( typeof aAttackType !== 'number' )
    {
        if ( aLevel >= 5 ) {
            attackValue = AttackTypes.SWORD;
            multiplier   = 1.05;
        }
        else if ( aLevel >= 10 ) {
            attackValue = AttackTypes.AXE;
            multiplier   = 1.1;
        }
    }
    let price = 10;  // base price

    // calculate price

    price += ( aLevel - 1 ) * multiplier;

    return { type: ItemTypes.WEAPON, value: attackValue, price };
}
