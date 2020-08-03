import Random           from 'random-seed';
import IntentFactory    from '@/model/factories/intent-factory';
import InventoryFactory from '@/model/factories/inventory-factory';
import { validateAppearance, validateProperties } from '../validator';

const FEMALE_HAIR_TOTAL    = 8;
const FEMALE_JEWELRY_TOTAL = 5;
const FEMALE_EYE_TOTAL     = 3;
const FEMALE_NOSE_TOTAL    = 3;
const FEMALE_MOUTH_TOTAL   = 4;
const FEMALE_CLOTHES_TOTAL = 5;

export const SKIN_COLORS = [ /*'#FFDBAC',*/ '#F1C27D', '#E0AC69', '#C68642', '#8D5524' ];
export const FEMALE_APPEARANCE = {
    skin: SKIN_COLORS.length,
    hair: FEMALE_HAIR_TOTAL,
    jewelry: FEMALE_JEWELRY_TOTAL,
    eyes: FEMALE_EYE_TOTAL,
    mouth: FEMALE_MOUTH_TOTAL,
    nose: FEMALE_NOSE_TOTAL,
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
     create( x = 0, y = 0, appearance = {}, properties = {},  inventory = InventoryFactory.create() ) {
         const character = {
             x,
             y,
             // all characters are always 1 tile in width and height
             width: 1, height: 1,
             appearance: {
                 sex: 'F', // it's the 80's, gender identity wasn't in vogue and sex is binary ;)
                 name: 'Derp',
                 ...CharacterFactory.generateAppearance( 'F' ),
                 ...appearance
             },
             // all in percentile range (e.g. 0-1)
             properties: {
                 speed: 1,
                 intent: null,
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
            nose: randomValue( FEMALE_NOSE_TOTAL ),
            clothes: randomValue( FEMALE_CLOTHES_TOTAL ),
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Character instance
     */
    assemble( data ) {
        return CharacterFactory.create( data.x, data.y,
        {
            sex: data.s,
            name: data.n,
            skin: data.sk,
            hair: data.h,
            jewelry: data.j,
            eyes: data.e,
            mouth: data.m,
            nose: data.no,
            clothes: data.c
        }, {
            speed: data.sp,
            intent: data.i ? IntentFactory.assemble( data.i ) : null,
            intoxication: data.in,
            boost: data.b,
        }, InventoryFactory.assemble( data.iv ));
    },

    /**
     * serializes a Character instance into a JSON structure
     */
    disassemble( character ) {
        const { x, y, appearance, properties, inventory } = character;
        return {
            x, y,
            s: appearance.sex,
            n: appearance.name,
            sk: appearance.skin,
            h: appearance.hair,
            j: appearance.jewelry,
            e: appearance.eyes,
            m: appearance.mouth,
            no: appearance.nose,
            c: appearance.clothes,
            sp: properties.speed,
            i: properties.intent ? IntentFactory.disassemble( properties.intent ) : null,
            in: properties.intoxication,
            b: properties.boost,
            iv: InventoryFactory.disassemble( inventory )
        };
    }
};
export default CharacterFactory;
