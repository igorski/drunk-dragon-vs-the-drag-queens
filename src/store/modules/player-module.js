import cloneDeep           from "lodash/cloneDeep";
import merge               from "lodash/merge";
import isEqual             from "lodash/isEqual";
import { DRAB }            from "@/definitions/character-types";
import { GAME_START_HOUR } from "@/definitions/constants";
import { GAME_OVER }       from "@/definitions/game-states";
import { SCREEN_GAME }     from "@/definitions/screens";
import EnvironmentActions  from "@/model/actions/environment-actions";
import CharacterActions    from "@/model/actions/character-actions";
import InventoryActions    from "@/model/actions/inventory-actions";
import EffectFactory       from "@/model/factories/effect-factory";
import { WORLD_TYPE }      from "@/model/factories/world-factory";

// cancel the pending player movements
const cancelPendingMovement = commit => {
    commit( "removeEffectsByMutation", [ "setXPosition", "setYPosition" ]);
};

/**
 * Player module mediates all interactions the game"s Player can take. As it is
 * part of the current sessions interaction, it is separate from the game module
 * (which owns the Player as part of the game"s context)
 */
export default
{
    state: {
        player: null,
        onMoveUpdate: null,
    },
    getters: {
        player: state => state.player,
        debt: ( state, getters ) => {
            console.warn("calculating debt");
            if ( getters.activeEnvironment.type !== WORLD_TYPE ) {
                return [];
            }
            return getters.activeEnvironment.shops.reduce(( acc, shop ) => {
                if ( shop.debt > 0 ) {
                    const endTime = getters.effects.find(({ target }) => target === shop.id )?.endValue;
                    if ( endTime ) {
                        acc.push({ shop, endTime });
                    }
                }
                return acc;
            }, []);
        }
    },
    mutations: {
        setPlayer( state, player ) {
            state.player = player;
        },
        updatePlayer( state, player ) {
            state.player = merge( cloneDeep( state.player ), player );
        },
        deductCash( state, amount ) {
            state.player.inventory.cash -= amount;
        },
        awardCash( state, amount ) {
            state.player.inventory.cash += amount;
        },
        awardXP( state, xp ) {
            state.player.xp += xp;
        },
        setPlayerLevel( state, level ) {
            state.player.level = level;
        },
        setIntoxication( state, { value }) {
            state.player.properties.intoxication = value;
        },
        setBoost( state, { value }) {
            state.player.properties.boost = value;
        },
        addItemToInventory( state, item ) {
            const { items } = state.player.inventory;
            if ( !items.includes( item )) {
                items.push( item );
            }
        },
        removeItemFromInventory( state, item ) {
            const { items } = state.player.inventory;
            const index = items.findIndex( compare => isEqual( compare, item ));
            if ( index > -1 ) {
                items.splice( index, 1 );
            }
        },
        setOnMovementUpdate( state, fn ) {
            state.onMoveUpdate = fn;
        },
    },
    actions: {
        moveToDestination({ state, getters, commit }, { x, y, onProgress = null }) {
            const character = state.player;
            const { activeEnvironment } = getters;
            commit( "setOnMovementUpdate", onProgress );

            const xMutation = "setXPosition";
            const yMutation = "setYPosition";

            // get existing movements so we can seemlessly update these to the new destination
            const existing = getters.effects.filter(({ target, mutation }) => {
                return target === character.id && ( mutation === xMutation || mutation === yMutation );
            });

            // enqueue the waypoints
            return EnvironmentActions.moveCharacter(
                { commit, getters }, { ...character, x: activeEnvironment.x, y: activeEnvironment.y },
                activeEnvironment, x, y, existing, xMutation, yMutation, "handleMoveUpdate"
            );
        },
        handleMoveUpdate({ state, dispatch, commit, getters }) {
            if ( EnvironmentActions.hitTest({ dispatch, commit, getters }, getters.activeEnvironment )) {
                cancelPendingMovement( commit );
            }
            dispatch( "updateCharacters" ); // TODO: should be somewhere more intelligently done
            typeof state.onMoveUpdate === "function" && state.onMoveUpdate();
        },
        buyItem({ state, commit }, item ) {
            if ( state.player.inventory.cash < item.price ) {
                return false;
            }
            commit( "deductCash", item.price );
            commit( "removeItemFromShop", item );
            commit( "addItemToInventory", item );

            return true;
        },
        sellItem({ state, commit }, { item, price }) {
            commit( "awardCash", price );
            // make item more expensive to buy back ;)
            item.price = InventoryActions.getPriceForItemSale({ ...item, price }, 1, 1.5 );
            commit( "addItemToShop", item );
            commit( "removeItemFromInventory", item );
        },
        giveItemToCharacter({ commit }, { item, character }) {
            const { intent } = character.properties;
            if ( intent.type !== item.type || intent.name !== item.name ) {
                return false;
            }
            commit( "addItemToCharacterInventory", { item, character });
            commit( "removeItemFromInventory", item );
            return true;
        },
        loanMoney({ commit, getters }, { duration, amount }) {
            const { gameTime, shop } = getters;
            commit( "awardCash",   amount );
            commit( "setShopDebt", amount );
            commit( "addEffect", EffectFactory.create(
                null, gameTime, duration, gameTime, gameTime + duration, "handleLoanTimeout", shop.id
            ));
        },
        payBackLoan({ getters, commit }, amount ) {
            commit( "deductCash", amount );
            commit( "setShopDebt", 0 );
            commit( "removeEffectsByTarget", getters.shop.id );
        },
        async bookHotelRoom({ state, getters, commit, dispatch }, hotel ) {
            const { player } = state;
            if ( player.inventory.cash < hotel.price ) {
                return false;
            }
            // advance clock to next valid time tomorrow
            const date = new Date( getters.gameTime );
            if ( date.getUTCHours() >= GAME_START_HOUR ) {
                date.setDate( date.getDate() + 1 );
            }
            date.setUTCHours( GAME_START_HOUR );
            date.setUTCMinutes( 0 );
            date.setUTCSeconds( 0 );
            const timestamp = date.getTime();
            commit( "setGameTime", timestamp );
            commit( "setLastValidGameTime", timestamp );

            // restore HP
            commit( "updatePlayer", { hp: player.maxHp })

            // pay hotel and leave building
            commit( "deductCash", hotel.price );
            commit( "setHotel", null );
            commit( "setScreen", SCREEN_GAME );
            await dispatch( "leaveBuilding" );
            commit( "removeCharactersOfType", DRAB ); // drabs only appear after midnight
            if ( player.properties.intoxication > 0 ) {
                dispatch( "soberUp" );
            }
            if ( player.properties.boost > 0 ) {
                dispatch( "cleanUp" );
            }
            commit( "openDialog", { message: getters.translate( "messages.stayedTheNight" ) });

            return true;
        },
        soberUp({ state, getters, commit }) {
            commit( "removeEffectsByTargetAndMutation", { target: state.player.id, types: [ "setIntoxication" ]});
            commit( "setIntoxication", { value: 0 });
            commit( "showNotification", getters.translate( "timeouts.soberedUp" ));
        },
        cleanUp({ state, getters, commit }) {
            commit( "removeEffectsByTargetAndMutation", { target: state.player.id, types: [ "setBoost" ]});
            commit( "setBoost", { value: 0 });
            commit( "showNotification", getters.translate( "timeouts.cleanedUp" ));
        },
        handleLoanTimeout({ commit, getters }) {
            commit( "updatePlayer", { hp: 0 });
            commit( "setGameState", GAME_OVER );
            commit( "openDialog", { message: getters.translate( "timeouts.loan" ) });
        }
    },
};
