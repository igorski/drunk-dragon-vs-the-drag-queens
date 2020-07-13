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
