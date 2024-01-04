import BuildingFactory  from "@/model/factories/building-factory";
import CharacterFactory from "@/model/factories/character-factory";
import EffectFactory    from "@/model/factories/effect-factory";
import GameFactory      from "@/model/factories/game-factory";
import WorldFactory     from "@/model/factories/world-factory";

jest.mock( "zcanvas", () => ({
    Loader: {
        onReady: new Promise(resolve => resolve())
    },
    Sprite: jest.fn()
}));

describe("Game factory", () => {
    it("should be able to assemble and disassemble a serialized game without loss of data", () => {
        const game = {
            hash: "foobarbaz",
            created: Date.now() - 100,
            modified: Date.now() - 50,
            gameStart: Date.now() - 90,
            gameTime: Date.now() - 1000,
            effects: [ EffectFactory.create( "mutationName", 500, 1000, 0, 1 ) ],
        };
        const player   = CharacterFactory.create();
        const world    = WorldFactory.create();
        const building = BuildingFactory.create();

        const disassembled = GameFactory.disassemble( game, player, world, building );
        const reassembled  = GameFactory.assemble( disassembled );

        expect( reassembled.game ).toEqual( game );
        expect( reassembled.player ).toEqual( player );
        expect( reassembled.world ).toEqual( world );
        expect( reassembled.building ).toEqual( building );
    });
});
