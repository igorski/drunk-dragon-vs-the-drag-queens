import Random           from 'random-seed';
import InventoryFactory from '@/model/factories/inventory-factory';
import { validateAppearance, validateProperties } from '../validator';

const FEMALE_HAIR_TOTAL    = 7;
const FEMALE_JEWELRY_TOTAL = 5;
const FEMALE_EYE_TOTAL     = 3;
const FEMALE_MOUTH_TOTAL   = 4;
const FEMALE_CLOTHES_TOTAL = 1;

export const SKIN_COLORS = [ /*'#FFDBAC',*/ '#F1C27D', '#E0AC69', '#C68642', '#8D5524' ];
export const FEMALE_APPEARANCE = {
    skin: SKIN_COLORS.length,
    hair: FEMALE_HAIR_TOTAL,
    jewelry: FEMALE_JEWELRY_TOTAL,
    eyes: FEMALE_EYE_TOTAL,
    mouth: FEMALE_MOUTH_TOTAL,
    clothes: FEMALE_CLOTHES_TOTAL,
};

const randomValue = total => {
    const rand = Random.create();
    return rand.intBetween( 0, total - 1 );
};

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
                 ...CharacterFactory.generateAppearance( 'F' ),
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

    generateAppearance( sex = 'F' ) {
        // TODO: currently F only
        return {
            skin: SKIN_COLORS[ randomValue( SKIN_COLORS.length )],
            hair: randomValue( FEMALE_HAIR_TOTAL ),
            jewelry: randomValue( FEMALE_JEWELRY_TOTAL ),
            eyes: randomValue( FEMALE_EYE_TOTAL ),
            mouth: randomValue( FEMALE_MOUTH_TOTAL ),
            clothes: randomValue( FEMALE_CLOTHES_TOTAL ),
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Character instance
     */
    assemble( data ) {
        return CharacterFactory.create({
            sex: data.s,
            name: data.n,
            skin: data.sk,
            hair: data.h,
            jewelry: data.j,
            eyes: data.e,
            mouth: data.m,
            clothes: data.c
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
            sk: appearance.skin,
            h: appearance.hair,
            j: appearance.jewelry,
            e: appearance.eyes,
            m: appearance.mouth,
            c: appearance.clothes,
            sp: properties.speed,
            i: properties.intoxication,
            b: properties.boost,
            iv: InventoryFactory.disassemble( inventory )
        };
    }
};
export default CharacterFactory;
