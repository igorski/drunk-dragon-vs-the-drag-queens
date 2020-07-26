import EnvironmentFactory from '@/model/factories/environment-factory';

describe('Environment factory', () => {
    it('should be able to assemble and disassemble a serialized Environment without loss of data', () => {
        const environment = EnvironmentFactory.create( 12, 7 );
        const disassembled = EnvironmentFactory.disassemble( environment );
        expect( EnvironmentFactory.assemble( disassembled )).toEqual( environment );
    });
});
