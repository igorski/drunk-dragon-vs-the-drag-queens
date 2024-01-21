<template>
    <div class="intro">
        <img
            src="@/assets/illustrations/title_screen.gif"
            :alt="$t('gameTitle')"
            class="title-screen"
        />
        <animated-text-window
            v-if="showStory"
            :text="storyText"
            :title="$t('storyTitle')"
            class="text"
            @displayed="handleStoryDisplayed()"
            @next="handleStoryDisplayed()"
        />
        <button
            v-else
            v-t="'startGame'"
            type="button"
            class="rpg-button start-button"
            @click="startStory()"
        ></button>
    </div>
</template>

<script>
import { mapMutations } from "vuex";
import { SCREEN_CHARACTER_CREATE } from "@/definitions/screens";
import AnimatedTextWindow from "@/components/animated-text-window/animated-text-window.vue";
import messages from "./messages.json";

export default {
    i18n: { messages },
    components: {
        AnimatedTextWindow,
    },
    data: () => ({
        showStory  : false,
        storyIndex : 0,
    }),
    computed: {
        storyText() {
            return this.$t( `introStory${this.storyIndex + 1 }` );
        },
    },
    methods: {
        ...mapMutations([
            "setScreen",
        ]),
        handleStoryDisplayed() {
            if ( ++this.storyIndex >= 3 ) {
                this.startGame();
            }
        },
        startStory() {
            this.showStory = true;
        },
        startGame() {
            this.setScreen( SCREEN_CHARACTER_CREATE );
        }
    },
};
</script>

<style lang="scss" scoped>
@import "@/styles/_layout.scss";

.intro {
    @include window();
    width: 100%;
    vertical-align: top;
    position: relative;
}

.title-screen {
    width: 100%;
    max-width: 1280px;
    z-index: 1;
}

@include large() {
    .start-button,
    .text {
        position: absolute;
        left: 0;
        top: $menu-height + $spacing-medium;
        z-index: 2;
    }
}
</style>
