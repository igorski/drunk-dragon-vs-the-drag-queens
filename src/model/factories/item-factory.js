import ItemTypes  from '@/definitions/item-types';
import PriceTypes from '@/definitions/price-types';
import Random     from 'random-seed';

export default
{
    create( itemType, amountToCreate ) {
        const out = [];
        for ( let i = 0; i < amountToCreate; ++i ) {
            const rand = Random.create();
            const basePrice = rand.intBetween( 0, Object.keys( PriceTypes ).length - 1 );

            let price = basePrice;
            if ( rand.intBetween( 0, 1 ) === 0 ) {
                price *= ( Math.random() + 1 )
                price = parseFloat( price.toFixed( 2 ));
            }

            let type = '';
            switch ( itemType ) {
                case ItemTypes.JEWELRY:
                    break;
                case ItemTypes.LIQUOR:
                    break;
                case ItemTypes.HEALTHCARE:
                    break;
            }
            out.push({
                type, price
            });
        }
        return out;
    },

    /**
     * assemble a serialized JSON structure
     * back into an Item instance
     */
    assemble( data ) {
        return {
            type: data.t,
            price: data.p,
        };
    },

    /**
     * serializes an Item instance into a JSON structure
     */
    disassemble( item ) {
        return {
            t: item.type,
            p: item.price
        };
    },
};
