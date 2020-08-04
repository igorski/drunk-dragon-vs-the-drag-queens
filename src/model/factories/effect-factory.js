const EffectFactory =
{
    /**
     * An effect is a state that wears off after times passes
     * (for instance the effects of alcohol) an effect should operate
     * on a single property. If more than one effect applies to the same
     * property this should be recalculated into a new duration and value range.
     *
     * @param {String} mutation the name of the Vuex mutation to commit to on change
     * @param {Number} startTime time offset (e.g. current game time in milliseconds)
     * @param {Number} duration total effect duration in milliseconds
     * @param {Number} startValue the value when the effect starts
     * @param {Number} endValue the value when the effect ends
     * @param {String=} callback optional Vuex action to dispatch when effect is completed
     * @return {Object}
     */
    create( mutation, startTime, duration, startValue, endValue, callback = null ) {
        return {
            mutation,
            startTime,
            duration,
            startValue,
            endValue,
            callback,
            increment: ( endValue - startValue ) / duration
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Effect instance
     */
    assemble( data ) {
        return EffectFactory.create( data.m, data.s, data.d, data.sv, data.ev, data.c );
    },

    /**
     * serializes a Effect instance into a JSON structure
     */
    disassemble( effect ) {
        return {
            m: effect.mutation,
            s: effect.startTime,
            d: effect.duration,
            sv: effect.startValue,
            ev: effect.endValue,
            c: effect.callback
        };
    }
};
export default EffectFactory;
