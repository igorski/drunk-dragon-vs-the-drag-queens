<template>
    <modal :title="$t('credits')" @close="$emit('close')">
        <p>
            Unless otherwise stated, programming, illustrations and music by
            <a href="https://www.igorski.nl" target="_blank" title="igorski.nl website">igorski</a>.<br />
            Title and concept kindly donated by Lucas van Heerikhuizen. Overground sprite tiles by Joost Huijbers.
        </p>
        <h3 v-t="'artwork'"></h3>
        <ul>
            <li v-for="(c, idx) in artwork"
                :key="`c_${idx}`"
            >
                <contributor :href="c.href" :title="c.title" :author="c.author" />
            </li>
        </ul>
    </modal>
</template>

<script>
import Contributor from "./contributor.vue";
import Modal       from "@/components/modal/modal.vue";
import messages    from "./messages.json";

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
            {
                title: "16x16 dragon",
                author: "chasersgaming",
                href: "https://opengameart.org/content/16x16-dragon"
            },
            {
                title: "Twelve 16x18 RPG sprites, plus base",
                author: "Antifarea",
                href: "https://opengameart.org/content/twelve-16x18-rpg-sprites-plus-base",
            },
            {
                title: "[LPC] Misc tile atlas",
                author: "Sharm, Janna, Tuomo Untinen, Casper Nilsson, Barbara Rivera and Daneeklu",
                href: "https://opengameart.org/content/lpc-misc-tile-atlas-interior-exterior-trees-bridges-furniture"
            },
            {
                title: "[LPC] House Insides",
                author: "Sharm",
                href: "https://opengameart.org/content/lpc-house-insides"
            },
            {
                title: "Crosshair pack (200x)",
                author: "Kenney",
                href: "https://opengameart.org/content/crosshair-pack-200%C3%97"
            },
            {
                title: "RPG Weapons and tools",
                author: "PracticalNPC",
                href: "https://opengameart.org/content/rpg-weapons-and-tools"
            }
        ],
    }),
};
</script>
