import ItemFactory from './item-factory';
import ItemTypes   from '@/definitions/item-types';
import WorldCache  from '@/utils/world-cache';
import Random      from 'random-seed';

export const SHOP_TYPES = {
    PHARMACY: 0,
    LIQUOR: 1,
    JEWELLER: 2,
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
     */
    create( x, y, type = null, items = [] ) {
        if ( type === null ) {
            const rand = Random.create();
            type = rand.intBetween( 0, Object.keys( SHOP_TYPES ).length - 1 );
        }
        const { width, height } = WorldCache.sizeShop;
        return {
            x, y, width, height, type, items
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into a Shop instance
     */
    assemble( data ) {
        return ShopFactory.create(
            data.x, data.y, data.t, data.i.map( i => ItemFactory.assemble( i ))
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
            i: shop.items.map( i => ItemFactory.disassemble( i ))
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
                items = ItemFactory.create( ItemTypes.HEALTHCARE, amountToCreate );
                break;
            case SHOP_TYPES.JEWELLER:
                items = ItemFactory.create( ItemTypes.JEWELRY, amountToCreate );
                break;
            case SHOP_TYPES.LIQUOR:
                items = ItemFactory.create( ItemTypes.LIQUOR, amountToCreate );
                break;
        }
        shop.items.push( ...items );
    }
};
export default ShopFactory;
