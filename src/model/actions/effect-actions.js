export default
{
    /**
     * Invoked by the game loop whenever time passes in the simulation.
     *
     * @param {number} currentTime current game time in milliseconds
     * @return {boolean} whether the Effect has completed its total duration
     */
    update( effect, currentTime ) {
        const elapsed = currentTime - effect.startTime;
        const { commit, action, increment } = effect;

        if ( elapsed < 0 ) {
            return false; // action is scheduled ahead
        }

        if ( elapsed >= effect.duration ) {
            commit( action, effect.endValue );
            return true;
        }
        commit( action, effect.startValue + ( increment * elapsed ));
        return false;
    }
};
