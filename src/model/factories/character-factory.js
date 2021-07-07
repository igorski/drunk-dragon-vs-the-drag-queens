import Random           from 'random-seed';
import IntentFactory    from '@/model/factories/intent-factory';
import InventoryFactory from '@/model/factories/inventory-factory';
import { validateProperties } from '../validator';
import { randomInRange, randomFromList } from '@/utils/random-util';

const QUEEN_HAIR_TOTAL    = 8;
const QUEEN_JEWELRY_TOTAL = 5;
const QUEEN_EYE_TOTAL     = 3;
const QUEEN_NOSE_TOTAL    = 3;
const QUEEN_MOUTH_TOTAL   = 4;
const QUEEN_CLOTHES_TOTAL = 5;

export const QUEEN_SKIN_COLORS = [ /*'#FFDBAC',*/ '#F1C27D', '#E0AC69', '#C68642', '#8D5524' ];
export const QUEEN_APPEARANCE = {
    skin: QUEEN_SKIN_COLORS.length,
    hair: QUEEN_HAIR_TOTAL,
    jewelry: QUEEN_JEWELRY_TOTAL,
    eyes: QUEEN_EYE_TOTAL,
    mouth: QUEEN_MOUTH_TOTAL,
    nose: QUEEN_NOSE_TOTAL,
    clothes: QUEEN_CLOTHES_TOTAL,
};

const CharacterFactory =
{
     /**
      * A Character is the base actor for everything human.
      * A Character is constructed with a series of properties that determines
      * their visual appearance, a series of properties that affects their
      * performance (e.g. speed, accuracy) and an inventory.
      */
     create({ x = 0, y = 0, xp = 0, level = 1 } = {},
         appearance = {}, properties = {},  inventory = InventoryFactory.create() ) {
         const character = {
             x,
             y,
             level,
             xp,
             // all characters are always 1 tile in width and height
             width: 1,
             height: 1,
             appearance: {
                 name: 'Derp',
                 ...CharacterFactory.generateAppearance(),
                 ...appearance
             },
             properties: {
                 attack: 1,
                 defense: 1,
                 intent: null,
                 // the following are in percentile range (e.g. 0-1)
                 speed: 1,
                 intoxication: 0,
                 boost: 0,
                 ...properties
             },
             inventory
         };
         validateProperties( character.properties );

         return character;
    },

    generateAppearance() {
        return {
            skin: randomFromList( QUEEN_SKIN_COLORS ),
            hair: randomInRange( 0, QUEEN_HAIR_TOTAL - 1 ),
            jewelry: randomInRange( 0, QUEEN_JEWELRY_TOTAL - 1 ),
            eyes: randomInRange( 0, QUEEN_EYE_TOTAL - 1 ),
            mouth: randomInRange( 0, QUEEN_MOUTH_TOTAL - 1 ),
            nose: randomInRange( 0, QUEEN_NOSE_TOTAL - 1 ),
            clothes: randomInRange( 0, QUEEN_CLOTHES_TOTAL - 1 ),
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Character instance
     */
    assemble( data ) {
        return CharacterFactory.create({
            x: data.x,
            y: data.y,
            level: data.l,
            xp: data.xp,
        },
        {
            name: data.n,
            skin: data.sk,
            hair: data.h,
            jewelry: data.j,
            eyes: data.e,
            mouth: data.m,
            nose: data.no,
            clothes: data.c
        }, {
            attack: data.a,
            defense: data.d,
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
        const { x, y, level, xp, appearance, properties, inventory } = character;
        return {
            x, y, xp,
            l: level,
            n: appearance.name,
            sk: appearance.skin,
            h: appearance.hair,
            j: appearance.jewelry,
            e: appearance.eyes,
            m: appearance.mouth,
            no: appearance.nose,
            c: appearance.clothes,
            a: properties.attack,
            d: properties.defense,
            sp: properties.speed,
            i: properties.intent ? IntentFactory.disassemble( properties.intent ) : null,
            in: properties.intoxication,
            b: properties.boost,
            iv: InventoryFactory.disassemble( inventory )
        };
    }
};
export default CharacterFactory;
