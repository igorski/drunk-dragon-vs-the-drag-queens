import EffectActions from "@/model/actions/effect-actions";
import EffectFactory from "@/model/factories/effect-factory";
import { GAME_TIME_RATIO } from "@/definitions/constants";

describe("Effect actions", () => {
    const mutation       = "foo";
    const startTime      = 1000;
    const duration       = 1000;
    const scaledDuration = duration * GAME_TIME_RATIO;
    const startValue     = 0;
    const endValue       = 1;
    const callback       = "bar";

    it( "Should not perform an action for an Effect that is scheduled in the future", () => {
        const commit   = jest.fn();
        const dispatch = jest.fn();
        const effect   = EffectFactory.create( mutation, startTime, duration, startValue, endValue );
        const result   = EffectActions.update({ commit, dispatch }, effect, 0 );

        // effect is not done
        expect( result ).toBe( false );
        // effect is scheduled in future, should not have take action
        expect( commit ).not.toHaveBeenCalled();
        expect( dispatch ).not.toHaveBeenCalled();
    });

    it( "Should perform an action for an Effect where its active lifetime overlaps the current time", () => {
        const commit   = jest.fn();
        const dispatch = jest.fn();
        const effect   = EffectFactory.create( mutation, startTime, duration, startValue, endValue );
        const result   = EffectActions.update({ commit, dispatch }, effect, startTime + ( scaledDuration / 2 ) );

        // effect is not done (still halfway through its lifetime)
        expect( result ).toBe( false );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( "foo", 0.5 );
        expect( dispatch ).not.toHaveBeenCalled();
    });

    it( "Should perform the final action for an Effect where the active lifetime ends at the current time", () => {
        const commit   = jest.fn();
        const dispatch = jest.fn();
        const effect   = EffectFactory.create( mutation, startTime, duration, startValue, endValue );
        const result   = EffectActions.update({ commit, dispatch }, effect, startTime + scaledDuration );

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( "foo", 1 );
        expect( dispatch ).not.toHaveBeenCalled();
    });

    it( "Should perform the final action for an Effect where the active lifetime ended before the current time", () => {
        const commit   = jest.fn();
        const dispatch = jest.fn();
        const effect   = EffectFactory.create( mutation, startTime, duration, startValue, endValue );
        const result   = EffectActions.update({ commit, dispatch }, effect, startTime + ( scaledDuration * 2 ));

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( "foo", 1 );
        expect( dispatch ).not.toHaveBeenCalled();
    });

    it( "Should dispatch the callback method when the effect completes", () => {
        const commit   = jest.fn();
        const dispatch = jest.fn();
        const effect   = EffectFactory.create(
            mutation, startTime, duration, startValue, endValue, callback
        );

        // ensure callback isn't invoked before effect is started
        EffectActions.update({ commit, dispatch }, effect, 0 );
        expect ( dispatch ).not.toHaveBeenCalled();

        // ensure callback isn't invoked when effect is started
        EffectActions.update({ commit, dispatch }, effect, startTime );
        expect ( dispatch ).not.toHaveBeenCalled();

        // ensure callback isn't invoked halfway through effect lifetime
        EffectActions.update({ commit, dispatch }, effect, startTime + ( scaledDuration / 2 ));
        expect ( dispatch ).not.toHaveBeenCalled();

        // ensure callback is invoked when effect has reached its end
        EffectActions.update({ commit, dispatch }, effect, startTime + scaledDuration );
        expect( dispatch ).toHaveBeenCalledWith( callback, null );
    });

    describe( "When the optional target property is defined", () => {
        it( "Should call the commit method with both value and target", () => {
            const commit   = jest.fn();
            const dispatch = jest.fn();
            const target   = "fooBar";
            const effect   = EffectFactory.create( mutation, startTime, duration, startValue, endValue, null, target );
            const result   = EffectActions.update({ commit, dispatch }, effect, startTime + ( scaledDuration * 2 ));

            // effect is done (current time is at its lifetime end)
            expect( result ).toBe( true );
            // expect update function to have been called with correctly interpolated value
            expect( commit ).toHaveBeenCalledWith( "foo", { value: 1, target });
            expect( dispatch ).not.toHaveBeenCalled();
        });

        it( "Should dispatch the callback method supplying target when the effect completes", () => {
            const commit   = jest.fn();
            const dispatch = jest.fn();
            const target   = { foo: "bar" };
            const effect   = EffectFactory.create(
                mutation, startTime, duration, startValue, endValue, callback, target
            );
            EffectActions.update({ commit, dispatch }, effect, startTime + scaledDuration );
            expect( dispatch ).toHaveBeenCalledWith( callback, target );
        });
    });
});
