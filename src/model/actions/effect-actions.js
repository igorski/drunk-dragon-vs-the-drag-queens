import CharacterActions from './character-actions';

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
        const { character } = effect;

        if ( elapsed >= effect.duration ) {
            CharacterActions.updateProperties( character, { [effect.property]: effect.endValue })
            return true;
        }
        const value = effect.startValue + ( increment * elapsed );
        CharacterActions.updateProperties( character, { [effect.property]: value });
        return false;
    }
};
