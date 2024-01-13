<template>
    <header class="header"
            :class="{ 'header--expanded': menuOpened }"
    >
        <nav class="menu">
            <div class="menu__toggle"
                 @click="toggleMenu"
             >
                <span>&#9776;</span>
            </div>
            <ul class="menu__items">
                <li>
                    <button v-t="'file'" type="button"
                            class="submenu__toggle" :title="$t('file')">
                    </button>
                    <ul class="menu__items__sub">
                        <li>
                            <button
                                v-t="'saveGame'"
                                type="button"
                                :disabled="!hasActiveGame || isGameOver"
                                :title="$t('saveGame')"
                                @click="handleSave"
                            ></button>
                        </li>
                        <li>
                            <button
                                v-t="'exportGame'"
                                type="button"
                                :disabled="!hasActiveGame || isGameOver"
                                :title="$t('exportGame')"
                                @click="handleExport"
                            ></button>
                        </li>
                        <li>
                            <button
                                v-t="'options'"
                                type="button"
                                :title="$t('options')"
                                @click="openScreen('options')"
                            ></button>
                        </li>
                        <li>
                            <button
                                v-t="'importGame'"
                                type="button"
                                :title="$t('importGame')"
                                @click="handleImport"
                            ></button>
                        </li>
                        <li>
                            <button
                                v-t="'resetGame'"
                                type="button"
                                :disabled="!hasActiveGame"
                                :title="$t('resetGame')"
                                @click="handleReset"
                            ></button>
                        </li>
                    </ul>
                </li>
                <li>
                    <button
                        v-t="'statusInventory'"
                        type="button"
                        :disabled="!hasActiveGame || isGameOver || !canOpenModalItems"
                        :title="$t('statusInventory')"
                        @click="openScreen('status')"
                    >
                    </button>
                </li>
                <li>
                    <button
                        v-t="'viewCredits'"
                        type="button"
                        :disabled="!canOpenModalItems"
                        :title="$t('viewCredits')"
                        @click="openScreen('credits')"
                    >
                    </button>
                </li>
                <li>
                    <a
                        v-t="'help'"
                        href="https://www.igorski.nl/drunk-dragon-vs-the-drag-queens/help"
                        target="_blank"
                    ></a>
                </li>
            </ul>
        </nav>
    </header>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { GAME_OVER } from "@/definitions/game-states";
import { SCREEN_GAME, SCREEN_OPTIONS, SCREEN_STATUS, SCREEN_CREDITS } from "@/definitions/screens";
import messages from "./messages.json";

export default {
    i18n: { messages },
    data: () => ({
        menuOpened: false,
    }),
    computed: {
        ...mapGetters([
            "gameState",
            "player",
            "opponent",
        ]),
        hasActiveGame() {
            return !!this.player; // e.g. creating new character/restart
        },
        isGameOver() {
            return this.gameState === GAME_OVER;
        },
        canOpenModalItems() {
            return !this.opponent;
        },
    },
    methods: {
        ...mapMutations([
            "setScreen",
            "openDialog",
            "showError",
            "showNotification",
        ]),
        ...mapActions([
            "resetGame",
            "saveGame",
            "importGame",
            "exportGame",
        ]),
        toggleMenu() {
            this.menuOpened = !this.menuOpened;
            // prevent scrolling main body when scrolling menu list (are we expecting scrollable body?)
            //document.body.style.overflow = this.menuOpened ? "hidden" : "auto";
        },
        openScreen( target ) {
            let screen;
            switch ( target ) {
                default:
                    return;
                case "options":
                    screen = SCREEN_OPTIONS;
                    break;
                case "status":
                    screen = SCREEN_STATUS;
                    break;
                case "credits":
                    screen = SCREEN_CREDITS;
                    break;
            }
            this.setScreen( screen );
            if ( this.menuOpened ) {
                this.toggleMenu();
            }
        },
        viewCredits() {
            this.setScreen( SCREEN_CREDITS );
        },
        async handleSave() {
            try {
                await this.saveGame();
                this.showNotification( this.$t( "gameSavedSuccessfully" ));
            } catch {
                this.showError( this.$t( "error.unknownError" ));
            }
        },
        async handleExport() {
            try {
                await this.exportGame();
                this.showNotification( this.$t( "gameExportedSuccessfully" ));
            } catch {
                this.showError( this.$t("error.unknownError"));
            }
        },
        handleImport() {
            this.openDialog({
                type: "confirm",
                title: this.$t("areYouSure"),
                message: this.$t("importGameDescr"),
                confirm: () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.onchange = ({ target }) => {
                        const reader = new FileReader();
                        reader.onload = async readerEvent => {
                            try {
                                await this.importGame( readerEvent.target.result );
                                this.setScreen( SCREEN_GAME );
                            } catch {
                                this.showError( this.$t("errorImportingGame"));
                            }
                        };
                        reader.readAsText( target.files[0], "UTF-8" );
                    }
                    input.click();
                }
            });
        },
        handleReset() {
            this.openDialog({
                type: "confirm",
                title: this.$t("areYouSure"),
                message: this.$t("resetGameDescr"),
                confirm: () => {
                    this.resetGame();
                }
            });
        },
    }
};
</script>

