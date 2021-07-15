<template>
    <modal :title="$t('gameOver')" :dismissible="false">
        <p v-t="player.hp === 0 ? 'youPerishedInBattle' : 'alasTheDaylightHasOverwhelmedYou'"></p>
        <p>{{ $t('youHavePlayedFor', { days, hours }) }}</p>
    </modal>
</template>

<script>
import { mapGetters }      from "vuex";
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
