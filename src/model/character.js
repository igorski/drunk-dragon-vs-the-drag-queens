import { validateAppearance, validateProperties } from './validator';
import Inventory from './inventory';

export default class Character
{
    /**
     * A Character is the base actor for everything human.
     * A Character is constructed with a series of properties that determines
     * their visual appearance, a series of properties that affects their
     * performance (e.g. speed, accuracy) and an inventory.
     */
    constructor( appearance = {}, properties = {},  inventory = new Inventory() ) {
        this.appearance = {
            sex: 'F', // it's the 80's, gender identity wasn't in vogue and sex is binary ;)
            name: 'Derp',
            ...appearance
        };
        // all in percentile range (e.g. 0-1)
        this.properties = {
            speed: 1,
            intoxication: 0,
            boost: 0,
            ...properties
        };
        this.inventory = inventory;
        
        validateAppearance( this.appearance );
        validateProperties( this.properties );
    }

    /**
     * Updates the properties of an existing configuration. This
     * can be the full structure, or just a subset of properties.
     */
    updateProperties( propertiesToApply = {} ) {
        const properties = { ...this.properties, ...propertiesToApply };
        if ( validateProperties( properties )) {
            this.properties = properties;
        }
    }

    /* getters (all configuration properties are computed) */

    getSpeed() {
        const { speed, intoxication, boost } = this.properties;
        return speed + ( -intoxication + boost );
    }

    /**
     * Get the charisma of this Character in 0-1 range. Charisma can describe likeability,
     * sex appeal, or anything in between. Charisma can also be relative to
     * given character.
     */
    getCharisma( character = new Character() ) {
        const { intoxication, boost } = this.properties;
        let value = this.appearance.sex === 'F' ? .25 : .1; // women are more charismatic

        // highly drunk people are highly attractive to equally drunk people and
        // not at all to those who aren't.

        if ( intoxication === 1 ) return ( character.properties.intoxication === intoxication ) ? 1 : 0;

        // some traits are just unnattractive, period.

        if ( boost === 1 ) return 0;

        // slight intoxication is sexy, high not so much

        value += ( intoxication > .5 ) ? -( intoxication * .5 ) : intoxication * .5;

        // slight boost is appealing, high not so much

        value += ( boost > .5 ) ? -( boost * .5 ) : boost * .5;

        return value;
    }
};
