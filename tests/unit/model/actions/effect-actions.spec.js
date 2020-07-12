import EffectActions from '@/model/actions/effect-actions';
import EffectFactory from '@/model/factories/effect-factory';

describe('Effect actions', () => {
    it('Should not perform an action for an Effect that is scheduled in the future', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, 'foo', 1000, 1000, 0, 1 );
        const result = EffectActions.update( effect, 0 );

        // effect is not done
        expect( result ).toBe( false );
        // effect is scheduled in future, should not have take action
        expect( commit ).not.toHaveBeenCalled();
    });

    it('Should perform an action for an Effect where its active lifetime overlaps the current time', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, 'foo', 1000, 1000, 0, 1 );
        const result = EffectActions.update( effect, 1500 );

        // effect is not done (still halfway through its lifetime)
        expect( result ).toBe( false );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( 'foo', 0.5 );
    });

    it('Should perform the final action for an Effect where the active lifetime ends at the current time', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, 'foo', 1000, 1000, 0, 1 );
        const result = EffectActions.update( effect, 2000 );

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( 'foo', 1 );
    });

    it('Should perform the final action for an Effect where the active lifetime ended before the current time', () => {
        const commit = jest.fn();
        const effect = EffectFactory.create( commit, 'foo', 1000, 1000, 0, 1 );
        const result = EffectActions.update( effect, 3000 );

        // effect is done (current time is at its lifetime end)
        expect( result ).toBe( true );
        // expect update function to have been called with correctly interpolated value
        expect( commit ).toHaveBeenCalledWith( 'foo', 1 );
    });
});
