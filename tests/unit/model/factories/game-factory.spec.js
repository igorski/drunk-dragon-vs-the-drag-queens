import CaveFactory from '@/model/factories/cave-factory';
import CharacterFactory from '@/model/factories/character-factory';
import GameFactory from '@/model/factories/game-factory';
import WorldFactory from '@/model/factories/world-factory';

describe('game factory', () => {
    it('should be able to assemble and disassemble a serialized game without loss of data', () => {
        const game = {
            hash: 'foobarbaz',
            created: Date.now() - 100,
            modified: Date.now() - 50,
            gameStart: Date.now() - 90,
            gameTime: Date.now() - 1000,
            player: CharacterFactory.create(),
            world: WorldFactory.create(),
            cave: CaveFactory.create()
        };
        const disassembled = GameFactory.disassemble( game );
        expect( GameFactory.assemble( disassembled )).toEqual({ ...game, gameActive: true });
    });
});
