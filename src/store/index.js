import storage     from "store/dist/store.modern";
import audio       from "./modules/audio-module";
import battle      from "./modules/battle-module";
import environment from "./modules/environment-module";
import game        from "./modules/game-module";
import player      from "./modules/player-module";

const STORAGE_KEY = "rpg_settings";

const storedData = storage.get( STORAGE_KEY ) || {};

// here we cheat a little by exposing the vue-i18n translations directly to the
// store so we can commit translated error/success messages from actions

let i18n;
const translate = (key, optArgs) => i18n && typeof i18n.t === "function" ? i18n.t(key, optArgs) : key;

// internal timers
let _saveTimer;

/**
 * The root Vuex store is used to manage "system"-wide states.
 * The individual game sections are separated into sub modules.
 */
export default {
    modules: {
        audio,
        battle,
        environment,
        game,
        player
    },
    state: {
        loading: true,
        lastSavedTime: 0,
        autoSave: storedData.autoSave ?? false,
        dialog: null,
        notifications: [],
        screen: 0,
        // window size
        dimensions: {
            width: 0,
            height: 0,
        },
    },
    getters: {
        translate: state => translate, // convenience method to access i18n in modules
    },
    mutations: {
        setI18n( state, i18nReference ) {
            i18n = i18nReference;
        },
        setLoading( state, value ) {
            state.loading = !!value;
        },
        setDimensions( state, { width, height }) {
            state.dimensions.width = width;
            state.dimensions.height = height;
        },
        setScreen( state, value ) {
            state.screen = value;
        },
        setAutoSave( state, value ) {
            state.autoSave = !!value;
        },
        /**
         * open a dialog window showing given title and message.
         * types can be info, error or confirm. When type is confirm, optional
         * confirmation and cancellation handler can be passed.
         */
        openDialog( state, { type = "info", title = "", message = "", confirm = null, cancel = null }) {
            state.dialog = { type, title , message, confirm, cancel };
        },
        closeDialog( state ) {
            state.dialog = null;
        },
        /**
         * shows a dialog window stating an Error has occurred.
         */
        showError( state, message ) {
            state.dialog = { type: "error", title: translate("title.error"), message };
        },
        /**
         * shows a notification containing given title and message.
         * multiple notifications can be stacked.
         */
        showNotification( state, message ) {
            state.notifications.push( message );
        },
        clearNotifications( state) {
            state.notifications = [];
        },
    },
    actions: {
        enableAutoSave({ commit, dispatch }, enabled ) {
            window.clearInterval( _saveTimer );
            commit( "setAutoSave", enabled );
            dispatch( "saveOptions" );
            if ( enabled ) {
                _saveTimer = window.setInterval(() => {
                    dispatch( "saveGame" );
                }, 3 * 60 * 1000 );
            }
        },
        saveOptions({ state }) {
            const data = {
                autoSave: state.autoSave,
            };
            storage.set( STORAGE_KEY, data );
        },
    }
};
