import Random           from 'random-seed';
import InventoryFactory from '@/model/factories/inventory-factory';
import { validateAppearance, validateProperties } from '../validator';

const CharacterFactory =
{
     /**
      * A Character is the base actor for everything human.
      * A Character is constructed with a series of properties that determines
      * their visual appearance, a series of properties that affects their
      * performance (e.g. speed, accuracy) and an inventory.
      */
     create( appearance = {}, properties = {},  inventory = InventoryFactory.create() ) {
         const character = {
             appearance: {
                 sex: 'F', // it's the 80's, gender identity wasn't in vogue and sex is binary ;)
                 name: 'Derp',
                 ...appearance
             },
             // all in percentile range (e.g. 0-1)
             properties: {
                 speed: 1,
                 intoxication: 0,
                 boost: 0,
                 ...properties
             },
             inventory
         };
         validateAppearance( character.appearance );
         validateProperties( character.properties );

         return character;
    },

    /**
     * assemble a serialized JSON structure
     * back into a Character instance
     */
    assemble( data ) {
        return CharacterFactory.create({
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
