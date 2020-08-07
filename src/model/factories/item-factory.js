import PriceTypes from '@/definitions/price-types';
import { randomBool, randomFromList } from '@/utils/random-util';
import ItemTypes, { JEWELRY_TYPES, LIQUOR_TYPES, HEALTHCARE_TYPES } from '@/definitions/item-types';

const ItemFactory =
{
    create( type, optName = '', optPrice = -1 ) {
        let price = optPrice;
        if ( price === -1 ) {
            const prices    = Object.values( PriceTypes );
            const basePrice = randomFromList( prices );
            price = basePrice;

            if ( randomBool() ) {
                price *= ( Math.random() + 1 )
                price = parseFloat( price.toFixed( 2 ));
            }
        }
        let name = optName;
        if ( !optName ) {
            switch ( type ) {
                case ItemTypes.JEWELRY:
                    name = randomFromList( JEWELRY_TYPES );
                    break;
                case ItemTypes.LIQUOR:
                    name = randomFromList( LIQUOR_TYPES );
                    break;
                case ItemTypes.HEALTHCARE:
                    name = randomFromList( HEALTHCARE_TYPES );
                    break;
            }
        }
        return {
            name, price, type
        };
    },

    createList( type, amountToCreate ) {
        const out   = [];
        const names = namesForType( type );

        for ( let i = 0; i < amountToCreate; ++i ) {
            out.push( ItemFactory.create( type, names[ i ] ));
        }
        return out;
    },

    /**
     * assemble a serialized JSON structure
     * back into an Item instance
     */
    assemble( data ) {
        return ItemFactory.create( data.t, data.n, data.p );
    },

    /**
     * serializes an Item instance into a JSON structure
     */
    disassemble( item ) {
        return {
            n: item.name,
            p: item.price,
            t: item.type
        };
    },
};
export default ItemFactory;

/* internal methods */

function namesForType( type ) {
    switch ( type ) {
        case ItemTypes.JEWELRY:
            return JEWELRY_TYPES;
        case ItemTypes.LIQUOR:
            return LIQUOR_TYPES;
        case ItemTypes.HEALTCHARE:
            return HEALTHCARE_TYPES;
    }
    return [];
}
