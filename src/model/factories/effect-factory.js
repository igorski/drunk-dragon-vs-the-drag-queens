import { GAME_TIME_RATIO } from "@/definitions/constants";

/**
 * An effect is a state that wears off after times passes
 * (for instance the effects of alcohol) an effect should operate
 * on a single property. If more than one effect applies to the same
 * property this should be recalculated into a new duration and value range.
 */
const EffectFactory =
{
    /**
     * Creates an effect where the time scale is relative to the game. E.g. provide
     * one hour and it passes faster in real time (factor of GAME_TIME_RATIO faster).
     *
     * @param {String} mutation the name of the Vuex mutation to commit to on change, nullable
     * @param {Number} startTime time offset (e.g. current game time in milliseconds)
     * @param {Number} duration total effect duration in milliseconds, provided in game time.
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
        return {
            mutation,
            startTime,
            duration,
            startValue,
            endValue,
            callback,
            target,
            increment: ( endValue - startValue ) / duration
        };
    },

    /**
     * Creates an effect where the time scale is real time. E.g. provide
     * one hour and it passes by more slowly in game time (factor of GAME_TIME_RATIO slower).
     */
    createRealTime( mutation, startTime, duration, startValue, endValue, callback = null, target = null ) {
        return EffectFactory.create( mutation, startTime, duration * GAME_TIME_RATIO, startValue, endValue, callback, target );
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
            d: effect.duration,
            sv: effect.startValue,
            ev: effect.endValue,
            c: effect.callback,
            t: effect.target,
        };
    }
};
export default EffectFactory;
