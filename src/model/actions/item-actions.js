import PriceTypes, { getItemEffectivityByPriceType } from "@/definitions/price-types";
import ItemTypes from "@/definitions/item-types";

export default {
    applyItemToPlayer({ commit }, item, player ) {
        const priceType = getItemEffectivityByPriceType( item.price );
        switch ( item.type ) {
            default:
                throw new Error( `item type "%{item.type}" not implemented"` );
            case ItemTypes.HEALTHCARE:
                const effectivityRange = [ 5, 10, 25, 50 ];
                const hpToApply = effectivityRange[ priceType ];
                commit( "updatePlayer", {
                    hp: ( Math.min( player.hp + hpToApply, player.maxHp ))
                });
                break;
        }
    }
};
