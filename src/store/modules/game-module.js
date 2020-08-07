import MD5                   from 'MD5';
import storage               from 'store/dist/store.modern';
import Vue                   from 'vue';
import AudioTracks           from '@/definitions/audio-tracks';
import BuildingFactory       from '@/model/factories/building-factory';
import CharacterFactory      from '@/model/factories/character-factory';
import EffectFactory         from '@/model/factories/effect-factory';
import GameFactory           from '@/model/factories/game-factory';
import IntentFactory         from '@/model/factories/intent-factory';
import WorldFactory          from '@/model/factories/world-factory';
import ShopFactory           from '@/model/factories/shop-factory';
import { renderEnvironment } from '@/services/environment-bitmap-cacher';
import SpriteCache           from '@/utils/sprite-cache';
import EffectActions         from '@/model/actions/effect-actions';
import {
    GAME_ACTIVE, GAME_PAUSED, GAME_OVER
} from '@/definitions/game-states';
import {
    GAME_START_TIME, GAME_TIME_RATIO, VALIDITY_CHECK_INTERVAL, isValidHourToBeOutside
} from '@/utils/time-util';
import {
    SCREEN_CHARACTER_CREATE, SCREEN_GAME, SCREEN_SHOP, SCREEN_CHARACTER_INTERACTION
} from '@/definitions/screens';

const STORAGE_KEY = 'rpg';

export default {
    state: {
        hash: '',
        world: null,
        activeEnvironment: null, // environment player is currently navigating
        building: null,          // currently entered building
        character: null,         // character currently interacting with
        shop: null,              // currently entered shop
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
        activeEnvironment: state => state.activeEnvironment,
        floor: state => state.building?.floor ?? NaN,
        shop: state => state.shop,
        character: state => state.character,
        hasSavedGame: state => () => !!storage.get( STORAGE_KEY ),
        isOutside: state => !state.building && !state.shop,
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
            state.building          = value.building;
            state.world             = value.world;
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
        setXPosition( state, value ) {
            state.activeEnvironment.x = value;
        },
        setYPosition( state, value ) {
            state.activeEnvironment.y = value;
        },
        setActiveEnvironment( state, environment ) {
            state.activeEnvironment = environment;
        },
        setCharacter( state, character ) {
            state.character = character;
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
        removeEffectsByMutation( state, types = [] ) {
            Vue.set( state, 'effects', state.effects.filter(({ mutation }) => !types.includes( mutation )));
        },
        removeEffectsByCallback( state, callbacks = [] ) {
            Vue.set( state, 'effects', state.effects.filter(({ callback }) => !callbacks.includes( callback )));
        },
        removeItemFromShop( state, item ) {
            const index = state.shop.items.indexOf( item );
            if ( index > -1 ) {
                state.shop.items.splice( index, 1 );
            }
        },
        removeCharacter( state, character ) {
            if ( state.character === character ) {
                state.character = null;
            }
            const { characters } = state.activeEnvironment;
            const index = characters.indexOf( character );
            if ( index > -1 ) {
                characters.splice( index, 1 );
            }
        },
        addItemToCharacterInventory( state, { item, character }) {
            const char = state.activeEnvironment.characters.find( c => character );
            if ( char ) {
                char.inventory.items.push( item );
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
                effects: [],
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
        interactWithCharacter({ state, commit }, character ) {
            let { intent } = character.properties;
            if ( !intent ) {
                character.properties.intent = IntentFactory.create();
            }
            commit( 'setCharacter', character );
            commit( 'setScreen', SCREEN_CHARACTER_INTERACTION );
        },
        enterShop({ state, getters, commit }, shop ) {
            if ( !shop.items.length ) {
                ShopFactory.generateItems( shop, 5 );
            }
            commit( 'setShop', shop );
            commit( 'setScreen', SCREEN_SHOP );
            commit( 'addEffect', EffectFactory.create(
                null, getters.gameTime, 30000, 0, 1, 'handleShopTimeout'
            ));
        },
        leaveShop({ commit }) {
            commit( 'removeEffectsByCallback', [ 'handleShopTimeout' ]);
        },
        handleShopTimeout({ commit, getters, dispatch }) {
            commit( 'openDialog', { message: getters.translate('timeouts.shop') });
            commit( 'setScreen', SCREEN_GAME );
            dispatch( 'leaveShop' );
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
        updateGame({ state, getters, commit, dispatch }, timestamp ) {
            if ( state.gameState !== GAME_ACTIVE ) {
                return;
            }
            // advance game time (values in milliseconds)
            const delta = ( timestamp - state.lastRender ) * GAME_TIME_RATIO;
            commit( 'advanceGameTime', delta );

            const gameTimestamp = getters.gameTime;

            if (( gameTimestamp - state.lastValidGameTime ) >= VALIDITY_CHECK_INTERVAL ) {
                if ( getters.isOutside && !isValidHourToBeOutside( gameTimestamp )) {
                    commit( 'setGameState', GAME_OVER );
                } else {
                    commit( 'setLastValidGameTime', gameTimestamp );
                }
            }

            // update the effects
            const updateFns = { commit, dispatch };
            state.effects.forEach( effect => {
                if ( EffectActions.update( updateFns, effect, gameTimestamp )) {
                    commit( 'removeEffect', effect );
                }
            });
            // update last render timestamp
            commit( 'setLastRender', timestamp );
        },
    },
};
