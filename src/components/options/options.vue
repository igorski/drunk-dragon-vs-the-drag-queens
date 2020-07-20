<template>
    <modal :title="$t('options')" @close="$emit('close')">
        <form>
            <fieldset class="rpg-fieldset">
                <div class="input">
                    <label v-t="'playSound'" for="playSound"></label>
                    <RadioToggleButtons
                        v-model="playSound"
                        :values="onOffOptions"
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
import { mapGetters, mapMutations } from 'vuex';
import Modal    from '@/components/modal/modal';
import messages from './messages.json';

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    computed: {
        ...mapGetters([
            'muted',
        ]),
        onOffOptions() {
            return [
				{ label: this.$t('on'),  value: 'true' },
				{ label: this.$t('off'), value: 'false' }
			];
        },
        playSound: {
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
    },
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_layout';
    @import '@/styles/forms';
</style>
