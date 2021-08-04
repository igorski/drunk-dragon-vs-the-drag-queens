<template>
    <div>
        <h3 v-t="'askQuestion'"></h3>
        <div class="questions">
            <button
                v-t="'hi'"
                type="button"
                class="rpg-button"
                :title="$t('hi')"
                @click="interact(0)"
            ></button>
            <button
                v-t="'whatsInHere'"
                type="button"
                class="rpg-button"
                :title="$t('whatsInHere')"
                @click="interact(1)"
            ></button>
            <button
                v-t="'canIEnter'"
                type="button"
                class="rpg-button"
                :title="$t('canIEnter')"
                @click="interact(2)"
            ></button>
        </div>
        <h3 v-t="'giveItem'"></h3>
        <div class="actions">
            <inventory-list
                v-model="selectedItem"
                class="inventory-list"
            />
            <button
                v-t="'give'"
                type="button"
                class="rpg-button give-button"
                :title="$t('give')"
                :disabled="!selectedItem"
                @click="giveItem()"
            ></button>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import InventoryList from "@/components/shared/inventory-list/inventory-list";
import ItemTypes from "@/definitions/item-types";
import { randomBool, randomFromList, randomInRangeFloat } from "@/utils/random-util";

import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        InventoryList,
    },
    data: () => ({
        selectedItem: null,
    }),
    computed: {
        ...mapGetters([
            "character",
        ]),
        intent() {
            return this.character.properties.intent;
        },
        i18nKeyForIntent() {
            switch ( this.intent.type ) {
                case ItemTypes.JEWELRY:
                    return "jewelry";
                case ItemTypes.CLOTHES:
                    return "clothes";
                case ItemTypes.LIQUOR:
                    return "liquor";
                case ItemTypes.DRUGS:
                    return "drugs";
                case ItemTypes.HEALTHCARE:
                    return "healthcare";
            }
            return "generic";
        },
    },
    methods: {
        ...mapMutations([
            "showNotification",
            "removeCharacter",
        ]),
        ...mapActions([
            "buyItem",
            "giveItemToCharacter",
        ]),
        interact( type ) {
            let list;
            // the characters intent reflects in the answers
            // we mix up with some generic replies, but certain intents make a Queen be very direct
            const isDirect    = [ ItemTypes.DRUGS, ItemTypes.LIQUOR ].includes( this.intent.type );
            const messageType = isDirect || randomBool() ? this.i18nKeyForIntent : "generic";
            switch ( type ) {
                case 0:
                    list = this.$t( `answers.hi.${messageType}` );
                    break;
                case 1:
                    list = this.$t( `answers.whatsInHere.${messageType}` );
                    break;
                case 2:
                    list = this.$t( `answers.canIEnter.${messageType}` );
                    break;
            }
            this.updateMessage( randomFromList( list ));
        },
        async giveItem() {
            this.thought = "";
            if ( this.intent.type !== this.selectedItem.type ) {
                this.updateMessage( this.$t( "noThankYou" ));
                return;
            }
            if ( await this.giveItemToCharacter({ item: this.selectedItem, character: this.character }) ) {
                this.updateMessage( this.$t( "justWhatINeeded" ));
                window.setTimeout(() => {
                    this.$emit( "close" );
                    this.removeCharacter( this.character );
                }, 4000 );
            } else {
                this.updateMessage( this.$t( "wrongItem" ));
            }
            this.selectedItem = null;
        },
        updateMessage( message ) {
            this.$emit( "message", message );
        }
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_variables";

.inventory-list,
.give-button {
    display: inline !important;
}
</style>
