import merge           from "lodash/merge";
import cloneDeep       from "lodash/cloneDeep";
import { SCREEN_GAME } from "@/definitions/screens";
import { random }      from "@/utils/random-util";
import { getDamageForAttack } from "@/model/factories/attack-factory";

function updateHP( damage, currentHP ) {
    return Math.max( 0, currentHP - damage );
}

export default {
    state: {
        opponent: null,
        playerTurn: false,
    },
    getters: {
        opponent: state => state.opponent,
        playerTurn: state => state.playerTurn,
    },
    mutations: {
        setOpponent( state, opponent ) {
            state.opponent = opponent;
        },
        updateOpponent( state, opponent ) {
            state.opponent = merge( cloneDeep( state.opponent ), opponent );
        },
        setPlayerTurn( state, value ) {
            state.playerTurn = !!value;
        },
    },
    actions: {
        attackOpponent({ state, getters, commit }, { type }) {
            commit( "setPlayerTurn", false );
            const damage = getDamageForAttack( getters.player, state.opponent, type );
            commit( "updateOpponent", { hp: updateHP( damage, state.opponent.hp ) });
            return damage;
        },
        runFromOpponent({ state, getters, commit }) {
            commit( "setPlayerTurn", false );
            const { level, properties } = getters.player;
            const { opponent } = state;
            if ( properties.intoxication > 0.75 ) {
                return false; // too drunk to run
            }
            // players starting out are awarded a break
            // otherwise apply some randomization against the players boost status
            const success = level === 1 ? true : (( properties.boost + 1 ) * random() ) > 0.5;
            if ( success ) {
                commit( "setOpponent", null );
                commit( "setScreen", SCREEN_GAME );
            }
            return success;
        },
        attackPlayer({ state, getters, commit }, { type }) {
            const damage = getDamageForAttack( state.opponent, getters.player, type );
            const hp = updateHP( damage, getters.player.hp );
            commit( "updatePlayer", { hp });
            commit( "setPlayerTurn", hp > 0 );
            return damage;
        },
    },
};
