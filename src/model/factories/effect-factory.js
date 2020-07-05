export default
{
    /**
     * An effect is a state that wears off after times passes
     * (for instance the effects of alcohol) an effect should operate
     * on a single property. If more than one effect applies to the same
     * property this should be recalculated into a new duration and value range.
     *
     * @param {Object} character the target the effect applies to
     * @param {number} startTime time offset (e.g. current game time in milliseconds)
     * @param {number} duration total effect duration in milliseconds
     * @param {String} property the name of the Character property to change
     * @param {number} startValue the value when the effect starts
     * @param {number} endValue the value when the effect ends
     */
    create( character, startTime, duration, property, startValue, endValue ) {
        return {
            character,
            startTime,
            duration,
            property,
            startValue,
            endValue,
            increment: ( endValue / startValue ) / duration;
        };
    }
};
