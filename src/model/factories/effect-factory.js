import { GAME_TIME_RATIO } from "@/definitions/constants";

const EffectFactory =
{
    /**
     * An effect is a state that wears off after times passes
     * (for instance the effects of alcohol) an effect should operate
     * on a single property. If more than one effect applies to the same
     * property this should be recalculated into a new duration and value range.
     *
     * @param {String} mutation the name of the Vuex mutation to commit to on change, nullable
     * @param {Number} startTime time offset (e.g. current game time in milliseconds)
     * @param {Number} duration total effect duration in milliseconds, this is
     *                          automatically scaled against the game/real life time ratio
     * @param {Number} startValue the value when the effect starts
     * @param {Number} endValue the value when the effect ends
     * @param {String=} callback optional Vuex action to dispatch when effect is completed
     * @param {*=} target optional data property of any type to identify the effect target (f.i. character identifier)
     *                    when supplied, mutations and actions will receive { value, target } Object instead
     *                    of primitive value as argument
     * @return {Object}
     */
    create( mutation, startTime, duration, startValue, endValue, callback = null, target = null ) {
        if ( process.env.NODE_ENV !== "production" ) {
            if ( !mutation && !callback ) {
                throw new Error( "cannot instantiate an Effect without either a mutation or callback" );
            }
        }
        const scaledDuration = duration * GAME_TIME_RATIO;
        return {
            mutation,
            startTime,
            duration: scaledDuration,
            startValue,
            endValue,
            callback,
            target,
            increment: ( endValue - startValue ) / scaledDuration
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Effect instance
     */
    assemble( data ) {
        return EffectFactory.create( data.m, data.s, data.d, data.sv, data.ev, data.c, data.t );
    },

    /**
     * serializes a Effect instance into a JSON structure
     */
    disassemble( effect ) {
        return {
            m: effect.mutation,
            s: effect.startTime,
            d: effect.duration / GAME_TIME_RATIO,
            sv: effect.startValue,
            ev: effect.endValue,
            c: effect.callback,
            t: effect.target,
        };
    }
};
export default EffectFactory;
