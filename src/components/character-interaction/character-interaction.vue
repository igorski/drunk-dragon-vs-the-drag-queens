<template>
    <modal :title="$t('conversation')"
           class="interaction-modal"
           @close="$emit('close')"
    >
        <div class="interactions">
            <div class="questions">
                <h3 v-t="'askQuestion'"></h3>
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
            <div class="actions">
                <h3 v-t="'giveItem'"></h3>
                <button v-t="'give'"
                        type="button"
                        class="rpg-button"
                        :title="$t('give')"
                        @click="giveItem()"
                ></button>
            </div>
        </div>
        <div class="character">
            <div v-if="message" class="speech-bubble speech-bubble__bottom-left">{{ message }}</div>
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
import ItemTypes          from '@/definitions/item-types';
import PriceTypes         from '@/definitions/price-types';
import { SHOP_TYPES }     from '@/model/factories/shop-factory';
import { randomFromList } from '@/utils/random-util';
import messages           from './messages.json';

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    data: () => ({
        message: '',
        askedQuestions: 0,
        intentTimeout: null,
    }),
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
    beforeDestroy() {
        this.clearIntentTimeout();
    },
    methods: {
        ...mapMutations([
            'openDialog',
            'showNotification',
        ]),
        ...mapActions([
            'buyItem',
        ]),
        showIntent({ name, price }) {
            let i18n = '';
            if ( price >= PriceTypes.LUXURY ) {
                i18n = `${this.$t( 'luxury' )} `;
            } else if ( price >= PriceTypes.EXPENSIVE ) {
                i18n = `${this.$t( 'quality' )} `;
            }
            this.message = `${i18n}${this.$t( name )}`;
        },
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

            // persistent bugging shows the Characters intent
            if ( ++this.askedQuestions > 3 ) {
                this.intentTimeout = window.setTimeout(() => {
                    switch ( this.intent.type ) {
                        case ItemTypes.JEWELRY:
                            this.message = this.$t('convinceMeWithAPresent');
                            break;
                        case ItemTypes.LIQUOR:
                            this.message = this.$t('couldUseADrink');
                            break;
                        case ItemTypes.HEALTHCARE:
                            this.message = this.$t('feelingSick');
                            break;
                    }
                }, 7500 );
            }
        },
        clearIntentTimeout() {
            window.clearTimeout( this.intentTimeout );
        },
        giveItem( item ) {
            console.warn(item);
        },
    },
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_variables';

    .interaction-modal {
        overflow: visible; // speech bubble
    }

    .interactions, .character {
        display: inline-block;
        position: relative;
        vertical-align: top;
    }

    .speech-bubble {
        position: absolute;
        z-index: 1;
        top: -$spacing-xlarge;
        font-family: sans-serif;
        font-size: 18px;
        line-height: 24px;
        width: 300px;
        background: #fff;
        border-radius: 40px;
        padding: 24px;
        text-align: center;
        color: #000;

        &__bottom-left:before {
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
</style>
