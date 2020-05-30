var AttackTypes   = require( "../../definitions/AttackTypes" );
var MedicineTypes = require( "../../definitions/MedicineTypes" );
var ItemTypes     = require( "../../definitions/ItemTypes" );
var Copy          = require( "../../definitions/Copy" );
var Shop          = require( "../vo/Shop" );
var ShopItem      = require( "../vo/ShopItem" );

var ShopFactory = module.exports =
{
    /**
     * generate given Shops items for given aPlayers level
     *
     * @param {Shop} aShop
     * @param {Player} aPlayer
     */
    generateShopItems : function( aShop, aPlayer )
    {
        var items = [];

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

/**
 * @protected
 *
 * @param {number} aLevel the player level
 * @param {number=} aMedicineType optional medicine type, otherwise
 *                  is calculated from Player level
 *
 * @return {ShopItem}
 */
function generateMedicine( aLevel, aMedicineType )
{
    var medicineValue = typeof aMedicineType === "number" ? aMedicineType : MedicineTypes.POTION;
    var multiplier    = 0;

    if ( typeof aMedicineType !== "number" )
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
    var price = 5;  // base price

    // calculate price

    price += ( aLevel - 1 ) * multiplier;

    return new ShopItem( ItemTypes.MEDICINE, medicineValue, price );
}

/**
 * @protected
 *
 * @param {number} aLevel the player level
 * @param {number=} aAttackType optional attack type, otherwise
 *                  is calculated from Player level
 *
 * @return {ShopItem}
 */
function generateAttack( aLevel, aAttackType )
{
    var attackValue = typeof aAttackType === "number" ? aAttackType : AttackTypes.KNIFE;
    var multiplier  = 0;

    if ( typeof aAttackType !== "number" )
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
    var price = 10;  // base price

    // calculate price

    price += ( aLevel - 1 ) * multiplier;

    return new ShopItem( ItemTypes.WEAPON, attackValue, price );
}
