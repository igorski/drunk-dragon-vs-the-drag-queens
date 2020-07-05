import WorldFactory from '@/model/factories/world-factory';

describe('World factory', () => {
    it('should be able to assemble and disassemble a serialized world without loss of data', () => {
        const world = WorldFactory.create( 12, 7 );
        const disassembled = WorldFactory.disassemble( world );
        expect( WorldFactory.assemble( disassembled, 'foobar' )).toEqual( world );
    });
});
