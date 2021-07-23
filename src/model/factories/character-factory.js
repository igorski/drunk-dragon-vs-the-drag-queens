import Random           from "random-seed";
import { QUEEN }        from "@/definitions/character-types";
import IntentFactory    from "@/model/factories/intent-factory";
import InventoryFactory from "@/model/factories/inventory-factory";
import { validateProperties } from "../validator";
import { randomInRange, randomFromList } from "@/utils/random-util";
import { getUid } from "@/utils/uid-util";

const QUEEN_HAIR_TOTAL    = 8;
const QUEEN_JEWELRY_TOTAL = 5;
const QUEEN_EYE_TOTAL     = 3;
const QUEEN_NOSE_TOTAL    = 3;
const QUEEN_MOUTH_TOTAL   = 4;
const QUEEN_CLOTHES_TOTAL = 5;

export const QUEEN_SKIN_COLORS = [ /*"#FFDBAC",*/ "#F1C27D", "#E0AC69", "#C68642", "#8D5524" ];
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
     create({ x = 0, y = 0, level = 1, hp = 1, maxHp = 0, xp = 0, type = QUEEN, id = getUid() } = {},
         appearance = {}, properties = {}, inventory = InventoryFactory.create() ) {
         maxHp = Math.max( hp, maxHp );
         const character = {
             id,
             x,
             y,
             level,
             hp,
             maxHp,
             xp,
             type,
             // all characters are always 1 tile in width and height
             width: 1,
             height: 1,
             appearance: {
                 name: "Derp",
                 ...CharacterFactory.generateAppearance(),
                 ...appearance
             },
             properties: {
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
            id: data.id,
            x: data.x,
            y: data.y,
            level: data.l,
            type: data.t,
            xp: data.xp,
            hp: data.hp,
            maxHp: data.mhp
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
        const { id, x, y, level, type, xp, hp, maxHp, appearance, properties, inventory } = character;
        return {
            x, y, xp, hp, id,
            mhp: maxHp,
            l: level,
            t: type,
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
