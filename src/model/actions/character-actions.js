import CharacterFactory from '@/model/factories/character-factory';
import { validateProperties } from '../validator';

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
        return speed + ( -intoxication + boost );
    },

    /**
     * Get the charisma of this Character in 0-1 range. Charisma can describe likeability,
     * sex appeal, or anything in between. Charisma can also be relative to
     * given character.
     */
    getCharisma( character, relativeCharacter = CharacterFactory.create() ) {
        const { intoxication, boost } = character.properties;
        let value = character.appearance.sex === 'F' ? .25 : .1; // women are more charismatic

        // highly drunk people are highly attractive to equally drunk people and
        // not at all to those who aren't.

        if ( intoxication === 1 ) return ( relativeCharacter.properties.intoxication === intoxication ) ? 1 : 0;

        // some traits are just unnattractive, period.

        if ( boost === 1 ) return 0;

        // slight intoxication is sexy, high not so much

        value += ( intoxication > .5 ) ? -( intoxication * .5 ) : intoxication * .5;

        // slight boost is appealing, high not so much

        value += ( boost > .5 ) ? -( boost * .5 ) : boost * .5;

        return value;
    }
};
