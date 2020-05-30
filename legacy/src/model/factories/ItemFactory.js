var ItemTypes     = require( "../../definitions/ItemTypes" );
var AttackTypes   = require( "../../definitions/AttackTypes" );
var MedicineTypes = require( "../../definitions/MedicineTypes" );
var Copy          = require( "../../definitions/Copy" );
var Item          = require( "../vo/Item" );
var Random        = require( "random-seed" );

var ItemFactory = module.exports =
{
    generateItem : function()
    {
        var rand = Random.create();
        var item = rand.intBetween( 0, Object.keys( ItemTypes ).length - 1 );

        return new Item( item, ItemFactory.generateItemValue( item ));
    },

    /**
     * get the localized name for a given item
     *
     * @public
     *
     * @param {Item|ShopItem} aItem
     * @return {string}
     */
    getItemName : function( aItem )
    {
        switch ( aItem.type )
        {
            case ItemTypes.WEAPON:
                return Copy.ITEMS[ aItem.type ] + " '" + Copy.WEAPONS[ aItem.value ] + "'";
                break;

            case ItemTypes.MEDICINE:
                return Copy.ITEMS[ aItem.type ] + " '" + Copy.MEDICINE[ aItem.value ] + "'";
                break;
        }
    },

    generateItemValue : function( aItemType )
    {
        switch ( aItemType )
        {
            // weapon, value is AttackType

            case ItemTypes.WEAPON:

                var types = [
                    AttackTypes.KNIFE,
                    AttackTypes.SWORD
                ];
                return types[ Random.create().intBetween( 0, types.length - 1 )];
                break;

            // medicine, value is MedicineType

            case ItemTypes.MEDICINE:
                return MedicineTypes.POTION;
                break;
        }
    },

    /**
     * generate a price for a given Item for given aPlayers level
     *
     * @public
     *
     * @param {Item} aItem
     * @param {Player} aPlayer
     * @return {number}
     */
    generateItemPrice : function( aItem, aPlayer )
    {
        var price = 1;

        switch ( aItem.type )
        {
            case ItemTypes.WEAPON:
                price  = price + ( AttackTypes[ Object.keys( AttackTypes )[ aItem.value ]] / aPlayer.level );
                price *= 3;
                break;

            case ItemTypes.MEDICINE:
                price  = price + ( MedicineTypes[ Object.keys( MedicineTypes )[ aItem.value ]] / aPlayer.level );
                price *= 3;
                break;
        }
        return price;
    },

    /**
     * apply given aItem onto given aPlayer
     *
     * @public
     *
     * @param {Item} aItem
     * @param {Player} aPlayer
     */
    applyItem : function( aItem, aPlayer )
    {
        switch ( aItem.type )
        {
            // apply medicine

            case ItemTypes.MEDICINE:

                var multiplier = .2;

                switch ( aItem.value )
                {
                    default:
                    case MedicineTypes.POTION:
                        multiplier = .3;
                        break;

                    case MedicineTypes.MEDIKIT:
                        multiplier = .5;
                        break;

                    case MedicineTypes.FULL_POWER:
                        multiplier = 1;
                        break;
                }
                var extraHP = Math.round( aPlayer.maxHP * multiplier );
                aPlayer.HP  = Math.min( aPlayer.maxHP, aPlayer.HP + extraHP );

                break;
        }
    }
};
