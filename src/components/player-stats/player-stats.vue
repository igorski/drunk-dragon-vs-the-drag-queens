<template>
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
</template>

<script>
import { mapGetters } from "vuex";
import { GAME_START_TIME, MS_IN_AN_HOUR, MS_IN_A_DAY } from "@/definitions/constants";
import messages from "./messages.json";

export default {
    i18n: { messages },
    computed: {
        ...mapGetters([
            "player",
            "gameTime",
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
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";

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
