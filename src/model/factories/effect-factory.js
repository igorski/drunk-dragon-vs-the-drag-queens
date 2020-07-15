export default
{
    /**
     * An effect is a state that wears off after times passes
     * (for instance the effects of alcohol) an effect should operate
     * on a single property. If more than one effect applies to the same
     * property this should be recalculated into a new duration and value range.
     *
     * @param {Function} commit Vuex store commit action
     * @param {String} action the name of the mutation to invoke on change
     * @param {Number} startTime time offset (e.g. current game time in milliseconds)
     * @param {Number} duration total effect duration in milliseconds
     * @param {Number} startValue the value when the effect starts
     * @param {Number} endValue the value when the effect ends
     * @param {Function=} callback optional callback to call when effect is completed
     * @return {Object}
     */
    create( commit, action, startTime, duration, startValue, endValue, callback = null ) {
        if ( typeof commit !== 'function' ) {
            throw new Error ( 'Cannot create an Effect without a commit fn()' );
        }
        return {
            commit,
            action,
            startTime,
            duration,
            startValue,
            endValue,
            callback,
            increment: ( endValue - startValue ) / duration
        };
    }
};
