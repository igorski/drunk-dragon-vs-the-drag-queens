<template>
    <select-list
        :value.sync="value"
        :options="inventory"
        :placeholder="$t('findItemByName')"
        :disabled="!inventory.length"
        @input="updateValue"
    />
</template>

<script>
import { mapGetters }  from "vuex";
import SelectList      from "@/components/shared/select-list/select-list";
import sharedMessages  from "@/i18n/items.json";
import messages        from "./messages.json";

export default {
    i18n: { messages, sharedMessages },
    components: {
        SelectList,
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
            return this.player.inventory.items.map( value => ({ label: this.$t( value.name ), value }));
        }
    },
    methods: {
        updateValue( value ) {
            console.warn("update to",value);
            this.$emit( "input", value );
        },
    },
};
</script>
