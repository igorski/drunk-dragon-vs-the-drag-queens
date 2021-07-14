import MD5              from "MD5";
import storage          from "store/dist/store.modern";
import Vue              from "vue";
import CharacterFactory from "@/model/factories/character-factory";
import GameFactory      from "@/model/factories/game-factory";
import WorldFactory     from "@/model/factories/world-factory";
import EffectActions    from "@/model/actions/effect-actions";
import {
    GAME_ACTIVE, GAME_PAUSED, GAME_OVER
} from "@/definitions/game-states";
import {
    GAME_START_TIME, GAME_TIME_RATIO, VALIDITY_CHECK_INTERVAL, isValidHourToBeOutside, isValidHourToBeInside
} from "@/utils/time-util";
import {
    SCREEN_CHARACTER_CREATE
} from "@/definitions/screens";

const STORAGE_KEY = "rpg";

export default {
    state: {
        hash: "",
        created: 0,
        modified: 0,
        gameStart: 0,    // timestamp at which the game was originally created
        gameTime: 0,     // timestamp of in-game Date (games always start at GAME_START_TIME)
        lastRender: 0,   // last render timestamp, see zCanvas
        lastValidGameTime: 0, // timestamp of the last game time update
        gameState: GAME_PAUSED,
        effects: [],
    },
    getters: {
        gameState: state => state.gameState,
        gameTime: state => state.gameTime,
        hasSavedGame: state => () => !!storage.get( STORAGE_KEY ),
        effects: state => state.effects,
    },
    mutations: {
        setGame( state, value ) {
            state.created           = value.created;
            state.modified          = value.modified;
            state.gameStart         = value.gameStart;
            state.hash              = value.hash;
            state.lastSavedTime     = value.lastSavedTime;
            state.gameTime          = value.gameTime;
            state.lastValidGameTime = value.gameTime;
            state.effects           = value.effects;
            state.gameState         = GAME_ACTIVE;
        },
        setGameState( state, value ) {
            state.gameState = value;
        },
        advanceGameTime( state, valueInMilliseconds ) {
            state.gameTime += valueInMilliseconds;
        },
        setLastValidGameTime( state, value ) {
            state.lastValidGameTime = value;
        },
        setLastRender( state, value ) {
            state.lastRender = value;
        },
        addEffect( state, value ) {
            if ( !state.effects.includes( value )) {
                state.effects.push( value );
            }
        },
        removeEffect( state, value ) {
            const idx = state.effects.indexOf( value );
            if ( idx >= 0 ) state.effects.splice( idx, 1 );
        },
        removeEffectsByMutation( state, types = [] ) {
            Vue.set( state, "effects", state.effects.filter(({ mutation }) => !types.includes( mutation )));
        },
        removeEffectsByCallback( state, callbacks = [] ) {
            Vue.set( state, "effects", state.effects.filter(({ callback }) => !callbacks.includes( callback )));
        },
        removeEffectsByTargetAndMutation( state, { target, types = [] }) {
            Vue.set(
                state, "effects",
                state.effects.filter( effect => {
                    return effect.target !== target || !types.includes( effect.mutation );
                })
            );
        },
    },
    actions: {
        /* game management / storage */
        async createGame({ commit, dispatch }, player = CharacterFactory.create() ) {
            const now = Date.now();
            // generate unique hash for the world
            const hash = MD5( now + Math.random());
            // create world
            const world = WorldFactory.create();
            WorldFactory.populate( world, hash );
            // set game data
            commit( "setGame", {
                created: now,
                modified: now,
                gameStart: now,
                lastSavedTime: -1,
                gameTime: new Date( GAME_START_TIME ).getTime(),
                building: null,
                effects: [],
                world,
                hash,
            });
            commit( "setBuilding", null);
            commit( "setWorld", world );
            commit( "setPlayer", player );
            commit( "setLastRender", Date.now() );
            await dispatch( "changeActiveEnvironment", world );
        },
        async loadGame({ state, commit, dispatch }) {
            const data = storage.get( STORAGE_KEY );
            try {
                const { game, world, building, player } = GameFactory.assemble( data );
                if ( !player || !world ) {
                    // corrupted or outdated format
                    dispatch( "resetGame" );
                    commit( "setScreen", SCREEN_CHARACTER_CREATE );
                    return false;
                }
                commit( "setGame", game );
                commit( "setBuilding", building );
                commit( "setWorld", world );
                commit( "setPlayer", player );
                const activeEnvironmentToSet = building?.floors[ building.floor ] ?? world;
                commit( "setLastRender", Date.now() );
                await dispatch( "changeActiveEnvironment", activeEnvironmentToSet );
            } catch {
                // likely corrupted or really outdated format
                return false;
            }
            return true;
        },
        async saveGame({ state, getters }) {
            const data = GameFactory.disassemble( state, getters.player, getters.world, getters.building );
            storage.set( STORAGE_KEY, data );
        },
        async importGame({ commit, dispatch }, data ) {
            const { game, world, building, player } = GameFactory.assemble( data );
            if ( game === null ) throw new Error(); // catch in calling component
            commit( "setGame", game );
            commit( "setBuilding", building );
            commit( "setWorld", world );
            commit( "setPlayer", player );
            await dispatch( "saveGame" );
            await dispatch( "loadGame" );
        },
        async exportGame({ state, getters }) {
            const data = GameFactory.disassemble( state, getters.player, getters.world, getters.building );
            const pom = document.createElement( "a" );
            pom.setAttribute( "href", `data:text/plain;charset=utf-8,${encodeURIComponent( data )}`);
            pom.setAttribute( "download", "savegame.rpg" );
            pom.click();
        },
        resetGame() {
            storage.remove( STORAGE_KEY );
        },
        /**
         * Hooks into the game's render loop. This updates the world environment
         * prior to each render cycle. Given timestamp is time at which the zCanvas
         * renderer invoked this update. By subtracting the lastRender state this
         * describes the elapsed time between two render iterations (ACTUAL time,
         * NOT game time, for which GAME_TIME_RATIO multiplier is necessary)
         */
        updateGame({ state, getters, commit, dispatch }, timestamp ) {
            if ( state.gameState !== GAME_ACTIVE ) {
                return;
            }
            // advance game time (values in milliseconds relative to game time, not actual render interval)
            const delta = ( timestamp - state.lastRender ) * GAME_TIME_RATIO;
            commit( "advanceGameTime", delta );

            const gameTimestamp = getters.gameTime;

            if (( gameTimestamp - state.lastValidGameTime ) >= VALIDITY_CHECK_INTERVAL ) {
                const date = new Date( gameTimestamp );
                if ( getters.isOutside && !isValidHourToBeOutside( date )) {
                    commit( "setGameState", GAME_OVER );
                } else if ( !getters.isOutside && !isValidHourToBeInside( date )) {
                    dispatch( "leaveBuilding" );
                    commit( "openDialog", { message: getters.translate("timeouts.building") });
                } else {
                    commit( "setLastValidGameTime", gameTimestamp );
                }
            }

            // update the effects
            const updateFns = { commit, dispatch };
            state.effects.forEach( effect => {
                if ( EffectActions.update( updateFns, effect, gameTimestamp )) {
                    commit( "removeEffect", effect );
                }
            });
            // update last render timestamp
            commit( "setLastRender", timestamp );
        },
    },
};
