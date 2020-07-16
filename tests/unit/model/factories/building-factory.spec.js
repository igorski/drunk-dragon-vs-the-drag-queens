import BuildingFactory from '@/model/factories/building-factory';

describe('Building factory', () => {
    it('should be able to assemble and disassemble a serialized building without loss of data', () => {
        const building = BuildingFactory.create( 12, 7 );
        const disassembled = BuildingFactory.disassemble( building );
        expect( BuildingFactory.assemble( disassembled )).toEqual( building );
    });
});
