<template>
    <model-select
        :value.sync="value"
        :options="inventory"
        :placeholder="$t('findItemByName')"
        :is-disabled="!inventory.length"
        @select="updateValue"
    />
</template>

<script>
import { mapGetters }  from "vuex";
import { ModelSelect } from "vue-search-select";
import sharedMessages  from "@/i18n/items.json";
import messages        from "./messages.json";

import "semantic-ui-css/components/dropdown.min.css"
import "vue-search-select/dist/VueSearchSelect.css";

export default {
    i18n: { messages, sharedMessages },
    components: {
        ModelSelect,
    },
    props: {
        value: {
            type: Object,
            default: null,
        },
    },
    computed: {
        ...mapGetters([
            "player",
        ]),
        inventory() {
            return this.player.inventory.items.map( value => ({ text: this.$t( value.name ), value }));
        }
    },
    methods: {
        updateValue({ value }) {
            this.$emit( "input", value );
        },
    },
};
</script>
