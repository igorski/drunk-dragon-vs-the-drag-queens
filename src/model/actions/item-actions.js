import PriceTypes, { getItemEffectivityByPriceType } from "@/definitions/price-types";
import ItemTypes from "@/definitions/item-types";

export default {
    applyItemToPlayer({ commit }, item, player ) {
        const priceType = getItemEffectivityByPriceType( item );

        switch ( item.type ) {
            default:
                if ( process.env.NODE_ENV === "development" ) {
                    throw new Error( `item type "%{item.type}" not implemented"` );
                }
                break;
            case ItemTypes.HEALTHCARE:
                const effectivityRange = [ 5, 25 ];
                const hpToApply = effectivityRange[ priceType ];
                commit( "updatePlayer", {
                    hp: ( Math.min( player.hp + hpToApply, player.maxHp ))
                });
                break;
        }
    }
};
