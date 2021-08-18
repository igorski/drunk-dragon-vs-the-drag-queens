<template>
    <modal :title="shopTitle" @close="$emit('close')">
        <template v-if="canSell">
            <p v-t="'somethingToSell'"></p>
            <inventory-list
                v-model="selectedItem"
                class="inventory-list"
            />
            <button
                type="button"
                v-t="'sell'"
                class="rpg-button sell-button"
                :title="$t('sell')"
                :disabled="!selectedItem"
                @click="handleSellClick( selectedItem )"
            ></button>
        </template>
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
import { mapGetters, mapMutations, mapActions } from "vuex";
import sortBy           from "lodash/sortBy";
import Modal            from "@/components/modal/modal";
import InventoryList    from "@/components/shared/inventory-list/inventory-list";
import ItemTypes from "@/definitions/item-types";
import PriceTypes, { getPriceTypeForPrice } from "@/definitions/price-types";
import { SHOP_TYPES }   from "@/model/factories/shop-factory";
import InventoryActions from "@/model/actions/inventory-actions";
import sharedMessages   from "@/i18n/items.json";
import messages         from "./messages.json";

export default {
    i18n: { messages, sharedMessages },
    components: {
        Modal,
        InventoryList,
    },
    data: () => ({
        selectedItem: null,
        salePrices: new Map(), // keeps track of the prices of inventory items for sale
    }),
    computed: {
        ...mapGetters([
            "shop",
            "player",
        ]),
        shopTitle() {
            let type = "";
            switch ( this.shop.type ) {
                case SHOP_TYPES.PHARMACY:
                    type = "pharmacy";
                    break;
                case SHOP_TYPES.JEWELLER:
                    type = "jewelryStore";
                    break;
                case SHOP_TYPES.LIQUOR:
                    type = "liquorStore";
                    break;
                case SHOP_TYPES.PAWN:
                    type = "pawnShop";
                    break;
                case SHOP_TYPES.DEALER:
                    type = "dealer";
                    break;
                case SHOP_TYPES.FOOD:
                    type = "food";
                    break;
            }
            return this.$t( "welcomeToOur", { type: this.$t( type ) });
        },
        sortedItems() {
            return sortBy( this.shop.items, [ "price" ]);
        },
        canSell() {
            return this.shop.type === SHOP_TYPES.PAWN;
        },
        canLoan() {
            return this.shop.type === SHOP_TYPES.DEALER;
        },
        inventoryItems() {
            return this.player.inventory.items;
        },
    },
    created() {
        this.showPriceTypeClass = new Set( this.shop.items.map(({ name }) => name )).size < this.shop.items.length;
    },
    beforeDestroy() {
        this.leaveShop();
    },
    methods: {
        ...mapMutations([
            "openDialog",
        ]),
        ...mapActions([
            "buyItem",
            "sellItem",
            "leaveShop",
        ]),
        itemTitle({ name, price }) {
            if ( !this.showPriceTypeClass ) {
                return this.$t( name );
            }
            let i18n = "";
            const priceType = getPriceTypeForPrice( price );
            if ( priceType === PriceTypes.LUXURY ) {
                i18n = `${this.$t( "luxury" )} `;
            } else if ( priceType === PriceTypes.EXPENSIVE ) {
                i18n = `${this.$t( "quality" )} `;
            }
            return `${i18n}${this.$t( name )}`;
        },
        canBuy( item ) {
            return this.player.inventory.cash >= item.price;
        },
        handleBuyClick( item ) {
            this.openDialog({
                type: "confirm",
                title: this.$t( "confirmPurchase" ),
                message: this.$t( "buyItemForPrice", { name: this.itemTitle( item ), price: item.price }),
                confirm: async () => {
                    const success = await this.buyItem( item );
                    this.openDialog({ message: this.$t( success ? "thanksForTransaction" : "insufficientFunds" ) });
                },
            });
        },
        handleSellClick( item ) {
            switch ( item.type ) {
                default:
                    break;
                case ItemTypes.FOOD:
                    return this.openDialog({
                        message: this.$t( "notInterestedInFood" )
                    });
                case ItemTypes.DRUGS:
                    return this.openDialog({
                        message: this.$t( "notInterestedInDrugs" )
                    });
            }
            if ( !this.salePrices.has( item )) {
                this.salePrices.set( item, InventoryActions.getPriceForItemSale( item ));
            }
            const price = this.salePrices.get( item );
            this.openDialog({
                type: "confirm",
                title: this.$t( "confirmSale" ),
                message: this.$t( "sellItemForPrice", { name: this.itemTitle( item ), price }),
                confirm: async () => {
                    await this.sellItem({ item, price });
                    this.openDialog({ message: this.$t( "thanksForTransaction" ) });
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

.inventory-list,
.sell-button {
    display: inline !important;
}
</style>
