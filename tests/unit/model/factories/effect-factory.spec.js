import EffectFactory from '@/model/factories/effect-factory';

describe('Effect factory', () => {
    it('should throw an Error when creating a structure without commit function', () => {
        expect(() => {
            const effect = EffectFactory.create();
        }).toThrow();
    });

    it('should be able to create a new effect structure with precalculated increment', () => {
        const commit     = jest.fn();
        const action     = 'someMutation';
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;

        const effect = EffectFactory.create( commit, action, startTime, duration, startValue, endValue );

        expect( effect ).toEqual({
            commit,
            action,
            startTime,
            duration,
            startValue,
            endValue,
            increment: ( endValue - startValue ) / duration
        });
    });
});
