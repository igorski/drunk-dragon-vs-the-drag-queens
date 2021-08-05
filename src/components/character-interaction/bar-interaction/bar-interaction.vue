<template>
    <div>
        <button
            v-t="'fight'"
            type="button"
            class="rpg-button"
            @click="fight()"
        ></button>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { SCREEN_BATTLE } from "@/definitions/screens";
import messages from "./messages.json";

export default {
    i18n: { messages },
    computed: {
        ...mapGetters([
            "character",
        ]),
    },
    methods: {
        ...mapMutations([
            "setScreen",
        ]),
        ...mapActions([
            "startBattle",
        ]),
        fight() {
            this.startBattle( this.character );
            this.setScreen( SCREEN_BATTLE );
        },
        updateMessage( message ) {
            this.$emit( "message", message );
        }
    }
};
</script>
