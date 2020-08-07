<template>
    <modal :title="shopTitle" @close="$emit('close')">
        <p v-t="shop.items.length ? 'itemsForSale' : 'noItemsForSale'"></p>
        <div v-for="(item, index) in sortedItems"
             :key="`${index}`"
        >
            <span class="item item--name">{{ itemTitle( item ) }}</span>
            <span class="item item--price">$ {{ item.price }}</span>
            <button type="button"
                    v-t="'buy'"
                    :title="$t('buy')"
                    :disabled="!canBuy( item )"
                    @click="handleBuyClick( item )"
            ></button>
        </div>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import sortBy         from 'lodash/sortBy';
import Modal          from '@/components/modal/modal';
import PriceTypes     from '@/definitions/price-types';
import { SHOP_TYPES } from '@/model/factories/shop-factory';
import sharedMessages from '@/i18n/items.json';
import messages       from './messages.json';

export default {
    i18n: { messages, sharedMessages },
    components: {
        Modal,
    },
    computed: {
        ...mapGetters([
            'shop',
            'player',
        ]),
        shopTitle() {
            let type = '';
            switch ( this.shop.type ) {
                case SHOP_TYPES.PHARMACY:
                    type = 'pharmacy';
                    break;
                case SHOP_TYPES.JEWELLER:
                    type = 'jewelryStore';
                    break;
                case SHOP_TYPES.LIQUOR:
                    type = 'liquorStore';
                    break;
            }
            return this.$t('welcomeToOur', { type: this.$t( type ) });
        },
        sortedItems() {
            return sortBy( this.shop.items, [ 'price' ]);
        },
    },
    beforeDestroy() {
        this.leaveShop();
    },
    methods: {
        ...mapMutations([
            'openDialog',
            'showNotification',
        ]),
        ...mapActions([
            'buyItem',
            'leaveShop',
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
        handleBuyClick( item ) {
            this.openDialog({
                type: 'confirm',
                title: this.$t( 'confirmPurchase' ),
                message: this.$t( 'buyItemForPrice', { name: this.itemTitle( item ), price: item.price }),
                confirm: async () => {
                    const success = await this.buyItem( item );
                    this.showNotification({ message: this.$t( success ? 'thanksForPurchase' : 'insufficientFunds' ) });
                },
            });
        },
    },
};
</script>

<style lang="scss" scoped>
    .item {
        display: inline-block;

        &--name {
            width: 200px;
        }

        &--price {
            width: 80px;
        }
    }
</style>
