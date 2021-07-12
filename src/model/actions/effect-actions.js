export default
{
    /**
     * Invoked by the game loop whenever time passes in the simulation.
     *
     * @param {{ commit, dispatch }} Vuex store methods
     * @param {Object} effect the Effect to process
     * @param {number} currentTime current game time in milliseconds
     * @return {boolean} whether the Effect has completed its total duration
     */
    update({ commit, dispatch }, effect, currentTime ) {
        const elapsed = currentTime - effect.startTime;

        if ( elapsed < 0 ) {
            return false; // Effect is scheduled ahead of start time
        }

        const { mutation, increment, target } = effect;

        if ( elapsed >= effect.duration ) {
            if ( typeof mutation === "string" ) {
                commit( mutation, target ? { value: effect.endValue, target } : effect.endValue );
            }
            typeof effect.callback === "string" && dispatch( effect.callback, target );

            return true;
        }
        if ( typeof mutation === "string" ) {
            const value = effect.startValue + ( increment * elapsed );
            commit( mutation, target ? { value, target } : value );
        }
        return false;
    }
};
