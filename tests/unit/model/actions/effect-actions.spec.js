import EffectActions from '@/model/actions/effect-actions';
import EffectFactory from '@/model/factories/effect-factory';

describe('Effect actions', () => {
    const action     = 'foo';
    const startTime  = 1000;
    const duration   = 1000;
    const startValue = 0;
    const endValue   = 1;

    it('Should not perform an action for an Effect that is scheduled in the future', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, action, startTime, duration, startValue, endValue);
        const result = EffectActions.update( effect, 0 );

        // effect is not done
        expect( result ).toBe( false );
        // effect is scheduled in future, should not have take action
        expect( commit ).not.toHaveBeenCalled();
    });

    it('Should perform an action for an Effect where its active lifetime overlaps the current time', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, action, startTime, duration, startValue, endValue);
        const result = EffectActions.update( effect, startTime + ( duration / 2 ) );

        // effect is not done (still halfway through its lifetime)
        expect( result ).toBe( false );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( 'foo', 0.5 );
    });

    it('Should perform the final action for an Effect where the active lifetime ends at the current time', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, action, startTime, duration, startValue, endValue);
        const result = EffectActions.update( effect, startTime + duration );

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( 'foo', 1 );
    });

    it('Should perform the final action for an Effect where the active lifetime ended before the current time', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, action, startTime, duration, startValue, endValue);
        const result = EffectActions.update( effect, startTime + ( duration * 2 ));

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( 'foo', 1 );
    });

    it('Should invoke the callback method when the effect completes', () => {
        const commit   = jest.fn();
        const callback = jest.fn();
        const effect   = EffectFactory.create(
            commit, action, startTime, duration, startValue, endValue, callback
        );

        // ensure callback isn't invoked before effect is started
        EffectActions.update( effect, 0 );
        expect ( callback ).not.toHaveBeenCalled();

        // ensure callback isn't invoked when effect is started
        EffectActions.update( effect, startTime );
        expect ( callback ).not.toHaveBeenCalled();

        // ensure callback isn't invoked halfway through effect lifetime
        EffectActions.update( effect, startTime + ( duration / 2 ));
        expect ( callback ).not.toHaveBeenCalled();

        // ensure callback is invkoed when effect has reached its end
        EffectActions.update( effect, startTime + duration );
        expect( callback ).toHaveBeenCalled();
    });
});
