<template>
    <modal
        :title="$t('youWon')"
        :dismissible="false"
        class="finale-modal"
    >
        <p class="opening-text">{{ 'someTextShouldGoHereMaybeAnImageToo' }}</p>
        <player-stats />
    </modal>
</template>

<script>
import { mapMutations, mapActions } from "vuex";
import Modal from "@/components/modal/modal";
import PlayerStats from "@/components/player-stats/player-stats";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Modal,
        PlayerStats,
    },
    data: () => ({
        prepared: false,
    }),
    created() {
        this.stopSound();
        this.setOpponent( null ); // reactivates locked menu items
    },
    methods: {
        ...mapMutations([
            "setOpponent",
        ]),
        ...mapActions([
            "stopSound",
        ]),
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";

.finale-modal {
    z-index: 1;
}

.opening-text {
    margin-top: 0;
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