<style lang="scss" scoped>
    @import "@/styles/_variables";

    .header {
        position: fixed;
        left: 0;
        top: 0;
        z-index: $z-index-header;
        background-color: $color-menu-background;
        width: 100%;
        padding: 0;

        @include mobile() {
            width: 100%;
            height: $menu-height-mobile;
            background-color: $color-menu-background;

            &--expanded {
                height: 100%;
            }
        }
    }

    // menu is horizontal bar aligned to the top of the screen on resolutions above mobile width

    .menu {
        @include noSelect();
        width: 100%;
        height: $menu-height;
        box-sizing: border-box;

        &__toggle {
            position: absolute;
            display: none;
            top: 0;
            left: 0;
            cursor: pointer;
            width: $menu-toggle-width;
            height: $menu-height;
            background-color: #0e1417;
            color: #FFF;

            span {
                display: block;
                font-size: 150%;
                margin: 12px;
            }
        }

        ul {
            padding: 0;
            box-sizing: border-box;
            list-style-type: none;
        }

        .menu__items {
            width: 100%;
            line-height: $menu-height;
            vertical-align: middle;
            margin: 0 auto;
            display: block;

            &__sub {
                li button {
                    display: block;
                    margin: $spacing-medium 0;
                }
            }

            @include large() {
                text-align: left;

                &__sub {
                    padding-top: $menu-height;
                    background-color: transparent;

                    li button {
                        background-color: $color-menu-background;
                    }
                }
            }
        }

        li {
            display: inline;
            padding: 0;
            margin: 0 $spacing-medium;

            button, a {
                @include titleFont();
                cursor: pointer;
                border: 0;
                background: none;
                color: $color-text-header;
                font-size: 100%;
                text-decoration: none;
                padding: 0 $spacing-small;

                &:hover {
                    color: $color-5;
                }

                &:disabled {
                    color: #666;
                }
            }

            /* submenu (collapsed on large screen) */

            @include large() {
                ul {
                    background-color: $color-menu-background;
                    width: auto;
                    display: none;
                    position: absolute;
                    top: 0;

                    li {
                        display: block;
                    }
                }
                &:hover ul {
                    display: block;
                }
            }
        }

        &--expanded {
            position: absolute;
        }

        @include large() {
            max-width: $app-width;
            margin: 0 auto;
        }

        // on resolution below the mobile threshold the menu is fullscreen and vertically stacked

        @include mobile() {
            position: fixed;
            overflow: hidden;
            width: 100%;
            height: inherit;
            top: 0;
            left: 0;

            .menu__items {
                margin: $menu-height-mobile auto 0;
                background-color: $color-menu-background;
                height: calc(100% - #{$menu-height-mobile});
                overflow: hidden;
                overflow-y: auto;

                li {
                    display: block;
                    margin: 0;
                    width: 100%;
                    line-height: $spacing-xlarge;
                    padding: 0 $spacing-medium;
                    @include boxSize();
                }
            }

            &__toggle {
                display: block; // only visible in mobile view
                height: $menu-height-mobile;
            }

            .submenu__toggle {
                display: none; // all are expanded in mobile view
            }
        }
    }
</style>
