<template>
    <div class="actions">
        <h3 v-t="'actions'"></h3>
        <div
            class="actions__inline-group"
            @mouseleave="setHoverItem( null )"
        >
            <button
                v-t="'askQuestion'"
                type="button"
                class="rpg-ghost-button actions__inline-group--element"
                @touchstart="setHoverItem( 'question' )"
                @mouseenter="setHoverItem( 'question' )"
                @mouseleave="setHoverItem( null )"
            ></button>
            <ul
                class="actions actions__list-container"
                v-show="hoverItem === 'question'"
                @mouseenter="setHoverItem( 'question' )"
            >
                <li>
                    <button
                        v-t="'hi'"
                        type="button"
                        class="rpg-ghost-button"
                        @click="interact(0)"
                    ></button>
                </li>
                <li>
                    <button
                        v-t="'whatsInHere'"
                        type="button"
                        class="rpg-ghost-button"
                        @click="interact(1)"
                    ></button>
                </li>
                <li>
                    <button
                        v-t="'canIEnter'"
                        type="button"
                        class="rpg-ghost-button"
                        @click="interact(2)"
                    ></button>
                </li>
            </ul>
        </div>
        <div
            class="actions__inline-group"
            @mouseleave="setHoverItem( null )"
        >
            <button
                v-t="'giveItem'"
                type="button"
                :disabled="!player.inventory.items.length"
                class="rpg-ghost-button actions__inline-group--element"
                @touchstart="setHoverItem( 'inventory' )"
                @mouseenter="setHoverItem( 'inventory' )"
            ></button>
            <inventory
                v-show="hoverItem === 'inventory'"
                :player="player"
                :auto-apply="false"
                list-only
                class="actions actions__list-container"
                @mouseenter="setHoverItem( 'inventory' )"
                @select="giveItem( $event )"
            />
        </div>
        <div class="actions__inline-group">
            <button
                v-t="'leave'"
                type="button"
                class="rpg-ghost-button"
                @click="leave()"
            ></button>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import ItemTypes from "@/definitions/item-types";
import Inventory from "@/components/inventory/inventory";
import ActionsUI from "@/mixins/actions-ui";
import { randomBool, randomFromList, randomInRangeFloat } from "@/utils/random-util";

import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        Inventory,
    },
    mixins: [ ActionsUI ],
    computed: {
        ...mapGetters([
            "character",
            "player",
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
                case ItemTypes.FOOD:
                    return "food";
            }
            return null;
        },
    },
    methods: {
        ...mapMutations([
            "removeCharacter",
            "showNotification",
        ]),
        ...mapActions([
            "buyItem",
            "giveItemToCharacter",
        ]),
        interact( type ) {
            let list;
            // the characters intent reflects in the answers
            const messageType = this.i18nKeyForIntent;
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
        async giveItem( item ) {
            this.thought = "";
            if ( this.intent.type !== item.type ) {
                this.updateMessage( this.$t( "noThankYou" ));
                return;
            }
            if ( await this.giveItemToCharacter({ item, character: this.character }) ) {
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
        },
        leave() {
            this.$emit( "close" );
        },
    }
};
</script>

<style lang="scss" scoped>
@import "@/styles/actions";
</style>
