import AttackTypes from '@/definitions/attack-types';

export default
{
    /**
     * create an appropriate attack for the given type
     * taking the given players properties into account
     * if the attack cannot be executed (for instance :
     * its cost is higher than the player can provide
     * or the player is dizzy, confused, etc...)
     * null is returned
     *
     * @param {number} aAttackType
     * @param {Character} aCharacter
     */
    getAttack( aAttackType, aCharacter )
    {
        // every five levels attack for punch increases by +1HP

        switch ( aAttackType )
        {
            default:
            case AttackTypes.PUNCH:
                return createAttack( Math.min( Math.ceil( aCharacter.level * .25 ), 3 ), 0, aAttackType );

            case AttackTypes.KNIFE:
                return createAttack( 2, 0, aAttackType );

            case AttackTypes.SWORD:
                return createAttack( 4, 0, aAttackType );
        }
        return null;
    }
};

/**
 * Attack describes a single attack, it has power (depletes
 * enemy HP), has a cost (requires MP) and a type (enumerated
 * in AttackTypes)
 *
 * @param {number} power
 * @param {number} cost
 * @param {string} type
 */
 function createAttack( power, cost, type ) {
     return { power, cost, type };
 }
