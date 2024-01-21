import { describe, it, expect } from "vitest";
import IntentFactory from "@/model/factories/intent-factory";

describe( "Intent factory", () => {
    it( "should be able to assemble and disassemble a serialized intent without loss of data", () => {
        const intent       = IntentFactory.create();
        const disassembled = IntentFactory.disassemble( intent );
        expect( IntentFactory.assemble( disassembled )).toEqual( intent );
    });
});
