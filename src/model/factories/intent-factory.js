import Random     from 'random-seed';
import ItemTypes  from '@/definitions/item-types';
import PriceTypes from '@/definitions/price-types';

const IntentFactory = {
    create( type, price ) {
        return {
            type:  type  ?? randomFromList( Object.values( ItemTypes )),
            price: price ?? randomFromList( Object.values( PriceTypes ))
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Intent instance
     */
    assemble( data ) {
        return IntentFactory.create( data.t, data.p );
    },

    /**
     * serializes a Intent instance into a JSON structure
     */
    disassemble( intent ) {
        return {
            t: intent.type,
            p: intent.price
        };
    }
};
export default IntentFactory;

/* internal methods */

function randomFromList( list ) {
    const rand = Random.create();
    return list[ rand.intBetween( 0, list.length - 1 )];
}
