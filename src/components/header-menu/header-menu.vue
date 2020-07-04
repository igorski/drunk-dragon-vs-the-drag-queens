<template>
    <header>
        <button type="button" @click="saveGame">Save game</button>
        <button type="button" @click="resetGame">Reset game</button>
    </header>
</template>

<script>
import { mapActions } from 'vuex';

export default {
    methods: {
        ...mapActions([
            'resetGame',
            'saveGame',
        ]),
    }
};
</script>

<style lang="scss" scoped>

</style>
