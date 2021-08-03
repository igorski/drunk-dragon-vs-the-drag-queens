import ItemFactory        from "./item-factory";
import ItemTypes          from "@/definitions/item-types";
import WorldCache         from "@/utils/world-cache";
import { randomFromList } from "@/utils/random-util";

export const SHOP_TYPES = {
    PHARMACY: 0,
    LIQUOR: 1,
    JEWELLER: 2,
    CLOTHES: 3,
    PAWN: 4,
    DEALER: 5
};

const ShopFactory =
{
    /**
     * generate a new Shop
     *
     * @param {number} x position in the world
     * @param {number} y position in the world
     * @param {number=} type optional shop type @see SHOP_TYPES will be randomized when null
     * @param {Array<Object>=} items optional list of shop items
     * @param {number=} debt optional debt owed to the shop
     */
    create( x, y, type = null, items = [], debt = 0 ) {
        if ( type === null ) {
            type = randomFromList( Object.keys( SHOP_TYPES ));
        }
        const { width, height } = WorldCache.sizeShop;
        return {
            x, y, width, height, type, items, debt
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Shop instance
     */
    assemble( data ) {
        return ShopFactory.create(
            data.x, data.y, data.t, data.i.map( i => ItemFactory.assemble( i )), data.d
        );
    },

    /**
     * serializes a Shop instance into a JSON structure
     */
    disassemble( shop ) {
        return {
            x: shop.x,
            y: shop.y,
            t: shop.type,
            i: shop.items.map( i => ItemFactory.disassemble( i )),
            d: shop.debt
        };
    },

    /**
     * generate given Shops items
     *
     * @param {Object} aShop
     * @param {number} amountToCreate amount of items to generate
     */
    generateItems( shop, amountToCreate ) {
        let items;
        switch ( shop.type ) {
            case SHOP_TYPES.PHARMACY:
                items = ItemFactory.createList( ItemTypes.HEALTHCARE, amountToCreate );
                break;
            case SHOP_TYPES.JEWELLER:
                items = ItemFactory.createList( ItemTypes.JEWELRY, amountToCreate );
                break;
            case SHOP_TYPES.CLOTHES:
                items = ItemFactory.createList( ItemTypes.CLOTHES, amountToCreate );
                break;
            case SHOP_TYPES.LIQUOR:
                items = ItemFactory.createList( ItemTypes.LIQUOR, amountToCreate );
                break;
            case SHOP_TYPES.DEALER:
                items = ItemFactory.createList( ItemTypes.DRUGS, amountToCreate );
                break;
            default:
            case SHOP_TYPES.PAWN:
                // no items
                return;
        }
        shop.items.push( ...items );
    }
};
export default ShopFactory;
