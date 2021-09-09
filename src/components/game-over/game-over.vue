<template>
    <div>
        <div
            v-if="!prepared"
            class="animation"
        >
            <img src="@/assets/illustrations/teeth_upper.png" ref="teethUpper" class="teeth teeth__upper teeth--collapsed" />
            <img src="@/assets/illustrations/teeth_lower.png" ref="teethLower" class="teeth teeth__bottom teeth--collapsed" />
        </div>
        <div v-else class="blind" />
        <modal
            v-if="prepared"
            :title="$t('gameOver')"
            :dismissible="false"
            class="game-over-modal"
        >
            <p
                v-t="player.hp === 0 ? 'youPerishedInBattle' : 'alasTheDaylightHasOverwhelmedYou'"
                class="opening-text"
            ></p>
            <div class="player-stats">
                <h4 v-t="'achievements'"></h4>
                <ul>
                    <i18n path="youHavePlayedFor" tag="li">
                        <span class="stat">{{ $t( "daysAndHours", { days, hours }) }}</span>
                    </i18n>
                    <i18n path="youHaveGatheredXPandReachedLevel" tag="li">
                        <span class="stat">{{ $t( "experiencePoints", { xp: player.xp }) }}</span>
                        <span class="stat">{{ $t( "level", { level: player.level }) }}</span>
                    </i18n>
                    <i18n path="yourWalletContains" tag="li">
                        <span class="stat">{{ $t( "dollars", { dollars: player.inventory.cash.toFixed( 2 ) }) }}</span>
                    </i18n>
                </ul>
            </div>
            <div v-if="hasSavedGame()">
                <p v-t="'restoreFromLastSave'"></p>
                <button
                    v-t="'restoreLastSave'"
                    type="button"
                    class="rpg-button"
                    @click="restoreLastSave()"
                ></button>
            </div>
            <div v-else>
                <p v-t="'saveFrequently'"></p>
                <button
                    v-t="'startNewGame'"
                    type="button"
                    class="rpg-button"
                    @click="resetGame()"
                ></button>
            </div>
        </modal>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import Modal               from "@/components/modal/modal";
import { GAME_START_TIME } from "@/definitions/constants";
import messages            from "./messages.json";

const MS_IN_AN_HOUR = 3600000;
const MS_IN_A_DAY   = MS_IN_AN_HOUR * 24;

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    data: () => ({
        prepared: false,
    }),
    computed: {
        ...mapGetters([
            "player",
            "gameTime",
            "hasSavedGame",
        ]),
        gameDuration() {
            return this.gameTime - new Date( GAME_START_TIME );
        },
        days() {
            return Math.floor( this.gameDuration / MS_IN_A_DAY );
        },
        hours() {
            return Math.floor(( this.gameDuration % MS_IN_A_DAY ) / MS_IN_AN_HOUR );
        },
    },
    created() {
        this.stopSound();
        this.setOpponent( null ); // reactivates locked menu items
    },
    mounted() {
        window.setTimeout(() => {
            this.$refs.teethUpper.classList.remove( "teeth--collapsed" );
            this.$refs.teethLower.classList.remove( "teeth--collapsed" );

            window.setTimeout(() => {
                this.prepared = true;
            }, 1000 ); // see CSS for animation duration
        }, 10 );
    },
    methods: {
        ...mapMutations([
            "setOpponent",
        ]),
        ...mapActions([
            "loadGame",
            "resetGame",
            "stopSound",
        ]),
        restoreLastSave() {
            this.$emit( "close" );
            this.loadGame();
        },
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";

.game-over-modal {
    z-index: 1;
}

.opening-text {
    margin-top: 0;
}

.player-stats {
    border-top: 1px dashed $color-1;
    border-bottom: 1px dashed $color-1;
    padding: $spacing-xsmall 0 $spacing-medium;
}

.stat {
    color: #dfdfdf;
    font-weight: bold;
}

.animation {
    position: fixed;
    z-index: 2;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.teeth {
    position: absolute;
    width: 100%;
    transition: all 1s cubic-bezier(.17,.67,.86,.63);

    @include portrait() {
        height: 75%;
        transition-duration: 0.5s;
    }

    &__upper {
        top: 0%;
    }

    &__bottom {
        bottom: 0%;
    }

    &--collapsed {
        &.teeth__upper {
            top: -100%;
        }
        &.teeth__bottom {
            bottom: -100%;
        }
    }
}

.blind {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: #000;
}
</style>
