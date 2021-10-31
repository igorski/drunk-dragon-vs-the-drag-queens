import EffectFactory from "@/model/factories/effect-factory";
import { GAME_TIME_RATIO } from "@/definitions/constants";

describe("Effect factory", () => {
    it( "should require either a mutation or callback action to be defined", () => {
        expect(() => {
            EffectFactory.create();
        }).toThrow();

        expect(() => {
            EffectFactory.create( "mutation" );
        }).not.toThrow();

        expect(() => {
            EffectFactory.create( null );
        }).toThrow();

        expect(() => {
            EffectFactory.create( null, 100, 1000, 0, 1, "action" );
        }).not.toThrow();
    });

    describe( "when calculation the effect duration", () => {
        const mutation  = "someMutation";
        const startTime = 600;
        const duration  = 1000;

        it( "should not correct when creating using relative game time", () => {
            const effect = EffectFactory.create( mutation, startTime, duration );
            expect( effect.duration ).toEqual( duration );
        });

        it( "should translate the duration of an effect to game/actual time ratio when creating using real time", () => {
            const effect = EffectFactory.createRealTime( mutation, startTime, duration );
            expect( effect.duration ).toEqual( duration * GAME_TIME_RATIO );
        });
    });

    describe( "when creating a new effect structure with precalculated increment", () => {
        const mutation   = "someMutation";
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;
        const callback   = "someAction";
        const target     = { some: "thing" };

        it( "should do so when creating using relative game time", () => {
            const effect = EffectFactory.create(
                mutation, startTime, duration, startValue, endValue, callback, target
            );

            expect( effect ).toEqual({
                mutation,
                startTime,
                duration: duration,
                startValue,
                endValue,
                callback,
                increment: ( endValue - startValue ) / duration,
                target
            });
        });

        it( "should do so when creating using real time", () => {
            const effect = EffectFactory.createRealTime(
                mutation, startTime, duration, startValue, endValue, callback, target
            );

            expect( effect ).toEqual({
                mutation,
                startTime,
                duration: duration * GAME_TIME_RATIO,
                startValue,
                endValue,
                callback,
                increment: ( endValue - startValue ) / ( duration * GAME_TIME_RATIO ),
                target
            });
        });
    });

    describe( "when assembling and disassembling a serialized effect", () => {
        const mutation   = "someMutation";
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;
        const callback   = "someAction";
        const target     = { some: "thing" };

        it( "should do so without loss of data for an effect created in relative game time", () => {
            const effect = EffectFactory.create(
                mutation, startTime, duration, startValue, endValue, callback, target
            );
            const disassembled = EffectFactory.disassemble( effect );
            expect( EffectFactory.assemble( disassembled )).toEqual( effect );
        });

        it( "should do so without loss of data for an effect created using real time", () => {
            const effect = EffectFactory.createRealTime(
                mutation, startTime, duration, startValue, endValue, callback, target
            );
            const disassembled = EffectFactory.disassemble( effect );
            expect( EffectFactory.assemble( disassembled )).toEqual( effect );
        });
    });
});
