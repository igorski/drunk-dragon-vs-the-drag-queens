import Vue    from 'vue';
import Vuex   from 'vuex';
import audio  from './modules/audio-module';
import game   from './modules/game-module';
import player from './modules/player-module';

Vue.use( Vuex );

// here we cheat a little by exposing the vue-i18n translations directly to the
// store so we can commit translated error/success messages from actions

let i18n;
const translate = (key, optArgs) => i18n && typeof i18n.t === 'function' ? i18n.t(key, optArgs) : key;

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
        dialog: null,
        notifications: [],
        // window size
        dimensions: {
            width: 0,
            height: 0,
        },
    },
    mutations: {
        setLoading( state, value ) {
            state.loading = !!value;
        },
        setDimensions( state, { width, height }) {
            state.dimensions.width = width;
            state.dimensions.height = height;
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
        /**
         * open a dialog window showing given title and message.
         * types can be info, error or confirm. When type is confirm, optional
         * confirmation and cancellation handler can be passed.
         */
        openDialog( state, { type = 'info', title = '', message = '', confirm = null, cancel = null }) {
            state.dialog = { type, title , message, confirm, cancel };
        },
        closeDialog( state ) {
            state.dialog = null;
        },
        /**
         * shows a dialog window stating an Error has occurred.
         */
        showError( state, message ) {
            state.dialog = { type: 'error', title: translate('title.error'), message };
        },
        /**
         * shows a notification containing given title and message.
         * multiple notifications can be stacked.
         */
        showNotification( state, { message = '', title = null }) {
            state.notifications.push({ title: title || translate('title.success'), message });
        },
        clearNotifications( state) {
            state.notifications = [];
        },
    },
    actions: {
    },
});
