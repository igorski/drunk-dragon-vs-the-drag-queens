import MD5                   from 'MD5';
import storage               from 'store/dist/store.modern';
import Vue                   from 'vue';
import AudioTracks           from '@/definitions/audio-tracks';
import BuildingFactory       from '@/model/factories/building-factory';
import CharacterFactory      from '@/model/factories/character-factory';
import GameFactory           from '@/model/factories/game-factory';
import WorldFactory          from '@/model/factories/world-factory';
import ShopFactory           from '@/model/factories/shop-factory';
import { renderEnvironment } from '@/services/environment-bitmap-cacher';
import WorldCache            from '@/utils/world-cache';
import EffectActions         from '@/model/actions/effect-actions';
import { GAME_START_TIME, GAME_TIME_RATIO } from '@/utils/time-util';
import { SCREEN_SHOP } from '@/definitions/screens';

const STORAGE_KEY = 'rpg';

export default {
    state: {
        hash: '',
        gameActive: false, // false == game over
        world: null,
        player: null,
        activeEnvironment: null,
        building: null,
        shop: null,
        created: 0,
        modified: 0,
        gameStart: 0,   // timestamp at which the game was originally created
        gameTime: 0,    // timestamp of in-game Date (games always start at GAME_START_TIME)
        lastRender: 0,  // last render timestamp, see zCanvas
        effects: [],
    },
    getters: {
        gameActive: state => state.gameActive,
        gameTime: state => state.gameTime,
        activeEnvironment: state => state.activeEnvironment,
        shop: state => state.shop,
        player: state => state.player,
        hasSavedGame: state => () => !!storage.get( STORAGE_KEY ),
    },
    mutations: {
        setGameActive( state, value ) {
           state.gameActive = !!value;
        },
        setHash( state, value ) {
            state.hash = value;
        },
        setGame( state, value ) {
            state.created       = value.created;
            state.modified      = value.modified;
            state.gameStart     = value.gameStart;
            state.lastSavedTime = value.lastSavedTime;
            state.gameTime      = value.gameTime;
            state.gameActive    = !!value.gameActive;
            state.player        = value.player;
            state.building      = value.building;
            state.world         = value.world;
        },
        advanceGameTime( state, valueInMilliseconds ) {
            state.gameTime += valueInMilliseconds;
        },
        setLastRender( state, value ) {
            state.lastRender = value;
        },
        setXPosition( state, value ) {
            state.activeEnvironment.x = value;
        },
        setYPosition( state, value ) {
            state.activeEnvironment.y = value;
        },
        setActiveEnvironment( state, environment ) {
            state.activeEnvironment = environment;
            console.warn('CHANGING ENVIRONMENT RESET AI BEHAVIOUR');
        },
        setShop( state, shop ) {
            state.shop = shop;
        },
        setBuilding( state, building ) {
            state.building = building;
        },
        setFloor( state, floor ) {
            state.building.floor = floor;
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
        removeEffectsByAction( state, types = [] ) {
            Vue.set( state, 'effects', state.effects.filter(({ action }) => !types.includes( action )));
        },
    },
    actions: {
        async createGame({ state, commit }, player = CharacterFactory.create() ) {
            const now = Date.now();
            // generate unique hash for the world
            commit( 'setHash', MD5( now + Math.random() ));
            // create world
            const world = WorldFactory.create();
            WorldFactory.populate( world, state.hash, true );
            // set game data
            commit( 'setGame', {
                created: now,
                modified: now,
                gameStart: now,
                lastSavedTime: -1,
                gameTime: new Date( GAME_START_TIME ).getTime(),
                gameActive: true,
                building: null,
                player,
                world,
            });
            commit( 'setActiveEnvironment', world );
            commit( 'setLastRender', Date.now() );
            await renderEnvironment( state.activeEnvironment );
        },
        // enter given shop
        enterShop({ state, commit }, shop ) {
            ShopFactory.create( shop, state.player );
            commit( 'setShop', shop );
            commit( 'setScreen', SCREEN_SHOP );
        },
        // enter given building
        async enterBuilding({ state, commit, dispatch }, building ) {
            // generate levels, terrains and enemies inside the building
            BuildingFactory.generateFloors( state.hash, building, state.player );

            commit( 'setBuilding', building );

            // enter building at the first floor
            await dispatch( 'changeFloor', { building, floor: 0  });
            // change music to building theme
            dispatch( 'playSound', AudioTracks.BUILDING_THEME );
        },
        // change floor inside building
        async changeFloor({ state, commit, dispatch }, { building, floor }) {
            const maxFloors = building.floors.length;

            if ( floor >= ( maxFloors - 1 )) {
                // was final tunnel, go back up to overground
                dispatch( 'leaveBuilding' );
            } else {
                // ascend/descend to requested level
                commit( 'setFloor', floor );
                commit( 'setActiveEnvironment', floor );
                // render floor Bitmap
                commit( 'setLoading', true );
                await renderEnvironment( state.activeEnvironment );
                commit( 'setLoading', false );
            }
        },
        leaveBuilding({ state, commit, dispatch }) {
            if ( !state.gameState ) return; // game is over

            commit.setBuilding( null );
            SpriteCache.BUILDING.src = ''; // reset building level cache

            commit('setActiveEnvironment', state.world );
            // change music to overground theme
            dispatch( 'playSound', AudioTracks.OVERGROUND_THEME );
        },
        /**
         * Hooks into the game's render loop. This updates the world environment
         * prior to each render cycle. Given timestamp is the renderers timestamp
         * which relative to the renderStart timestamp defines the relative time.
         */
        updateGame({ state, getters, commit }, timestamp ) {
            // advance game time (values in milliseconds)
            const delta = ( timestamp - state.lastRender ) * GAME_TIME_RATIO;
            commit( 'advanceGameTime', delta );

            const gameTimestamp = getters.gameTime;

            // update the effects
            state.effects.forEach( effect => {
                if ( EffectActions.update( effect, gameTimestamp )) {
                    commit( 'removeEffect', effect );
                }
            });

            commit( 'setLastRender', timestamp );
        },
        async loadGame({ state, commit }) {
            const data = storage.get( STORAGE_KEY );
            try {
                const game = GameFactory.assemble( data );
                commit( 'setGame', game );
                commit( 'setHash', game.hash );
                let activeEnvironmentToSet = game.world;
                const { building } = game;
                if ( building ) {
                    // game was saved inside a building
                    activeEnvironmentToSet = building.floors[ building.floor ];
                }
                commit( 'setActiveEnvironment', activeEnvironmentToSet );
                commit( 'setLastRender', Date.now() );

                await renderEnvironment( state.activeEnvironment );
            } catch {
                // TODO : show message of disappointment
            }
        },
        async saveGame({ state }) {
            const data = GameFactory.disassemble( state );
            storage.set( STORAGE_KEY, data );
        },
        async importGame({ commit, dispatch }, data ) {
            const game = GameFactory.assemble( data );
            if ( game === null ) throw new Error(); // catch in calling component
            commit( 'setGame', game );
            commit( 'setHash', game.hash );
            await dispatch( 'saveGame' );
            await dispatch( 'loadGame' );
        },
        async exportGame({ state }) {
            const data = GameFactory.disassemble( state );
            const pom = document.createElement( 'a' );
            pom.setAttribute( 'href', `data:text/plain;charset=utf-8,${encodeURIComponent( data )}`);
            pom.setAttribute( 'download', 'savegame.rpg' );
            pom.click();
        },
        resetGame() {
            storage.remove( STORAGE_KEY );
        }
    },
};
