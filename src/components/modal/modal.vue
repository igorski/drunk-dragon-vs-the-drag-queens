<template>
    <div class="modal">
        <div class="modal__header">
            <h3>{{ title }}</h3>
            <button
                v-if="dismissible"
                type="button"
                class="close-button"
                :title="$t('closeWindow')"
                @click="close()"
            >&times;</button>
        </div>
        <div class="modal__content">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import messages from "./messages.json";

export default {
    i18n: { messages },
    props: {
        title: {
            type: String,
            required: true,
        },
        dismissible: {
            type: Boolean,
            default: true,
        },
    },
    created() {
        this._keyHandler = this.handleKeys.bind( this );
        window.addEventListener( "keyup", this._keyHandler );
    },
    destroyed() {
        window.removeEventListener( "keyup", this._keyHandler );
    },
    methods: {
        handleKeys({ keyCode }) {
            if ( this.dismissible && keyCode === 27 ) {
                this.close();
            }
        },
        close() {
            this.$emit( "close" );
        }
    },
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

    &__content {
        // modal header is 78px in height
        $padding: 78px + $menu-height-mobile;
        padding-bottom: $padding;
        height: calc(100% - #{$padding});
    }

    @include large() {
        max-width: $app-width;
        max-height: 75vh;
        box-sizing: border-box;
        @include center(fixed);
        top: calc(50% - 48px); // .ui parent container falls below menu

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
    z-index: 2;
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
