import ItemTypes     from '@/definitions/item-types';
import AttackTypes   from '@/definitions/attack-types';
import MedicineTypes from '@/definitions/medicine-types';
import Random        from 'random-seed';

export default
{
    generateItem()
    {
        const rand = Random.create();
        const type = rand.intBetween( 0, Object.keys( ItemTypes ).length - 1 );

        return { type, value: ItemFactory.generateItemValue( item ) };
    },

    /**
     * get the localized name for a given item
     *
     * @param {Item|ShopItem} aItem
     * @return {string}
     */
    getItemName({ type })
    {
        switch ( type )
        {
            case ItemTypes.WEAPON:
                return Copy.ITEMS[ aItem.type ] + ' '' + Copy.WEAPONS[ aItem.value ] + ''';
                break;

            case ItemTypes.MEDICINE:
                return Copy.ITEMS[ aItem.type ] + ' '' + Copy.MEDICINE[ aItem.value ] + ''';
                break;
        }
    },

    generateItemValue({ type })
    {
        switch ( type )
        {
            // weapon, value is AttackType

            case ItemTypes.WEAPON:

                const types = [
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
     * @param {Item} aItem
     * @param {Player} aPlayer
     * @return {number}
     */
    generateItemPrice({ type }, aPlayer )
    {
        let price = 1;

        switch ( type )
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
     * @param {Item} aItem
     * @param {Player} aPlayer
     */
    applyItem({ type, value }, aPlayer )
    {
        switch ( type )
        {
            // apply medicine

            case ItemTypes.MEDICINE:

                let multiplier = .2;

                switch ( value )
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
                const extraHP = Math.round( aPlayer.maxHP * multiplier );
                aPlayer.HP    = Math.min( aPlayer.maxHP, aPlayer.HP + extraHP );

                break;
        }
    }
};
