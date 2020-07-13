<template>
    <popup-window :title="$t('status')" @close="$emit('close')">
        <p>tja...</p>
        <img ref="map" class="map-image" />
        <component :is="characterComponent"
            :character="player"
            :width="300"
        />
    </popup-window>
</template>

<script>
import { mapGetters } from 'vuex';
import PopupWindow    from '@/components/popup-window/popup-window';
import { renderMap }  from '@/renderers/world-map-renderer';

import messages from './messages.json';

export default {
    i18n: { messages },
    components: {
        PopupWindow,
    },
    computed: {
        ...mapGetters([
            'activeEnvironment',
            'player',
        ]),
        characterComponent() {
            // TODO: currently female only
            return () => import('@/renderers/character-female');
            //return this.player.sex === 'F' ?
        },
    },
    mounted() {
        this.$refs.map.src = renderMap( this.activeEnvironment, 1.25 ).src;
    },
};
</script>
