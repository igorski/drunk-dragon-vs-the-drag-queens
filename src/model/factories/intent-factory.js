import ItemTypes          from "@/definitions/item-types";
import PriceTypes         from "@/definitions/price-types";
import { randomFromList } from "@/utils/random-util";

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
