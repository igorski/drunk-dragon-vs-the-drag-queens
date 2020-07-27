<template>
    <modal :title="shopTitle" @close="$emit('close')">
        <p v-t="shop.items.length ? 'itemsForSale' : 'noItemsForSale'"></p>
        <div v-for="(item, index) in shop.items"
             :key="`${index}`"
        >
            {{ item }}
            <button type="button"
                    v-t="'buy'"
                    title="$t('buy')"
                    :disabled="!canBuy( item )"
                    @click="handleBuyClick( item )"
            ></button>
        </div>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import Modal          from '@/components/modal/modal';
import { SHOP_TYPES } from '@/model/factories/shop-factory';
import messages       from './messages.json';

export default {
    i18n: { messages },
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
    },
    methods: {
        ...mapMutations([
            'openDialog',
            'showNotification',
        ]),
        ...mapActions([
            'buyItem',
        ]),
        canBuy( item ) {
            return this.player.inventory.cash >= item.price;
        },
        handleBuyClick( item ) {
            this.openDialog({
                type: 'confirm',
                title: this.$t( 'confirmPurchase' ),
                message: this.$t( 'buyItemForPrice', item ),
                confirm: async () => {
                    const success = await this.buyItem( item );
                    this.showNotification({ message: this.$t( success ? 'thanksForPurchase' : 'insufficientFunds' ) });
                },
            });
        },
    },
};
</script>
