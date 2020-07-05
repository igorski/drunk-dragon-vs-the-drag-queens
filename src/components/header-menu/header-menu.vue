<template>
    <header>
        <button type="button" @click="handleSave">Save game</button>
        <button type="button" @click="handleReset">Reset game</button>
    </header>
</template>

<script>
import { mapMutations, mapActions } from 'vuex';
import messages from './messages.json';

export default {
    i18n: { messages },
    methods: {
        ...mapMutations([
            'openDialog',
            'showError',
            'showNotification',
        ]),
        ...mapActions([
            'resetGame',
            'saveGame',
        ]),
        async handleSave() {
            try {
                await this.saveGame();
                this.showNotification({ message: this.$t('gameSavedSuccessfully') });
            } catch {
                this.showError( this.$t('error.unknownError'));
            }
        },
        handleReset() {
            this.openDialog({
                type: 'confirm',
                title: this.$t('areYouSure'),
                message: this.$t('resetGameDescr'),
                confirm: () => {
                    this.resetGame();
                    window.location.reload(); // a little bruteforce
                }
            });
        }
    }
};
</script>

<style lang="scss" scoped>

</style>
