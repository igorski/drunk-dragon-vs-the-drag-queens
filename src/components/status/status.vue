<template>
    <modal :title="$t('status')" @close="$emit('close')">
        <div class="status-content">
            <h3 v-t="'map'"></h3>
            <img ref="map" class="map-image" />
            <h3 v-t="'time'"></h3>
            <span class="time">{{ time }}</span>
            <h3 v-t="'date'"></h3>
            <span class="date">{{ date }}</span>
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
import Modal         from '@/components/modal/modal';
import { renderMap } from '@/renderers/world-map-renderer';
import { timestampToFormattedDate, timestampToTimeString } from '@/utils/time-util';

import messages from './messages.json';

export default {
    i18n: { messages },
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
    },
    mounted() {
        this.$refs.map.src = renderMap( this.activeEnvironment, 1.25 ).src;
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
        height: 210px;
    }

    @include large() {
        .character-preview {
            position: absolute !important;
            right: $spacing-large;
            top: $spacing-small;
        }
    }
</style>
