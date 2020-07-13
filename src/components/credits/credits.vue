<template>
    <div class="credits">
        <h3 v-t="'artwork'"></h3>
        <button type="button"
                class="close-button"
                @click="$emit('close')"
        >&times;</button>
        <ul>
            <li>
                World sprite tiles by Joost Huijbers.
            </li>
            <li v-for="(c, idx) in artwork"
                :key="`c_${idx}`"
            >
                <contributor :href="c.href" :title="c.title" :author="c.author" />
            </li>
        </ul>
    </div>
</template>

<script>
import Contributor from './contributor';
import messages from './messages.json';

export default {
    i18n: { messages },
    components: {
        Contributor,
    },
    data: () => ({
        artwork: [
            {
                title: "LPC Lamp Posts Rework",
                author: "AntumDeluge",
                href: "https://opengameart.org/content/lpc-lamp-posts-rework"
            },
            {
                title: "Sewer tileset",
                author: "Beast",
                href: "https://opengameart.org/content/sewer-tileset"
            },
            {
                title: "City pixel tileset",
                author: "software_atelier",
                href: "https://opengameart.org/content/city-pixel-tileset"
            },
        ],
    }),
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_layout';

    .credits {
        @include overlay();

        @include large() {
            width: 640px;
            height: 480px;
            overflow-y: auto;
            padding: $spacing-medium;
            box-sizing: border-box;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
    }
</style>
