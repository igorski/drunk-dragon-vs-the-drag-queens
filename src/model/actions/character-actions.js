import CharacterFactory from "@/model/factories/character-factory";
import { QUEEN, DRAB, DRAGON } from "@/definitions/character-types";
import { SHOE_HEELS, SHOE_SNEAKERS } from "@/definitions/item-types";
import { randomInRangeInt } from "@/utils/random-util";
import { validateProperties } from "../validator";

export default
{
    /**
     * Updates the properties of an existing Characters configuration. This
     * can be the full structure, or just a subset of properties.
     */
    updateProperties( character, propertiesToApply = {} ) {
        const properties = { ...character.properties, ...propertiesToApply };
        if ( validateProperties( properties )) {
            character.properties = properties;
        }
    },

    /* getters (all configuration properties are computed) */

    getSpeed( character ) {
        const { speed, intoxication, boost } = character.properties;
        const tunedSpeed = speed + ( -intoxication + boost );

        if ( character.type === DRAGON && character.level < 3 ) {
            return tunedSpeed * 0.75; // lower level dragons are slower to give the player a break
        }
        const { items } = character.inventory;

        if ( items.find(({ name }) => name === SHOE_HEELS )) {
            return tunedSpeed * 0.75; // heels slow you down
        }
        if ( items.find(({ name }) => name === SHOE_SNEAKERS )) {
            return tunedSpeed * 1.5; // sneakers give you a speed boost
        }
        return tunedSpeed;
    },

    /**
     * Get the charisma of this Character in 0-1 range. Charisma can describe likeability,
     * sex appeal, or anything in between. Charisma can also be relative to
     * given character.
     */
    getCharisma( character, relativeCharacter = CharacterFactory.create() ) {
        const { intoxication, boost } = character.properties;
        let value = .25;

        // highly drunk people are highly attractive to equally drunk people and
        // not at all to those who aren't.

        if ( intoxication === 1 ) return ( relativeCharacter.properties.intoxication === intoxication ) ? 1 : 0;

        // some traits are just unattractive, period.

        if ( boost === 1 ) return 0; // extremely coked out of their mind.

        // slight intoxication is sexy, high not so much

        value += ( intoxication > .5 ) ? -( intoxication * .5 ) : intoxication * .5;

        // slight boost is appealing, high not so much

        value += ( boost > .5 ) ? -( boost * .5 ) : boost * .5;

        return value;
    },

    isAggressive( character ) {
        const { intoxication, boost } = character.properties;
        return intoxication >= 0.5 && boost >= 0.5;
    },

    /**
     * Generates the appropriate HP and Level for an opponent of given type in
     * relation to given characters level.
     */
    generateOpponentProps( character, opponentType ) {
        let hp, level;
        switch ( opponentType ) {
            default:
            case QUEEN:
                // queens match the player in HP and level
                hp    = character.maxHp;
                level = character.level;
                break;
            case DRAB:
                // these attack in numbers, we can afford to have these be weaker than the player
                hp    = character.maxHp / 2;
                level = character.level === 1 ? 1 : Math.ceil( character.level / 2 );
                break;
            case DRAGON:
                // gets progressively stronger as the player rises in level
                hp    = character.level === 1 ? 5 : 7.5 * character.level;
                level = character.level;
                break;
        }
        // randomize results a little
        const randHp    = ( hp    / 4 ) - randomInRangeInt( 0, hp / 2 );
        const randLevel = ( level / 4 ) - randomInRangeInt( 0, level / 2 );

        const finalHP = Math.max( 1, Math.round( hp + randHp ));
        return {
            hp    : finalHP,
            maxHp : finalHP,
            level : Math.max( 1, Math.round( level + randLevel ))
        };
    }
};
