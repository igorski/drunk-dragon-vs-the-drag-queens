import cloneDeep          from "lodash/cloneDeep";
import merge              from "lodash/merge";
import EnvironmentActions from "@/model/actions/environment-actions";
import CharacterActions   from "@/model/actions/character-actions";
import InventoryActions   from "@/model/actions/inventory-actions";

// cancel the pending movements TODO: this should target the effect "owner"!
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
        addItemToInventory( state, item ) {
            const { items } = state.player.inventory;
            if ( !items.includes( item )) {
                items.push( item );
            }
        },
        removeItemFromInventory( state, item ) {
            const { items } = state.player.inventory;
            const index = items.indexOf( item );
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
            if ( intent.type !== item.type || intent.price > item.price ) {
                return false;
            }
            commit( "addItemToCharacterInventory", { item, character });
            commit( "removeItemFromInventory", item );
            return true;
        }
    },
};
