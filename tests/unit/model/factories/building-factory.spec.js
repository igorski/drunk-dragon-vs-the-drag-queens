import { describe, it, expect, vi } from "vitest";
import BuildingFactory  from "@/model/factories/building-factory";
import CharacterFactory from "@/model/factories/character-factory";

vi.mock( "zcanvas", () => ({
    Loader: {
        onReady: Promise.resolve,
    },
    Sprite: vi.fn()
}));

describe("Building factory", () => {
    it("should be able to assemble and disassemble a serialized building without loss of data", () => {
        const player   = CharacterFactory.create();
        const building = BuildingFactory.create({ x: 12, y: 7, id: 100 });
        BuildingFactory.generateFloors( building, player );

        const disassembled = BuildingFactory.disassemble( building );
        expect( BuildingFactory.assemble( disassembled )).toEqual( building );
    });
});
