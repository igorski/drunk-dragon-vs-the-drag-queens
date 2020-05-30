var AttackTypes = require( "../../definitions/AttackTypes" );
var Attack      = require( "../vo/Attack" );

var AttackFactory = module.exports =
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
    getAttack : function( aAttackType, aCharacter )
    {
        // every five levels attack for punch increases by +1HP

        switch ( aAttackType )
        {
            default:
            case AttackTypes.PUNCH:
                return new Attack( Math.min( Math.ceil( aCharacter.level * .25 ), 3 ), 0, aAttackType );

            case AttackTypes.KNIFE:
                return new Attack( 2, 0, aAttackType );

            case AttackTypes.SWORD:
                return new Attack( 4, 0, aAttackType );
        }
        return null;
    }
};
