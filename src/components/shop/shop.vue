<template>
    <modal :title="shopTitle" @close="$emit('close')">
        <!-- items to buy from player (pawn shop -->
        <template v-if="canPawn">
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
        <!-- items for sale -->
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
        <!-- loan shark -->
        <template v-if="canLend">
            <p>{{ loanMessage }}</p>
            <button
                type="button"
                v-t="'loan'"
                class="rpg-button"
                :title="$t('loan')"
                :disabled="playerHasDebt"
                @click="handleLoanClick()"
            ></button>
            <button
                v-if="playerHasDebt"
                type="button"
                v-t="'payBack'"
                class="rpg-button"
                :title="$t('payBack')"
                :disabled="player.inventory.cash < shop.debt"
                @click="handlePayBackClick()"
            ></button>
        </template>
    </modal>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import sortBy           from "lodash/sortBy";
import Modal            from "@/components/modal/modal";
import InventoryList    from "@/components/shared/inventory-list/inventory-list";
import { TWENTY_FOUR_HOURS } from "@/definitions/constants";
import ItemTypes, { SHOE_TYPES } from "@/definitions/item-types";
import PriceTypes, { getPriceTypeForPrice } from "@/definitions/price-types";
import { SHOP_TYPES }   from "@/model/factories/shop-factory";
import InventoryActions from "@/model/actions/inventory-actions";
import { timestampToFormattedDate } from "@/utils/time-util";

import sharedMessages   from "@/i18n/items.json";
import messages         from "./messages.json";

const AMOUNT_TO_LOAN = 5000;

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
            "debt",
            "gameTime",
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
        inventoryItems() {
            return this.player.inventory.items;
        },
        canPawn() {
            return this.shop.type === SHOP_TYPES.PAWN;
        },
        canLend() {
            return this.shop.type === SHOP_TYPES.DEALER;
        },
        playerHasDebt() {
            return this.shop.debt > 0;
        },
        loanMessage() {
            if ( !this.playerHasDebt ) {
                return this.$t( "interestedInALoan" );
            }
            const debtData = this.debt.find( debt => debt.shop.id === this.shop.id );
            return this.$t( "rememberLoanAmount", {
                amount: this.shop.debt,
                endTime: timestampToFormattedDate( debtData.endTime, false )
            });
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
            "loanMoney",
            "payBackLoan",
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
            if ( SHOE_TYPES.includes( item.name ) &&
                 this.player.inventory.items.some( i => SHOE_TYPES.includes( i.name ))) {
                return this.openDialog({ message: this.$t( "youAlreadyHaveAPairOfShoes") });
            }
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
        handleLoanClick() {
            const amount       = AMOUNT_TO_LOAN;
            const amountOfDays = 7;

            let endDate    = new Date( this.gameTime + ( amountOfDays * TWENTY_FOUR_HOURS ));
            endDate        = new Date( `${endDate.toISOString().split( "T" )[ 0 ]}T00:00:00.000Z`);
            const duration = endDate - this.gameTime;

            this.openDialog({
                type: "confirm",
                title: this.$t( "confirmLoan" ),
                message: this.$t( "iCanLoanAmount", { amount, date: timestampToFormattedDate( endDate, false ) }),
                confirm: async () => {
                    await this.loanMoney({ duration, amount });
                    this.openDialog({ message: this.$t( "thanksForTransaction" ) });
                },
            });
        },
        handlePayBackClick() {
            this.payBackLoan( this.shop.debt );
            this.openDialog({ message: this.$t( "thanksForPayBack" ) });
        }
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
