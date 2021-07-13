import MD5          from "MD5";
import { DRAGON }   from "@/definitions/character-types";
import WorldFactory from "@/model/factories/world-factory";

describe("World factory", () => {
    it( "should be able to assemble and disassemble a serialized world without loss of data", () => {
        const world = WorldFactory.create();
        const disassembled = WorldFactory.disassemble( world );
        expect( WorldFactory.assemble( disassembled, "foobar" )).toEqual( world );
    });

    describe( "when populating the world", () => {
        let populatedWorld;
        beforeAll(() => {
            populatedWorld = WorldFactory.create();
            const hash = MD5( Date.now() + Math.random());
            WorldFactory.populate( populatedWorld, hash );
        });

        it( "should populate a world with multiple buildings", () => {
            expect( populatedWorld.buildings ).length > 1;
        });

        it( "should populate a world with multiple shops", () => {
            expect( populatedWorld.shops ).length > 1;
        });

        it( "should populate a world with multiple characters", () => {
            expect( populatedWorld.characters ).length > 1;
        });

        it( "should populate a world to contain a single drunk dragon", () => {
            const dragons = populatedWorld.characters.filter(({ type }) => type === DRAGON );
            expect( dragons ).toHaveLength( 1 );
        });
    });
});
