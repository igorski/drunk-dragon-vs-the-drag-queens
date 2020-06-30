export default class Effect {
    /**
     * An effect is a state that wears off after times passes
     * (for instance the effects of alcohol) an effect should operate
     * on a single property. If more than one effect applies to the same
     * property this should be recalculated into a new duration and value range.
     *
     * @param {Character} character the effect applies to
     * @param {number} startTime time offset (e.g. current game time in milliseconds)
     * @param {number} duration total effect duration in milliseconds
     * @param {String} property the name of the Character property to change
     * @param {number} startValue the value when the effect starts
     * @param {number} endValue the value when the effect ends
     */
    constructor( character, startTime, duration, property, startValue, endValue ) {
        this.character  = character;
        this.startTime  = startTime;
        this.duration   = duration;
        this.property   = property;
        this.startValue = startValue;
        this.endValue   = endValue;
        this.increment  = ( endValue / startValue ) / duration;
    }

    /**
     * Invoked by the game loop whenever time passes in the simulation.
     *
     * @param {number} currentTime current game time in milliseconds
     * @return {boolean} whether the Effect has completed its total duration
     */
    update( currentTime ) {
        const elapsed = currentTime - this.startTime;

        if ( elapsed >= this.duration ) {
            this.character.updateProperties({ [this.property]: this.endValue })
            return true;
        }
        const value = this.startValue + ( increment * elapsed );
        character.updateProperties({ [this.property]: value });
        return false;
    }
};
