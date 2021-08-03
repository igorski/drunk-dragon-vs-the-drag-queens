import ItemTypes, { getItemsForType } from "@/definitions/item-types";
import PriceTypes from "@/definitions/price-types";
import { randomFromList } from "@/utils/random-util";

const IntentFactory = {
    /**
     * Creates a "wanted" item
     * Unless specified, the item type and name will be randomized
     * from the available types.
     */
    create( type, name ) {
        type = type ?? randomFromList( Object.values( ItemTypes ));
        return {
            type,
            name : name  ?? randomFromList( getItemsForType( type ))
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Intent instance
     */
    assemble( data ) {
        return IntentFactory.create( data.t, data.n );
    },

    /**
     * serializes a Intent instance into a JSON structure
     */
    disassemble( intent ) {
        return {
            t: intent.type,
            n: intent.name
        };
    }
};
export default IntentFactory;
