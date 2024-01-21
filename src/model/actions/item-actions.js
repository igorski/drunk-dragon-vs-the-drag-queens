import { HOUR, TWENTY_FOUR_HOURS } from "@/definitions/constants";
import { getItemEffectivityByPriceType } from "@/definitions/price-types";
import ItemTypes from "@/definitions/item-types";
import EffectFactory from "@/model/factories/effect-factory";

export default {
    applyItemToPlayer({ getters, commit }, item, player ) {
        const priceType = getItemEffectivityByPriceType( item );
        let effectivityRange;

        switch ( item.type ) {
            default:
                if ( process.env.NODE_ENV === "development" ) {
                    throw new Error( `item type "%{item.type}" not implemented"` );
                }
                break;

            case ItemTypes.HEALTHCARE:
                effectivityRange = [ 10, 50 ];
                commit( "updatePlayer", {
                    hp: ( Math.min( player.hp + effectivityRange[ priceType ], player.maxHp ))
                });
                break;

            case ItemTypes.LIQUOR:
                effectivityRange = [ 0.25, 0.75 ];
                const intoxication = Math.min( 1, effectivityRange[ priceType ] + player.properties.intoxication );
                commit( "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setIntoxication" ]});
                commit( "setIntoxication", { value: intoxication });
                // start "sobering up" effect
                commit( "addEffect", EffectFactory.create(
                    "setIntoxication", getters.gameTime, TWENTY_FOUR_HOURS * intoxication, intoxication, 0, "soberUp", player.id
                ));
                break;

            case ItemTypes.DRUGS:
                effectivityRange = [ 0.25, 1.0 ];
                const boost = Math.min( 1, effectivityRange[ priceType ] + player.properties.boost );
                commit( "removeEffectsByTargetAndMutation", { target: player.id, types: [ "setBoost" ]});
                commit( "setBoost", { value: boost });
                // start "sobering up" effect
                commit( "addEffect", EffectFactory.create(
                    "setBoost", getters.gameTime, HOUR * boost, boost, 0, "cleanUp", player.id
                ));
                break;

            case ItemTypes.FOOD:
                effectivityRange = [ 5, 10 ];
                commit( "updatePlayer", {
                    hp: ( Math.min( player.hp + effectivityRange[ priceType ], player.maxHp ))
                });
                break;
        }
    }
};
