import CaveFactory from '@/model/factories/cave-factory';

describe('cave factory', () => {
    it('should be able to assemble and disassemble a serialized cave without loss of data', () => {
        const cave = CaveFactory.create( 12, 7 );
        const disassembled = CaveFactory.disassemble( cave );
        expect( CaveFactory.assemble( disassembled )).toEqual( cave );
    });
});
