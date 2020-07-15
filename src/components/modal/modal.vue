<template>
    <div class="modal">
        <div class="modal__header">
            <h3>{{ title }}</h3>
            <button type="button"
                    class="close-button"
                    :title="$t('closeWindow')"
                    @click="$emit('close')"
            >&times;</button>
        </div>
        <div class="modal__content">
            <slot></slot>
        </div>
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

    .modal {
        @include overlay();
        @include border();
        @include boxSize();
        background-color: $color-3;
        overflow: hidden;

        $header-height: 78px;

        &__content {
            padding-bottom: $header-height;
            height: calc(100% - $header-height);
        }

        @include large() {
            max-width: $app-width;
            max-height: 75vh;
            box-sizing: border-box;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);

            &__header {
                padding: $spacing-medium $spacing-large;
            }
            &__content {
                padding-left: $spacing-large;
                margin-right: $spacing-medium + $spacing-small;
            }
        }

        @include mobile() {
            // on mobile we want these popups to appear below the menu
            &__header {
                padding: $menu-height-mobile $spacing-medium 0 $spacing-medium;
            }
            &__content {
                margin: 0 $spacing-medium $spacing-medium;
            }
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

    .modal__content {
        @include scrollableWindow();
        @include boxSize();
    }

</style>