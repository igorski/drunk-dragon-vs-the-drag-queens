<template>
    <div class="rpg">
        <template v-if="loading">
            Loading...
        </template>
        <template v-else>
            <!-- application menu -->
            <header-menu />
            <!-- game screens -->
            <div class="ui">
                <!-- <span class="time">{{ time }}</span> -->
                <component
                    :is="activeScreen"
                    @input="handleScreenInput( $event )"
                />
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
import { SCREEN_GAME, SCREEN_CHARACTER_CREATE, SCREEN_CREDITS } from '@/definitions/screens';
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

export default {
    i18n,
    components: {
        DialogWindow,
        HeaderMenu,
        Notifications,
        World,
    },
    computed: {
        ...mapState([
            'loading',
            'screen',
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
                    return () => import('./components/character-creator/character-creator');
                case SCREEN_CREDITS:
                    return () => import('./components/credits/credits');
            }
        },
        time() {
            return timestampToTimeString( this.gameTime );
        },
    },
    async created() {
        this.setLoading( true );

        window.addEventListener( 'resize', this.handleResize );
        this.handleResize();

        await preloadAssets();
        await this.prepareAudio();

        if ( this.hasSavedGame() ) {
            await this.loadGame();
        } else {
            this.setScreen( SCREEN_CHARACTER_CREATE );
        }
        this.setLoading( false );
    },
    methods: {
        ...mapMutations([
            'setLoading',
            'setDimensions',
            'setScreen',
        ]),
        ...mapActions([
            'prepareAudio',
            'createGame',
            'loadGame',
        ]),
        handleResize() {
            this.setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        },
        handleScreenInput( data ) {
            switch ( this.screen ) {
                default:
                    break;
                case SCREEN_CHARACTER_CREATE:
                    this.createGame( data );
                    this.setScreen( SCREEN_GAME );
                    break;
            }
        }
    },
};
</script>

<style lang="scss">
    @import '@/styles/_variables.scss';

    html, body {
      overscroll-behavior-x: none; /* disable navigation back/forward swipe on Chrome */
    }

    body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #000;
    }

    .rpg {
        @include bodyFont();
        margin-top: $menu-height;

        @include mobile() {
            margin-top: $menu-height-mobile;
        }
    }
    .time {
        color: #fff;
    }
    .ui {
        position: absolute;
        width: 100%;
        z-index: $z-index-ui;
    }
    .game-renderer {
        position: absolute;
        top: 0;
        left: 0;
        z-index: $z-index-game;
    }
</style>
