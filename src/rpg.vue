<template>
    <div class="rpg">
        <template v-if="loading">
            Loading...
        </template>
        <template v-else>
            <header-menu class="menu" />
            <div class="ui">
                <h1>RPG</h1>
                <span class="time">{{ time }}</span>
            </div>
            <world class="game-renderer" />
        </template>
    </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import { preloadAssets } from '@/services/asset-preloader';
import { timestampToTimeString } from '@/utils/time-util';
import HeaderMenu from '@/components/header-menu/header-menu';
import World from '@/components/world/world';

export default {
    components: {
        HeaderMenu,
        World,
    },
    computed: {
        ...mapState([
            'loading',
        ]),
        ...mapGetters([
            'gameTime',
            'hasSavedGame',
        ]),
        time() {
            return timestampToTimeString( this.gameTime );
        },
    },
    async created() {
        this.setLoading( true );

        await preloadAssets();
        await this.prepareAudio();

        if ( this.hasSavedGame() ) {
            console.warn('load');
            await this.loadGame();
        } else {
            console.warn('create');
            // TODO: character creation first, game creation second?
            await this.createGame();
        }
        this.setLoading( false );
    },
    methods: {
        ...mapMutations([
            'setLoading',
        ]),
        ...mapActions([
            'prepareAudio',
            'createGame',
            'loadGame',
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
.menu {
    position: fixed;
    top: 0;
    z-index: 2;
}
.time {
    color: #fff;
}
.ui {
    position: absolute;
    z-index: 1;
}
.game-renderer {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
}
</style>
