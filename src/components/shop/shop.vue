<template>
    <modal :title="$t('shop')" @close="$emit('close')">
        {{ shop }}
    </modal>
</template>

<script>
import { mapGetters } from 'vuex';
import Modal         from '@/components/modal/modal';
import messages from './messages.json';

export default {
    i18n: { messages },
    components: {
        Modal,
    },
    computed: {
        ...mapGetters([
            'shop',
        ]),
    },
};
</script>
