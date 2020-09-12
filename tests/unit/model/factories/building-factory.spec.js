import BuildingFactory  from '@/model/factories/building-factory';
import CharacterFactory from '@/model/factories/character-factory';

describe('Building factory', () => {
    it('should be able to assemble and disassemble a serialized building without loss of data', () => {
        const player   = CharacterFactory.create();
        const building = BuildingFactory.create( 12, 7 );
        BuildingFactory.generateFloors( 'hash', building, player );
        
        const disassembled = BuildingFactory.disassemble( building );
        expect( BuildingFactory.assemble( disassembled )).toEqual( building );
    });
});
