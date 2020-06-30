import Vue    from 'vue';
import Vuex   from 'vuex';
import audio  from './modules/audio-module';
import game   from './modules/game-module';
import player from './modules/player-module';

Vue.use( Vuex );

// internal timers
let _saveTimer;

export default new Vuex.Store({
    modules: {
        audio,
        game,
        player
    },
    state: {
        loading: true,
        lastSavedTime: 0,
        autoSave: false,
    },
    mutations: {
        setLoading( state, value ) {
            state.loading = !!value;
        },
        setAutoSave( state, value ) {
            window.clearInterval( _saveTimer );
            state.autoSave = !!value;
            if ( state.autoSave ) {
                _saveTimer = window.setInterval(() => {
                  throw new Error('TODO make work');
                    this.broadcast( Notifications.Storage.SAVE_GAME );
                }, 3 * 60 * 1000 );
            }
        },
    },
    actions: {
    },
});
