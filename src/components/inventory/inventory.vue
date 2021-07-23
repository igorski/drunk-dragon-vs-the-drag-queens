<template>
    <div>
        <h3 v-if="!listOnly" v-t="'inventory'"></h3>
        <ul v-if="inventory.length" :class="{ compact: listOnly }">
            <li
                v-for="(item, index) in inventory"
                :key="`item${index}`"
                class="inventory-item"
            >
                <button
                    type="button"
                    class="rpg-ghost-button"
                    @click="handleInventoryClick( item )"
                >{{ item.text }}</button>
            </li>
        </ul>
        <p v-else v-t="'youHaveNoItems'"></p>
        <template v-if="!listOnly">
            <h3 v-t="'cash'"></h3>
            <span>$ {{ player.inventory.cash.toFixed( 2 ) }}</span>
        </template>
    </div>
</template>

<script>
import { mapMutations } from "vuex";
import ITEM_TYPES from "@/definitions/item-types";
import ItemActions from "@/model/actions/item-actions";

import messages from "./messages.json";
import sharedMessages from "@/i18n/items.json";

export default {
    i18n: { messages, sharedMessages },
    props: {
        player: {
            type: Object,
            required: true,
        },
        listOnly: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        inventory() {
            return this.player.inventory.items.map( value => ({ text: this.$t( value.name ), value }));
        },
    },
    methods: {
        ...mapMutations([
            "openDialog",
            "removeItemFromInventory",
            "showNotification",
        ]),
        handleInventoryClick( item ) {
            this.openDialog({
                type: "confirm",
                title: this.$t( "confirmUsage" ),
                message: this.$t( "doYouWishToApplyItem", { item: item.text }),
                confirm: async () => {
                    switch ( item.type ) {
                        default:
                            break;
                        case ITEM_TYPES.JEWELRY:
                            break;
                        case ITEM_TYPES.LIQUOR:
                            break;
                        case ITEM_TYPES.HEALTHCARE:

                            break;
                    }
                    ItemActions.applyItemToPlayer( this.$store, item.value, this.player );
                    this.removeItemFromInventory( item.value );
                    this.showNotification({ message: this.$t( "appliedItem", { item: item.text }) });
                    this.$emit( "select", { item });
                },
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.compact {
    margin: 0;
}
</style>
