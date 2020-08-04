import EffectFactory from '@/model/factories/effect-factory';

describe('Effect factory', () => {
    it('should be able to create a new effect structure with precalculated increment', () => {
        const mutation   = 'someMutation';
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;
        const callback   = 'someAction';

        const effect = EffectFactory.create(
            mutation, startTime, duration, startValue, endValue, callback
        );

        expect( effect ).toEqual({
            mutation,
            startTime,
            duration,
            startValue,
            endValue,
            callback,
            increment: ( endValue - startValue ) / duration
        });
    });

    it('should be able to assemble and disassemble a serialized effect without loss of data', () => {
        const mutation   = 'someMutation';
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;
        const callback   = 'someAction';

        const effect = EffectFactory.create(
            mutation, startTime, duration, startValue, endValue, callback
        );
        const disassembled = EffectFactory.disassemble( effect );
        expect( EffectFactory.assemble( disassembled )).toEqual( effect );
    });
});
