import CharacterFactory from '@/model/factories/character-factory';
import Character from '@/model/character';

describe('character factory', () => {
    it('should be able to assemble and disassemble a serialized character without loss of data', () => {
        const character = CharacterFactory.create( 'Billy' );
        const { appearance, properties, inventory } = character;
        appearance.sex = 'M';
        properties.speed = .7;
        properties.intoxication = .3;
        properties.boost = .2;

        const disassembled = CharacterFactory.disassemble( character );
        expect( CharacterFactory.assemble( disassembled )).toEqual( character );
    });
});
