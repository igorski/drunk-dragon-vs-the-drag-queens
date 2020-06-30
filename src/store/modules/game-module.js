import MD5                   from 'MD5';
import AudioTracks           from '@/definitions/audio-tracks';
import CharacterFactory      from '@/model/factories/character-factory';
import WorldFactory          from '@/model/factories/world-factory';
import ShopFactory           from '@/model/factories/shop-factory';
import { renderEnvironment } from '@/services/environment-renderer';
import WorldCache            from '@/utils/world-cache';

export default {
    state: {
        hash: '',
        gameActive: false, // false == game over
        aiActive: false,
        world: null,
        player: null,
        activeEnvironment: null,
        cave: null,
        shop: null,
        created: 0,
        modified: 0,
        totalTime: 0,
        sessionStart: 0,
        renderStart: 0, // game render start time, see zCanvas
        effects: [],
    },
    getters: {
        gameActive: state => state.gameActive,
        activeEnvironment: state => state.activeEnvironment,
        player: state => state.player,
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
        setGame( state, value ) {
            state.created       = value.created;
            state.modified      = value.modified;
            state.sessionStart  = value.sessionStart;
            state.lastSavedTime = value.lastSavedTime;
            state.totalTime     = value.totalTime;
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
        setRenderStart( state, value ) {
            state.renderStart = value;
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
        async createGame({ state, commit }) {
            const now = Date.now();
            // generate unique hash for the world
            commit( 'setHash', MD5( now + Math.random() ));
            // create world
            const world = WorldFactory.createWorld();
            WorldFactory.populate( world, state.hash, true );
            // set game data
            commit( 'setGame', {
                created: now,
                modified: now,
                sessionStart: now,
                lastSavedTime: -1,
                totalTime: 0,
                gameActive: true,
                player: CharacterFactory.createPlayer(),
                cave: null,
                world,
            });
            commit( 'setActiveEnvironment', world );
            commit( 'setRenderStart', Date.now() );
            await renderEnvironment( state.activeEnvironment );
        },
        // enter given shop
        enterShop({ state, commit }, shop ) {
            ShopFactory.generateShopItems( shop, state.player );
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
                if ( effect.update( timestamp )) {
                    commit( 'removeEffect', effect );
                }
            });
        },
    },
};
