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
import SpriteCache           from '@/utils/sprite-cache';
import EffectActions         from '@/model/actions/effect-actions';
import { GAME_START_TIME, GAME_TIME_RATIO } from '@/utils/time-util';
import { SCREEN_CHARACTER_CREATE, SCREEN_SHOP } from '@/definitions/screens';

const STORAGE_KEY = 'rpg';

export default {
    state: {
        hash: '',
        world: null,
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
        gameTime: state => state.gameTime,
        activeEnvironment: state => state.activeEnvironment,
        floor: state => state.building?.floor ?? NaN,
        shop: state => state.shop,
        hasSavedGame: state => () => !!storage.get( STORAGE_KEY ),
    },
    mutations: {
        setGame( state, value ) {
            state.created       = value.created;
            state.modified      = value.modified;
            state.gameStart     = value.gameStart;
            state.hash          = value.hash;
            state.lastSavedTime = value.lastSavedTime;
            state.gameTime      = value.gameTime;
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
        removeItemFromShop( state, item ) {
            const index = state.shop.items.indexOf( item );
            if ( index > -1 ) {
                state.shop.items.splice( index, 1 );
            }
        },
        markVisitedTerrain( state, visitedTerrainIndices = [] ) {
            const { visitedTerrain } = state.activeEnvironment;
            visitedTerrainIndices.forEach( index => {
                if ( !visitedTerrain.includes( index )) {
                    visitedTerrain.push( index );
                }
            });
        },
        flushBitmaps( state ) {
            state.activeEnvironment.characters.forEach( character => {
                delete character.bitmap;
            });
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
            commit( 'setGame', {
                created: now,
                modified: now,
                gameStart: now,
                lastSavedTime: -1,
                gameTime: new Date( GAME_START_TIME ).getTime(),
                building: null,
                world,
                hash,
            });
            commit( 'setPlayer', player );
            commit( 'setLastRender', Date.now() );
            await dispatch( 'changeActiveEnvironment', world );
        },
        async loadGame({ state, commit, dispatch }) {
            const data = storage.get( STORAGE_KEY );
            try {
                const { game, player } = GameFactory.assemble( data );
                if ( data && ( !player || !game?.world )) {
                    // corrupted or outdated format
                    dispatch( 'resetGame' );
                    commit( 'setScreen', SCREEN_CHARACTER_CREATE );
                    return false;
                }
                commit( 'setGame', game );
                commit( 'setPlayer', player );
                let activeEnvironmentToSet = game.world;
                const { building } = game;
                if ( building ) {
                    // game was saved inside a building
                    activeEnvironmentToSet = building.floors[ building.floor ];
                }
                commit( 'setLastRender', Date.now() );
                await dispatch( 'changeActiveEnvironment', activeEnvironmentToSet );
            } catch {
                // likely corrupted or really outdated format
                return false;
            }
            return true;
        },
        async saveGame({ state, getters }) {
            const data = GameFactory.disassemble( state, getters.player );
            storage.set( STORAGE_KEY, data );
        },
        async importGame({ commit, dispatch }, data ) {
            const { game, player } = GameFactory.assemble( data );
            if ( game === null ) throw new Error(); // catch in calling component
            commit( 'setGame', game );
            commit( 'setPlayer', player );
            await dispatch( 'saveGame' );
            await dispatch( 'loadGame' );
        },
        async exportGame({ state }) {
            const data = GameFactory.disassemble( state, getters.player );
            const pom = document.createElement( 'a' );
            pom.setAttribute( 'href', `data:text/plain;charset=utf-8,${encodeURIComponent( data )}`);
            pom.setAttribute( 'download', 'savegame.rpg' );
            pom.click();
        },
        resetGame() {
            storage.remove( STORAGE_KEY );
        },
        /* navigation actions */
        enterShop({ state, commit }, shop ) {
            if ( !shop.items.length ) {
                ShopFactory.generateItems( shop, 5 );
            }
            commit( 'setShop', shop );
            commit( 'setScreen', SCREEN_SHOP );
        },
        async enterBuilding({ state, getters, commit, dispatch }, building ) {
            // generate levels, terrains and characters inside the building
            BuildingFactory.generateFloors( state.hash, building, getters.player );

            commit( 'setBuilding', building );

            // enter building at the first floor
            await dispatch( 'changeFloor', 0 );
            // change music to building theme
            dispatch( 'playSound', AudioTracks.BUILDING_THEME );
        },
        // change floor inside building
        async changeFloor({ state, commit, dispatch }, floor ) {
            const { floors } = state.building;
            const maxFloors  = floors.length;

            if ( floor >= maxFloors ) {
                // was final stair (elevator), go back down to overground
                dispatch( 'leaveBuilding' );
            } else {
                // ascend/descend to requested level
                commit( 'setFloor', floor );
                await dispatch( 'changeActiveEnvironment', floors[ floor ]);
            }
        },
        async leaveBuilding({ state, commit, dispatch }) {
            commit( 'setBuilding', null );
            SpriteCache.ENV_BUILDING.src = ''; // reset building level cache

            await dispatch( 'changeActiveEnvironment', state.world );

            // change music to overground theme
            dispatch( 'playSound', AudioTracks.OVERGROUND_THEME );
        },
        async changeActiveEnvironment({ state, getters, commit }, environment ) {
            if ( !!state.activeEnvironment ) {
                // free memory allocated to Bitmaps
                commit( 'flushBitmaps' );
            }
            commit( 'setActiveEnvironment', environment );
            commit( 'setLoading', true );
            await renderEnvironment( environment, getters.player );
            commit( 'setLoading', false );

            console.warn('TODO: WHEN CHANGING ACTIVE ENVIRONMENT RESET AI BEHAVIOUR');
        },
        /* game updates */
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
    },
};
