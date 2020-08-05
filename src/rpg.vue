<template>
    <div class="rpg">
        <template v-if="loading">
            <transition name="fade">
                <img src="@/assets/animations/loader.svg" class="loader" />
            </transition>
        </template>
        <template v-else>
            <!-- application menu -->
            <header-menu />
            <!-- game screens -->
            <div class="ui" v-if="hasScreen">
                <component
                    :is="activeScreen"
                    @input="handleScreenInput( $event )"
                    @close="handleScreenClose()"
                />
            </div>
            <world v-if="hasActiveGame"
                   class="game-renderer"
            />
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
import VueRadioToggleButtons from 'vue-radio-toggle-buttons';
import 'vue-radio-toggle-buttons/dist/vue-radio-toggle-buttons.css';
import { preloadAssets } from '@/services/asset-preloader';
import DialogWindow from '@/components/dialog-window/dialog-window';
import HeaderMenu from '@/components/header-menu/header-menu';
import Notifications from '@/components/notifications/notifications';
import World from '@/components/world/world';
import messages from './messages.json';

import {
    SCREEN_GAME, SCREEN_CHARACTER_CREATE, SCREEN_OPTIONS, SCREEN_STATUS,
    SCREEN_CHARACTER_INTERACTION, SCREEN_SHOP, SCREEN_CREDITS
} from '@/definitions/screens';

Vue.use( VueI18n );
// Create VueI18n instance with options
const i18n = new VueI18n({
    messages
});
Vue.use(VueRadioToggleButtons, {
	color: '#333',
	textColor: '#333',
	selectedTextColor: '#eee'
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
            'hasSavedGame',
            'player',
        ]),
        activeScreen() {
            switch ( this.screen ) {
                default:
                    return null;
                case SCREEN_CHARACTER_CREATE:
                    return () => import('./components/character-creator/character-creator');
                case SCREEN_CHARACTER_INTERACTION:
                    return () => import('./components/character-interaction/character-interaction');
                case SCREEN_OPTIONS:
                    return () => import('./components/options/options');
                case SCREEN_STATUS:
                    return () => import('./components/status/status');
                case SCREEN_SHOP:
                    return () => import('./components/shop/shop');
                case SCREEN_CREDITS:
                    return () => import('./components/credits/credits');
            }
        },
        hasScreen() {
            return this.screen !== SCREEN_GAME;
        },
        hasActiveGame() {
            return !!this.player;
        },
    },
    async created() {
        this.setI18n( i18n );
        this.setLoading( true );

        window.addEventListener( 'resize', this.handleResize );
        this.handleResize();

        await preloadAssets();
        await this.prepareAudio();

        let hasGame = false;
        if ( this.hasSavedGame() ) {
            hasGame = await this.loadGame();
        }
        if ( !hasGame ) {
            this.setScreen( SCREEN_CHARACTER_CREATE );
        }
        this.setLoading( false );
    },
    methods: {
        ...mapMutations([
            'setI18n',
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
        async handleScreenInput( data ) {
            switch ( this.screen ) {
                default:
                    break;
                case SCREEN_CHARACTER_CREATE:
                    // activate the loading state as we are about to render the map
                    this.setLoading( true );
                    await this.createGame( data );
                    this.setScreen( SCREEN_GAME );
                    this.setLoading( false );
                    break;
            }
        },
        handleScreenClose() {
            this.setScreen( this.hasActiveGame ? SCREEN_GAME : SCREEN_CHARACTER_CREATE );
        },
    },
};
</script>

<style lang="scss">
    @import '@/styles/_variables.scss';
    @import '@/styles/animations.scss';

    html, body {
        overscroll-behavior-x: none; /* disable navigation back/forward swipe on Chrome */
    }

    body {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: $color-1;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    .rpg {
        @include bodyFont();
        margin-top: $menu-height;

        @include mobile() {
            margin-top: $menu-height-mobile;
        }
    }
    .loader {
        @include center();
    }
    .ui {
        position: absolute;
        width: 100%;
        z-index: $z-index-ui;
        @include scrollableWindow();

        @include large() {
            max-width: $ideal-width;
            margin: 0 auto;
            padding-top: $spacing-medium;
            left: 50%;
            transform: translateX(-50%);
        }
    }
    .game-renderer {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        z-index: $z-index-game;
    }
</style>
