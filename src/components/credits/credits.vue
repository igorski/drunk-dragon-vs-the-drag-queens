<template>
    <div>
        <h3 v-t="'artwork'"></h3>
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
