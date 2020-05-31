import AudioTracks from '@/definitions/audio-tracks';
import WorldFactory from '@/model/world-factory';
import ShopFactory from '@/model/shop-factory';
import WorldCache from '@/utils/world-cache';

// internal timers
let _aiTimer;

export default {
    state: {
        hash: '',
        gameActive: false, // false == game over, TODO: make enum which also triggers AI updates
        aiActive: false,
        world: WorldFactory.createWorld(),
        player: null,
        activeEnvironment: null,
        cave: null,
        shop: null,
        created: 0,
        modified: 0,
        totalTime: 0,
        sessionStart: 0,
    },
    getters: {
        gameActive: state => state.gameActive,
        activeEnvironment: state => state.activeEnvironment,
        player: state => state.player,
    },
    mutations: {
        setGameActive( state, value ) {
           state.gameActive = !!value;

            if ( !state.gameState )
                this.setEnemyAI( false );
        },
        setShop( state, shop ) {
            state.shop = shop;
        },
        setActiveEnvironment( state, environment ) {
            state.activeEnvironment = environment;
        },
        setCave( state, cave ) {
            state.cave = cave;
        },
    },
    actions: {
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
        }
    },
};
