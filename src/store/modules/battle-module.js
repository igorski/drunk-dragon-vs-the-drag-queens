import merge            from "lodash/merge";
import cloneDeep        from "lodash/cloneDeep";
import { XP_PER_LEVEL } from "@/definitions/constants";
import { GAME_OVER }    from "@/definitions/game-states";
import { SCREEN_GAME }  from "@/definitions/screens";
import { random }       from "@/utils/random-util";
import { getDamageForAttack } from "@/model/factories/attack-factory";

function updateHP( damage, currentHP ) {
    return Math.max( 0, currentHP - damage );
}

export default {
    state: {
        opponent: null,
        playerTurn: false,
        battleWon: false,
        award: 1, // XP awarded when defeating opponent
    },
    getters: {
        opponent: state => state.opponent,
        playerTurn: state => state.playerTurn,
        battleWon: state => state.battleWon,
    },
    mutations: {
        setOpponent( state, opponent ) {
            state.opponent = opponent;
        },
        setAward( state, award ) {
            state.award = award;
        },
        updateOpponent( state, opponent ) {
            state.opponent = merge( cloneDeep( state.opponent ), opponent );
        },
        setPlayerTurn( state, value ) {
            state.playerTurn = !!value;
        },
        setBattleWon( state, value ) {
            state.battleWon = value;
        },
    },
    actions: {
        attackOpponent({ state, getters, commit, dispatch }, { type }) {
            commit( "setPlayerTurn", false );
            const damage = getDamageForAttack( getters.player, state.opponent, type );
            const hp = updateHP( damage, state.opponent.hp );
            commit( "updateOpponent", { hp });
            if ( hp === 0 ) {
                dispatch( "resolveBattle" );
            }
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
        attackPlayer({ state, getters, commit, dispatch }, { type }) {
            const damage = getDamageForAttack( state.opponent, getters.player, type );
            const hp = updateHP( damage, getters.player.hp );
            commit( "updatePlayer", { hp });
            const playerAlive = hp > 0;
            commit( "setPlayerTurn", playerAlive );
            if ( !playerAlive ) {
                dispatch( "resolveBattle" );
            }
            return damage;
        },
        startBattle({ commit }, opponent ) {
            commit( "setBattleWon", false );
            commit( "setOpponent", opponent );
            commit( "setAward", 15 ); // TODO
        },
        resolveBattle({ state, getters, commit }) {
            const { opponent } = state;
            // battle is resolved when the player or opponent have depleted their HP
            if ( opponent.hp === 0 ) {
                // player won
                commit( "awardXP", state.award );
                const { level, xp } = getters.player;
                const nextLevel = XP_PER_LEVEL + (( XP_PER_LEVEL * level ) * ( level - 1 ));
                if (( xp - nextLevel ) >= 0 ) {
                    // level up as enough XP was gathered
                    commit( "setPlayerLevel", level + 1 );
                }
                commit( "setBattleWon", true );
            } else if ( getters.player.hp === 0 ) {
                commit( "setGameState", GAME_OVER );
            }
        }
    },
};
