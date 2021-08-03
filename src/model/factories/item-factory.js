import PriceTypes, { getPriceTypeForPrice, getPriceRangeForItemType } from "@/definitions/price-types";
import { random, randomBool, randomFromList } from "@/utils/random-util";
import ItemTypes, {
    JEWELRY_TYPES, CLOTHING_TYPES, LIQUOR_TYPES, HEALTHCARE_TYPES,
    SHOE_HEELS, SHOE_SNEAKERS, SHOE_FLIPPERS, namesForType
} from "@/definitions/item-types";

const ItemFactory =
{
    create( type, optName = "", optPrice = -1 ) {
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
                case ItemTypes.CLOTHES:
                    name = randomFromList( CLOTHING_TYPES );
                    break;
            }
        }

        let price = optPrice;
        if ( price === -1 ) {
            price = getPriceForItem( type, name );
        }

        return {
            type, name, price
        };
    },

    /**
     * Creates a randomized list of given type.
     * The amountToCreate is the ideal amount, depending on the amount
     * of items and price ranges available for the type there is a deduplication
     * to prevent the same item name and price type appearing twice
     */
    createList( type, amountToCreate ) {
        const out   = [];
        const names = namesForType( type );

        for ( let i = 0; i < amountToCreate; ++i ) {
            const name = names[ i % names.length ];
            const item = ItemFactory.create( type, name );
            const priceType = getPriceTypeForPrice( item.price );
            // same item for same price type should not appear twice
            if ( !out.some( ci => ci.name === name && getPriceTypeForPrice( ci.price ) === priceType )) {
                out.push( item );
            }
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

function getPriceForItem( type, name ) {
    // some items have a deliberate price range as these items can provide a
    // big benefit to gameplay and should not occur in the early stages of the game
    switch ( type ) {
        default:
            break;
        case ItemTypes.CLOTHES:
            switch ( name ) {
                case SHOE_SNEAKERS:
                case SHOE_HEELS:
                    return PriceTypes.EXPENSIVE;
                case SHOE_FLIPPERS:
                    return PriceTypes.LUXURY;
            }
            break;
    }

    // randomize from base price defined in price range

    const prices    = getPriceRangeForItemType( type );
    const basePrice = randomFromList( prices );
    let price = basePrice;

    if ( randomBool() ) {
        price *= ( random() + 1 )
        price = parseFloat( price.toFixed( 2 ).replace( ".00", "" ));
    }
    return price;
}
