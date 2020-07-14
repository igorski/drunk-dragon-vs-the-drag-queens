<template>
    <div class="popup-window">
        <h3>{{ title }}</h3>
        <button type="button"
                class="close-button"
                :title="$t('closeWindow')"
                @click="$emit('close')"
        >&times;</button>
        <slot></slot>
    </div>
</template>

<script>
import messages from './messages.json';

export default {
    i18n: { messages },
    props: {
        title: {
            type: String,
            required: true,
        }
    }
};
</script>

<style lang="scss" scoped>
    @import '@/styles/_layout';

    .popup-window {
        @include overlay();
        @include border();
        @include boxSize();
        background-color: $color-3;

        @include large() {
            max-width: $app-width;
            max-height: 75vh;
            overflow-y: auto;
            padding: $spacing-medium $spacing-large;
            box-sizing: border-box;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }

        @include mobile() {
            // on mobile we want these popups to appear below the menu
            padding: $menu-height-mobile $spacing-medium 0 $spacing-medium;
        }
    }

    .close-button {
        position: absolute;
        top: $spacing-medium;
        right: $spacing-medium;
        cursor: pointer;
        background: none;
        border: 0;
        font-size: 150%;

        @include mobile() {
            top: $menu-height-mobile + $spacing-medium;
        }
    }

</style>
