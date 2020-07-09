import CharacterFactory from '@/model/factories/character-factory';
import InventoryFactory from '@/model/factories/inventory-factory';

describe('Character factory', () => {
    describe('when creating a character structure', () => {
        it('should throw when an invalid appearance is passed', () => {
            const appearance = {
                sex: 'yes', // invalid sex, so should be invalid
            };
            expect(() => CharacterFactory.create( appearance )).toThrow();
        });

        it('should throw when an invalid property configuration is passed', () => {
            const properties = {
                speed: 2, // out of range value, so should be invalid
            };
            expect(() => CharacterFactory.create( {}, properties )).toThrow();
        });

        it('should leave all construction arguments unchanged', () => {
            const appearance = {
                sex: 'M',
                name: 'Duul',
                skin: '#00FF00',
                eyes: 3,
                hair: 2,
                jewelry: 1,
                clothes: 0,
                mouth: 1,
                nose: 0,
            };
            const properties = {
                speed: 0.5,
                intoxication: 0.4,
                boost: 0.3
            };
            const inventory = InventoryFactory.create();
            const char = CharacterFactory.create( appearance, properties, inventory );
            expect( char.appearance ).toEqual( appearance );
            expect( char.properties ).toEqual( properties );
            expect( char.inventory ).toEqual( inventory );
        });
    });

    it('should be able to assemble and disassemble a serialized character without loss of data', () => {
        const character = CharacterFactory.create({ name: 'Billy' });
        const { appearance, properties, inventory } = character;
        appearance.sex = 'M';
        properties.speed = .7;
        properties.intoxication = .3;
        properties.boost = .2;

        const disassembled = CharacterFactory.disassemble( character );
        expect( CharacterFactory.assemble( disassembled )).toEqual( character );
    });
});
