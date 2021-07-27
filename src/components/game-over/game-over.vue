<template>
    <modal :title="$t('gameOver')" :dismissible="false">
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
                    <span class="stat">{{ $t( "dollars", { dollars: player.inventory.cash }) }}</span>
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
</template>

<script>
import { mapGetters, mapActions } from "vuex";
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
    methods: {
        ...mapActions([
            "loadGame",
            "resetGame",
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
</style>
