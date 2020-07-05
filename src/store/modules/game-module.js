import MD5                   from 'MD5';
import storage               from 'store/dist/store.modern';
import AudioTracks           from '@/definitions/audio-tracks';
import CharacterFactory      from '@/model/factories/character-factory';
import GameFactory           from '@/model/factories/game-factory';
import WorldFactory          from '@/model/factories/world-factory';
import ShopFactory           from '@/model/factories/shop-factory';
import { renderEnvironment } from '@/services/environment-renderer';
import WorldCache            from '@/utils/world-cache';
import EffectActions         from '@/model/actions/effect-actions';
import { GAME_START_TIME, GAME_TIME_RATIO } from '@/utils/time-util';

const STORAGE_KEY = 'rpg';

export default {
    state: {
        hash: '',
        gameActive: false, // false == game over
        world: null,
        player: null,
        activeEnvironment: null,
        cave: null,
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
        player: state => state.player,
        hasSavedGame: state => () => !!storage.get( STORAGE_KEY ),
    },
    mutations: {
        setGameActive( state, value ) {
           state.gameActive = !!value;
        },
        setPlayer( state, value ) {
            state.player = value;
        },
        setPlayerPosition( state, { x, y }) {
            state.player.x = x;
            state.player.y = y;
        },
        setEnvironmentPosition( state, { x, y }) {
            state.activeEnvironment.x = x;
            state.activeEnvironment.y = y;
        },
        setHash( state, value ) {
            state.hash = value;
        },
        advanceGameTime( state, valueInMilliseconds ) {
            state.gameTime += valueInMilliseconds;
        },
        setGame( state, value ) {
            state.created       = value.created;
            state.modified      = value.modified;
            state.gameStart     = value.gameStart;
            state.lastSavedTime = value.lastSavedTime;
            state.gameTime      = value.gameTime;
            state.gameActive    = !!value.gameActive;
            state.player        = value.player;
            state.cave          = value.cave;
            state.world         = value.world;
        },
        setShop( state, shop ) {
            state.shop = shop;
        },
        setActiveEnvironment( state, environment ) {
            state.activeEnvironment = environment;
        },
        setWorld( state, world ) {
            state.world = world;
        },
        setCave( state, cave ) {
            state.cave = cave;
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
        }
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
                cave: null,
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
            this.broadcast( Notifications.Navigation.OPEN_PAGE, ShopView );
        },
        // enter given cave
        enterCave({ state, commit }, cave ) {
            // generate levels, terrains and enemies inside the cave
            CaveFactory.generateCaveLevels( state.hash, cave, state.player );
            commit( 'setCave', cave );
            commit( 'setActiveEnvironment', cave );

            // we're entering a new cave, clear existing opponents from the cache
            WorldCache.clearPositionsOfType( Opponent );

            // enter cave at the right level
            this.broadcast( Notifications.Game.ENTER_CAVE_LEVEL, gameModel.cave.level );
            // change music to cave theme
            dispatch( 'playSound', AudioTracks.CAVE_THEME );
        },
        // descend deeper into/leave given cave
        enterCaveTunnel({ state, dispatch }, cave ) {
            const maxLevels = cave.levels.length;

            if ( cave.level === ( maxLevels - 1 )) {
                // was final tunnel, go back up to overground
                dispatch('enterOverground');
            } else {
                // descend to next level
                this.broadcast( Notifications.Game.ENTER_CAVE_LEVEL, cave.level + 1 );
            }
        },
        enterOverground({ state, commit, dispatch }) {
            if ( !state.gameState ) return; // game is over

            commit.setCave( null );
            SpriteCache.CAVE_LEVEL.src = ''; // reset cave level cache

            commit('setActiveEnvironment', state.world );
            // change music to overground theme
            dispatch( 'playSound', AudioTracks.OVERGROUND_THEME );
        },
        /**
         * Hooks into the game's render loop. This updates the world environment
         * prior to each render cycle. Given timestamp is the renderers timestamp
         * which relative to the renderStart timestamp defines the relative time.
         */
        updateGame({ state, commit }, timestamp ) {
            // update the effects
            state.effects.forEach( effect => {
                if ( EffectActions.update( effect, timestamp )) {
                    commit( 'removeEffect', effect );
                }
            });
            // advance game time (values in milliseconds)
            const delta = ( timestamp - state.lastRender ) * GAME_TIME_RATIO;
            commit( 'advanceGameTime', delta );

            commit( 'setLastRender', timestamp );
        },
        async loadGame({ state, commit }) {
            const data = storage.get( STORAGE_KEY );
            try {
                const game = GameFactory.assemble( data );
                commit( 'setGame', game );
                commit( 'setHash', game.hash );
                commit( 'setActiveEnvironment', game.world );
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
        resetGame() {
            storage.remove( STORAGE_KEY );
        }
    },
};
