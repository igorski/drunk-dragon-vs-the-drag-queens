/**
* The MIT License (MIT)
*
* Igor Zinken 2020-2021 - https://www.igorski.nl
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
* the Software, and to permit persons to whom the Software is furnished to do so,
* subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
<template>
    <div class="rpg" :class="{ wide: showWideUI }">
        <template v-if="loading">
            <transition name="fade">
                <img src="@/assets/animations/loader.svg" class="loader" />
            </transition>
        </template>
        <template v-else>
            <!-- application menu -->
            <header-menu />
            <!-- game screens -->
            <div
                v-if="hasScreen"
                class="ui"
                :class="{ 'full': isTitleScreen }"
            >
                <component
                    :is="activeScreen"
                    @input="handleScreenInput( $event )"
                    @close="handleScreenClose()"
                />
            </div>
            <world
                v-if="hasActiveGame"
                class="game-renderer"
            />
            <!-- dialog window used for information messages, alerts and confirmations -->
            <dialog-window
                v-if="dialog"
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
import { mapState, mapGetters, mapMutations, mapActions } from "vuex";
import Vue from "vue";
import VueI18n from "vue-i18n";
import { preloadAssets } from "@/services/asset-preloader";
import { INTRO_THEME }   from "@/definitions/audio-tracks";
import DialogWindow      from "@/components/dialog-window/dialog-window";
import HeaderMenu        from "@/components/header-menu/header-menu";
import Notifications     from "@/components/notifications/notifications";
import World             from "@/components/world/world";
import messages          from "./messages.json";

import { GAME_OVER } from "@/definitions/game-states";
import {
    SCREEN_GAME, SCREEN_TITLE, SCREEN_CHARACTER_CREATE, SCREEN_OPTIONS, SCREEN_STATUS, SCREEN_CREDITS,
    SCREEN_CHARACTER_INTERACTION, SCREEN_BATTLE, SCREEN_SHOP, SCREEN_HOTEL, SCREEN_GAME_OVER, SCREEN_FINALE
} from "@/definitions/screens";

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
            "loading",
            "screen",
            "dialog",
        ]),
        ...mapGetters([
            "hasSavedGame",
            "gameState",
            "player",
        ]),
        activeScreen() {
            switch ( this.screen ) {
                default:
                    return null;
                case SCREEN_TITLE:
                    return () => import( "./components/title-screen/title-screen" );
                case SCREEN_CHARACTER_CREATE:
                    return () => import( "./components/character-creator/character-creator" );
                case SCREEN_CHARACTER_INTERACTION:
                    return () => import( "./components/character-interaction/character-interaction" );
                case SCREEN_BATTLE:
                    return () => import( "./components/battle/battle" );
                case SCREEN_OPTIONS:
                    return () => import( "./components/options/options" );
                case SCREEN_STATUS:
                    return () => import( "./components/status/status" );
                case SCREEN_SHOP:
                    return () => import( "./components/shop/shop" );
                case SCREEN_HOTEL:
                    return () => import( "./components/hotel/hotel" );
                case SCREEN_CREDITS:
                    return () => import( "./components/credits/credits" );
                case SCREEN_GAME_OVER:
                    return () => import( "./components/game-over/game-over" );
                case SCREEN_FINALE:
                    return () => import( "./components/finale/finale" );
            }
        },
        isTitleScreen() {
            return this.screen === SCREEN_TITLE;
        },
        hasScreen() {
            return this.screen !== SCREEN_GAME;
        },
        hasActiveGame() {
            return !!this.player;
        },
        showWideUI() {
            return this.screen === SCREEN_GAME_OVER;
        },
    },
    watch: {
        gameState( value ) {
            if ( value === GAME_OVER ) {
                this.setScreen( SCREEN_GAME_OVER );
            }
        },
        screen( value ) {
            // start/stop path finding AI depending on current screen
            if ( value === SCREEN_GAME ) {
                this.updateCharacters();
            } else {
                this.cancelCharacterMovements();
            }
        }
    },
    async created() {
        this.setI18n( i18n );
        this.setLoading( true );

        window.addEventListener( "resize", this.handleResize );
        this.handleResize();

        await preloadAssets();
        await this.loadOptions();

        let hasGame = false;
        if ( this.hasSavedGame() ) {
            hasGame = await this.loadGame();
        }
        if ( !hasGame ) {
            this.playSound( INTRO_THEME );
            this.setScreen( SCREEN_TITLE );
        }
        this.setLoading( false );

        // DEBUG helpers during development

        if ( process.env.NODE_ENV === "development" ) {
            const { getters, commit } = this.$store;
            window.rpg = {
                setScreen   : this.setScreen,
                getPosition : () => ({ x: getters.activeEnvironment.x, y: getters.activeEnvironment.y }),
                setPosition : ( x, y ) => {
                    commit( "setXPosition", { value: x });
                    commit( "setYPosition", { value: y });
                }
            };
        }
    },
    methods: {
        ...mapMutations([
            "setI18n",
            "setLoading",
            "setDimensions",
            "setScreen",
        ]),
        ...mapActions([
            "playSound",
            "createGame",
            "loadOptions",
            "loadGame",
            "updateCharacters",
            "cancelCharacterMovements"
        ]),
        handleResize() {
            this.setDimensions({
                width  : window.innerWidth,
                height : window.innerHeight
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
    @import "@/styles/_variables.scss";
    @import "@/styles/animations.scss";

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
        &.wide {
            .ui {
                max-width: 100%;
            }
        }
    }
    .loader {
        @include center();
    }
    .ui {
        position: absolute;
        width: 100%;
        left: 0;
        z-index: $z-index-ui;
        @include scrollableWindow();

        @include large() {
            max-width: $ideal-width;
            margin: 0 auto;
            padding-top: $spacing-medium;
            left: 50%;
            transform: translateX(-50%);

            &.full {
                top: 0;
            }
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
