<template>
    <modal :title="$t('status')" @close="$emit('close')">
        <div class="status-content">
            <h3 v-t="'map'"></h3>
            <img ref="map" class="map-image" />
            <h3 v-t="'time'"></h3>
            <span>{{ time }}</span>
            <h3 v-t="'date'"></h3>
            <span>{{ date }}</span>
            <h3 v-t="'cash'"></h3>
            <span>$ {{ player.inventory.cash.toFixed( 2 ) }}</span>
            <h3 v-t="'inventory'"></h3>
            <ul v-if="inventory.length">
                <li v-for="(item, index) in inventory"
                      :key="`item${index}`"
                      class="inventory-item"
                >
                    {{ item.text }}
                </li>
            </ul>
            <p v-else v-t="'youHaveNoItems'"></p>
            <component
                class="character-preview"
                :is="characterComponent"
                :character="player"
                :width="characterWidth"
            />
        </div>
    </modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '@/components/modal/modal';
import { BUILDING_TYPE } from '@/model/factories/building-factory';
import { timestampToFormattedDate, timestampToTimeString } from '@/utils/time-util';
import renderWorld from '@/renderers/world-map-renderer';
import renderBuilding from '@/renderers/building-map-renderer';
import sharedMessages from '@/i18n/items.json';
import messages from './messages.json';

export default {
    i18n: { messages, sharedMessages },
    components: {
        Modal,
    },
    computed: {
        ...mapState([
            'dimensions',
        ]),
        ...mapGetters([
            'activeEnvironment',
            'gameTime',
            'player',
        ]),
        characterComponent() {
            // TODO: currently female only
            return () => import('@/renderers/character-female');
            //return this.player.sex === 'F' ?
        },
        characterWidth() {
            const ideal = 300; /* see _variables@mobile-width */
            const { width } = this.dimensions;
            return Math.min( ideal, width * .9 );
        },
        date() {
            return timestampToFormattedDate( this.gameTime );
        },
        time() {
            return timestampToTimeString( this.gameTime );
        },
        inventory() {
            return this.player.inventory.items.map( value => ({ text: this.$t( value.name ), value }));
        },
    },
    async mounted() {
        let renderFn;
        switch ( this.activeEnvironment.type ) {
            default:
                renderFn = renderWorld;
                break;
            case BUILDING_TYPE:
                renderFn = renderBuilding;
                break;
        }
        this.$refs.map.src = renderFn( this.activeEnvironment, 210 ).src;
    },
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_variables';

    .status-content {
        vertical-align: top;
    }

    .map-image {
        width: 210px;
    }

    .inventory-item {
        display: block;
    }

    @include large() {
        .character-preview {
            position: absolute !important;
            right: $spacing-large;
            top: $spacing-small;
        }
    }
</style>
