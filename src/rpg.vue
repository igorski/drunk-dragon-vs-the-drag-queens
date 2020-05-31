<template>
    <div class="rpg">
        <template v-if="loading">
            Loading...
        </template>
        <template v-else>
            <h1>RPG</h1>
            <world />
        </template>
    </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import { preloadAssets } from '@/services/asset-preloader';
import World from '@/components/world/world';

export default {
    components: {
        World,
    },
    computed: {
        ...mapState([
            'loading',
        ]),
    },
    async created() {
        this.setLoading( true );

        await preloadAssets();
        await this.prepareAudio();

        // QQQ restore storage
        // first run, create game
        await this.createGame();

        /*
        if ( !Storage.get( "game" ))
        {
            // first run, create game
            this.broadcast( Notifications.Storage.CREATE_NEW_GAME );
        }
        else {
            // returning user, restore game
            this.broadcast( Notifications.Storage.RESTORE_GAME );
        }
        */
        this.setLoading( false );
    },
    methods: {
        ...mapMutations([
            'setLoading',
        ]),
        ...mapActions([
            'prepareAudio',
            'createGame',
        ]),
    },
};
</script>

<style lang="scss" scoped>
.rpg {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
