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
        /**
         * When item is selected, apply it automatically to the player (via confirmation)
         * When false, select event is emitted to be handled externally.
         */
        autoApply: {
            type: Boolean,
            default: true,
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
        handleInventoryClick( inventoryEntry ) {
            const { text, value } = inventoryEntry;
            if ( !this.autoApply ) {
                return this.$emit( "select", value );
            }
            this.openDialog({
                type: "confirm",
                title: this.$t( "confirmUsage" ),
                message: this.$t( "doYouWishToApplyItem", { item: text }),
                confirm: async () => {
                    switch ( value.type ) {
                        default:
                        case ITEM_TYPES.HEALTHCARE:
                            break;
                        // certain items have no extra action beyond the abilities they provide when present
                        case ITEM_TYPES.JEWELRY:
                        case ITEM_TYPES.CLOTHES:
                            return this.showNotification( this.$t( "itemIsAlreadyInUse", { item: text }));
                            break;
                        case ITEM_TYPES.LIQUOR:
                            break;
                    }
                    ItemActions.applyItemToPlayer( this.$store, value, this.player );
                    this.removeItemFromInventory( value );
                    this.showNotification( this.$t( "appliedItem", { item: text }));
                    this.$emit( "select", value );
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
