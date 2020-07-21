<template>
    <modal :title="$t('options')" @close="$emit('close')">
        <form>
            <fieldset class="rpg-fieldset">
                <div class="input">
                    <label v-t="'autoSave'" for="autoSave"></label>
                    <RadioToggleButtons
                        v-model="autoSaving"
                        :values="onOffOptions"
                        id="autoSave"
                        color="purple"
                        textColor="#000"
                        selectedTextColor="#FFF"
                    />
                </div>
                <div class="input">
                    <label v-t="'playSound'" for="playSound"></label>
                    <RadioToggleButtons
                        v-model="playSound"
                        :values="onOffOptions"
                        id="playSound"
                        color="purple"
                        textColor="#000"
                        selectedTextColor="#FFF"
                    />
                </div>
            </fieldset>
        </form>
    </modal>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import Modal    from '@/components/modal/modal';
import messages from './messages.json';

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    computed: {
        ...mapState([
            'autoSave',
        ]),
        ...mapGetters([
            'muted',
        ]),
        onOffOptions() {
            return [
				{ label: this.$t('on'),  value: 'true' },
				{ label: this.$t('off'), value: 'false' }
			];
        },
        autoSaving: {
            get() {
                return this.autoSave.toString();
            },
            set( value ) {
                this.enableAutoSave( value === 'true' );
            }
        },
        playSound: {
            // note the negation as sound is played when there is no muting
            get() {
                return (!this.muted).toString();
            },
            set( value ) {
                this.setMuted( value === 'false' );
            }
        }
    },
    methods: {
        ...mapMutations([
            'setMuted',
        ]),
        ...mapActions([
            'enableAutoSave',
        ]),
    },
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_layout';
    @import '@/styles/forms';
</style>
