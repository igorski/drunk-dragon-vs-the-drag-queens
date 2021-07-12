import EffectFactory from "@/model/factories/effect-factory";
import { GAME_TIME_RATIO } from "@/utils/time-util";

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

    it( "should translate the duration of an effect to game/actual time ratio", () => {
        const mutation  = "someMutation";
        const startTime = 600;
        const duration  = 1000;

        const effect = EffectFactory.create( mutation, startTime, duration );

        expect( effect.duration ).toEqual( duration * GAME_TIME_RATIO );
    });

    it( "should be able to create a new effect structure with precalculated increment", () => {
        const mutation   = "someMutation";
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;
        const callback   = "someAction";
        const target     = { some: "thing" };

        const effect = EffectFactory.create(
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

    it( "should be able to assemble and disassemble a serialized effect without loss of data", () => {
        const mutation   = "someMutation";
        const startTime  = Date.now();
        const duration   = 1000;
        const startValue = 2000;
        const endValue   = 5000;
        const callback   = "someAction";
        const target     = { some: "thing" };

        const effect = EffectFactory.create(
            mutation, startTime, duration, startValue, endValue, callback, target
        );
        const disassembled = EffectFactory.disassemble( effect );
        expect( EffectFactory.assemble( disassembled )).toEqual( effect );
    });
});
