<template>
    <div>
        {{ 'TODO' }}
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
            "openDialog",
            "setScreen",
        ]),
        ...mapActions([
            "startBattle",
        ]),
        fight() {
            this.startBattle( this.character );
            this.setScreen( SCREEN_BATTLE );
            this.openDialog({ message: this.$t( "bitchItsOn" )});
        },
        updateMessage( message ) {
            this.$emit( "message", message );
        }
    }
};
</script>
