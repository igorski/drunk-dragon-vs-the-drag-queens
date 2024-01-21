<template>
    <modal :title="$t('options')" @close="$emit('close')">
        <form>
            <fieldset class="rpg-fieldset">
                <div class="input">
                    <label v-t="'autoSave'" for="autoSave"></label>
                    <toggle-button
                        v-model="autoSaving"
                        name="autoSave"
                    />
                </div>
                <div class="input">
                    <label v-t="'playSound'" for="soundPlayback"></label>
                    <toggle-button
                        v-model="soundPlayback"
                        name="soundPlayback"
                    />
                </div>
            </fieldset>
        </form>
    </modal>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from "vuex";
import { ToggleButton } from "vue-js-toggle-button";
import Modal from "@/components/modal/modal.vue";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Modal,
        ToggleButton,
    },
    computed: {
        ...mapState([
            "autoSave",
        ]),
        ...mapGetters([
            "muted",
        ]),
        onOffOptions() {
            return [
				{ label: this.$t( "on" ),  value: true },
				{ label: this.$t( "off" ), value: false }
			];
        },
        autoSaving: {
            get() {
                return this.autoSave;
            },
            set( value ) {
                this.enableAutoSave( value );
                this.saveOptions();
            }
        },
        soundPlayback: {
            // note the negation as sound is played when there is no muting
            get() {
                return !this.muted;
            },
            set( value ) {
                const muted = !value;
                this.setMuted( muted );
                this.saveOptions();
                if ( muted ) {
                    this.stopSound();
                } else {
                    this.playSound();
                }
            }
        }
    },
    methods: {
        ...mapMutations([
            "setMuted",
        ]),
        ...mapActions([
            "enableAutoSave",
            "playSound",
            "stopSound",
            "saveOptions",
        ]),
    },
};
</script>

<style lang="scss" scoped>
@import "@/styles/_layout";
@import "@/styles/forms";
</style>
