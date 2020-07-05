<template>
    <div class="rpg">
        <template v-if="loading">
            Loading...
        </template>
        <template v-else>
            <!-- application menu -->
            <header-menu class="menu" />
            <!-- game screens -->
            <div class="ui">
                <component
                    :is="activeScreen"
                    @input="handleScreenInput( $event )"
                />
                <h1>RPG</h1>
                <span class="time">{{ time }}</span>
            </div>
            <world class="game-renderer" />
            <!-- dialog window used for information messages, alerts and confirmations -->
            <dialog-window v-if="dialog"
                :type="dialog.type"
                :title="dialog.title"
                :message="dialog.message"
                :confirm-handler="dialog.confirm"
                :cancel-handler="dialog.cancel"
            />
            <!-- notifications -->
            <notifications />
        </template>
    </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { preloadAssets } from '@/services/asset-preloader';
import { timestampToTimeString } from '@/utils/time-util';
import DialogWindow from '@/components/dialog-window/dialog-window';
import HeaderMenu from '@/components/header-menu/header-menu';
import Notifications from '@/components/notifications/notifications';
import World from '@/components/world/world';
import messages from './messages.json';

Vue.use( VueI18n );
// Create VueI18n instance with options
const i18n = new VueI18n({
    messages
});

// screens
const SCREEN_GAME = 0;
const SCREEN_CHARACTER_CREATE = 1;

export default {
    i18n,
    components: {
        DialogWindow,
        HeaderMenu,
        Notifications,
        World,
    },
    data: () => ({
        screen: SCREEN_GAME,
    }),
    computed: {
        ...mapState([
            'loading',
            'dialog',
        ]),
        ...mapGetters([
            'gameTime',
            'hasSavedGame',
        ]),
        activeScreen() {
            switch ( this.screen ) {
                default:
                    return null;
                case SCREEN_CHARACTER_CREATE:
                    return () => import('./components/character-create/character-create');
            }
        },
        time() {
            return timestampToTimeString( this.gameTime );
        },
    },
    async created() {
        this.setLoading( true );

        await preloadAssets();
        await this.prepareAudio();

        if ( this.hasSavedGame() ) {
            await this.loadGame();
        } else {
            this.screen = SCREEN_CHARACTER_CREATE;
        }
        this.setLoading( false );
    },
    methods: {
        ...mapMutations([
            'setLoading',
        ]),
        ...mapActions([
            'prepareAudio',
            'createGame',
            'loadGame',
        ]),
        handleScreenInput( data ) {
            switch ( this.screen ) {
                default:
                    break;
                case SCREEN_CHARACTER_CREATE:
                    this.createGame( data );
                    this.screen = SCREEN_GAME;
                    break;
            }
        }
    },
};
</script>

<style lang="scss" scoped>
.rpg {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
.menu {
    position: fixed;
    top: 0;
    z-index: 2;
}
.time {
    color: #fff;
}
.ui {
    position: absolute;
    z-index: 1;
}
.game-renderer {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
}
</style>
