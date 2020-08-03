<template>
    <modal :title="$t('hiThere')" @close="$emit('close')">
        {{ intent }}
        <component
            class="character-preview"
            :is="characterComponent"
            :character="character"
            :width="characterWidth"
        />
    </modal>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import sortBy         from 'lodash/sortBy';
import Modal          from '@/components/modal/modal';
import PriceTypes     from '@/definitions/price-types';
import { SHOP_TYPES } from '@/model/factories/shop-factory';
import messages       from './messages.json';

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    computed: {
        ...mapState([
            'dimensions',
        ]),
        ...mapGetters([
            'character',
            'player',
        ]),
        intent() {
            return this.character.properties.intent;
        },
        characterComponent() {
            // TODO: currently female only
            return () => import('@/renderers/character-female');
            //return this.character.sex === 'F' ?
        },
        characterWidth() {
            const ideal = 300; /* see _variables@mobile-width */
            const { width } = this.dimensions;
            return Math.min( ideal, width * .9 );
        },
    },
    methods: {
        ...mapMutations([
            'openDialog',
            'showNotification',
        ]),
        ...mapActions([
            'buyItem',
        ]),
        itemTitle({ name, price }) {
            let i18n = '';
            if ( price >= PriceTypes.LUXURY ) {
                i18n = `${this.$t( 'luxury' )} `;
            } else if ( price >= PriceTypes.EXPENSIVE ) {
                i18n = `${this.$t( 'quality' )} `;
            }
            return `${i18n}${this.$t( name )}`;
        },
        canBuy( item ) {
            return this.player.inventory.cash >= item.price;
        },
    },
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_variables';
</style>
