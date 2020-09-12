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
        const { mutation, increment } = effect;

        if ( elapsed < 0 ) {
            return false; // Effect is scheduled ahead of start time
        }

        if ( elapsed >= effect.duration ) {
            typeof mutation === 'string' && commit( mutation, effect.endValue );
            typeof effect.callback === 'string' && dispatch( effect.callback );

            return true;
        }
        typeof mutation === 'string' && commit( mutation, effect.startValue + ( increment * elapsed ));

        return false;
    }
};
