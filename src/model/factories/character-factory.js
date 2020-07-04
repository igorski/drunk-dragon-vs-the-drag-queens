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
    create( name = 'Foo', inventory = InventoryFactory.create() ) {
        return new Character({ name }, null, inventory );
    },

    /**
     * assemble a serialized JSON structure
     * back into a Character instance
     */
    assemble( data ) {
        return new Character({
            sex: data.s,
            name: data.n,
        }, {
            speed: data.sp,
            intoxication: data.i,
            boost: data.b,
        }, InventoryFactory.assemble( data.iv ));
    },

    /**
     * serializes a Character instance into a JSON structure
     */
    disassemble( character ) {
        const { appearance, properties, inventory } = character;
        return {
            s: appearance.sex,
            n: appearance.name,
            sp: properties.speed,
            i: properties.intoxication,
            b: properties.boost,
            iv: InventoryFactory.disassemble( inventory )
        };
    }
};
export default CharacterFactory;
