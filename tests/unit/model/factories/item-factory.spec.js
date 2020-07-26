import ItemFactory, { SHOP_TYPES } from '@/model/factories/item-factory';
import ItemTypes from '@/definitions/item-types';

describe('Item factory', () => {
    it('should be able to assemble and disassemble a serialized item without loss of data', () => {
        const item = ItemFactory.create( ItemTypes.LIQUOR, 4 );
        const disassembled = ItemFactory.disassemble( item );
        expect( ItemFactory.assemble( disassembled )).toEqual( item );
    });
});
