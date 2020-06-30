import Random           from 'random-seed';
import AttackTypes      from '@/definitions/attack-types';
import Character        from '@/model/character';
import AttackFactory    from '@/model/factories/attack-factory';
import InventoryFactory from '@/model/factories/inventory-factory';

const CharacterFactory =
{
    /**
     * Creates a new Character. A Character is the base definition for
     * any actor (e.g. enemy, player) in the game.
     *
     * @param {string=} name
     * @param {Object=} inventory
     */
    createCharacter( name = 'Foo', inventory = InventoryFactory.createInventory() ) {
        return new Character({ name }, null, inventory );
    },

    // TODO: the below should be Character methods

    /**
     * returns an Attack describing the type of attack
     * and the damage dealt to the players HP
     * Note: can be null if attack preparation failed (e.g. Character
     * is confused / dizzy / etc.)
     *
     * @param {Object} character to create attack for
     * @param {string=} attackType what type of attack to execute
     * @return {Object|null}
     */
    attack( character, attackType ) {
        const rand = Random.create();

        if ( rand.intBetween( 0, 10 ) === 0 )
            return null;

        // TODO : randomize attack type even further in case of item (confusion, dizzy, etc. to miss)

        return AttackFactory.getAttack( attackType || AttackTypes.PUNCH, character );
    },

    /**
     * invoked whenever this Character is attacked by its Opponent
     *
     * @param {Object} character receiving damage
     * @param {Object} attack inflicted on given character
     * @return {boolean} whether the attack was successful
     */
    collect( character, attack ) {
        // can be null if attack preparation failed
        if ( !attack )
            return false;

        // TODO : randomize in case of defend or item (shield for less damage, etc.)

        if ( !character.isDefending ) {
            character.HP = Math.max( 0, character.HP - attack.power );
            return true;
        }
        character.isDefending = false;   // reset for next turn
        return false;
    },

    /**
     * query whether given Character is still alive and can continue battling
     *
     * @param {Object} character
     * @return {boolean}
     */
    isAlive( character ) {
        return character.HP > 0;
    }
};
export default CharacterFactory;
