<template>
    <modal :title="$t('conversation')"
           class="interaction-modal"
           @close="close()"
    >
        <div class="interactions">
            <h3 v-t="'askQuestion'"></h3>
            <div class="questions">
                <button v-t="'hi'"
                        type="button"
                        class="rpg-button"
                        :title="$t('hi')"
                        @click="interact(0)"
                ></button>
                <button v-t="'whatsInHere'"
                        type="button"
                        class="rpg-button"
                        :title="$t('whatsInHere')"
                        @click="interact(1)"
                ></button>
                <button v-t="'canIEnter'"
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
                <button v-t="'give'"
                        type="button"
                        class="rpg-button give-button"
                        :title="$t('give')"
                        :disabled="!selectedItem"
                        @click="giveItem()"
                ></button>
            </div>
        </div>
        <div class="character">
            <div v-if="message"
                 class="speech-bubble"
                 @click="message = null"
             >{{ message }}</div>
             <div v-if="thought"
                  class="thought-bubble"
                  @click="thought = null"
             >{{ thought }}</div>
             <component
                class="character-preview"
                :is="characterComponent"
                :character="character"
                :width="characterWidth"
            />
        </div>
    </modal>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import sortBy             from 'lodash/sortBy';
import Modal              from '@/components/modal/modal';
import InventoryList      from '@/components/shared/inventory-list/inventory-list';
import ItemTypes          from '@/definitions/item-types';
import PriceTypes         from '@/definitions/price-types';
import { SHOP_TYPES }     from '@/model/factories/shop-factory';
import { randomFromList } from '@/utils/random-util';
import messages           from './messages.json';

export default {
    i18n: { messages },
    components: {
        Modal,
        InventoryList,
    },
    data: () => ({
        askedQuestions: 0,
        intentTimeout: null,
        message: '',
        thought: '',
        selectedItem: null,
    }),
    computed: {
        ...mapState([
            'dimensions',
        ]),
        ...mapGetters([
            'character',
        ]),
        intent() {
            return this.character.properties.intent;
        },
        characterComponent() {
            // TODO: currently we only interact with queens?
            return () => import('@/renderers/character-queen');
        },
        characterWidth() {
            const ideal = 300; /* see _variables@mobile-width */
            const { width } = this.dimensions;
            return Math.min( ideal, width * .9 );
        },
    },
    beforeDestroy() {
        this.clearIntentTimeout();
    },
    methods: {
        ...mapMutations([
            'openDialog',
            'showNotification',
            'removeCharacter',
        ]),
        ...mapActions([
            'buyItem',
            'giveItemToCharacter',
        ]),
        interact( type ) {
            let list;
            this.clearIntentTimeout();
            switch ( type ) {
                case 0:
                    list = this.$t('answers.hi');
                    break;
                case 1:
                    list = this.$t('answers.whatsInHere');
                    break;
                case 2:
                    list = this.$t('answers.canIEnter');
                    break;
            }
            this.message = randomFromList( list );

            // persistent bugging shows the Characters intent in a thought balloon
            if ( ++this.askedQuestions > 2 && this.intentTimeout === null ) {
                this.intentTimeout = window.setTimeout(() => {
                    switch ( this.intent.type ) {
                        case ItemTypes.JEWELRY:
                            this.thought = this.$t('convinceMeWithAPresent');
                            break;
                        case ItemTypes.LIQUOR:
                            this.thought = this.$t('couldUseADrink');
                            break;
                        case ItemTypes.HEALTHCARE:
                            this.thought = this.$t('feelingSick');
                            break;
                    }
                }, 5000 );
            }
        },
        clearIntentTimeout() {
            window.clearTimeout( this.intentTimeout );
        },
        async giveItem() {
            if ( this.intent.type !== this.selectedItem.type ) {
                this.message = this.$t('noThankYou');
                return;
            }
            if ( await this.giveItemToCharacter({ item: this.selectedItem, character: this.character }) ) {
                this.message = this.$t('justWhatINeeded');
                window.setTimeout(() => {
                    this.close();
                    this.removeCharacter( this.character );
                }, 5000 );
            } else {
                this.message = this.$t('tooCheap');
            }
            this.selectedItem = null;
        },
        close() {
            this.$emit('close');
        }
    },
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_variables';

    .interaction-modal {
        overflow: visible; // speech bubble
        /deep/ .modal__content {
            overflow: visible !important;
        }
    }

    .interactions, .character {
        display: inline-block;
        position: relative;
        vertical-align: top;
    }

    @mixin bubble() {
        position: absolute;
        z-index: 1;
        top: -$spacing-xlarge;
        font-family: sans-serif;
        font-size: 18px;
        line-height: 24px;
        background: #fff;
        text-align: center;
    }

    .speech-bubble {
        @include bubble();
        width: 300px;
        border-radius: 40px;
        padding: 24px;
        color: #000;

        &:before {
            content: "";
            width: 0;
            height: 0;
            position: absolute;
            border-left: 12px solid transparent;
            border-right: 24px solid #fff;
            border-top: 12px solid #fff;
            border-bottom: 20px solid transparent;
            left: 32px;
            bottom: -24px;
        }
    }

    .thought-bubble {
        @include bubble();
        z-index: 2;
        display: flex;
        padding: 20px;
        border-radius: 30px;
        min-width: 40px;
        max-width: 220px;
        min-height: 40px;
        align-items: center;
        justify-content: center;

        &:before,
        &:after {
            content: "";
            background-color: #fff;
            border-radius: 50%;
            display: block;
            position: absolute;
            z-index: -1;
        }

        &:before {
            width: 44px;
            height: 44px;
            top: -12px;
            left: 28px;
            box-shadow: -50px 30px 0 -12px #fff;
        }
        &:after {
            bottom: -10px;
            right: 26px;
            width: 30px;
            height: 30px;
            box-shadow: 40px -34px 0 0 #fff,
                        -28px -6px 0 -2px #fff,
                        -24px 17px 0 -6px #fff,
                        -5px 25px 0 -10px #fff;
        }
    }

    .inventory-list,
    .give-button {
        display: inline !important;
    }
</style>
