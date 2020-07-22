<template>
    <modal :title="$t('artwork')" @close="$emit('close')">
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
    </modal>
</template>

<script>
import Contributor from './contributor';
import Modal       from '@/components/modal/modal';
import messages    from './messages.json';

export default {
    i18n: { messages },
    components: {
        Contributor,
        Modal,
    },
    data: () => ({
        artwork: [
            {
                title: "Roguelike Modern City pack",
                author: "Kenney",
                href: "https://opengameart.org/content/roguelike-modern-city-pack"
            },
            {
                title: "Overworld Objects",
                author: "Kelvin Shadewing",
                href: "https://opengameart.org/content/overworld-objects"
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
