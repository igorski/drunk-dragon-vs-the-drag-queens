import merge     from "lodash/merge";
import cloneDeep from "lodash/cloneDeep";

export default {
    state: {
        opponent: null,
    },
    getters: {
        opponent: state => state.opponent,
    },
    mutations: {
        setOpponent( state, opponent ) {
            state.opponent = opponent;
        },
        updateOpponent( state, opponent ) {
            state.opponent = merge( cloneDeep( state.opponent ), opponent );
        },
    }
};
