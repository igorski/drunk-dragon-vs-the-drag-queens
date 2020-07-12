<template>
    <div ref="canvasContainer" />
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import { canvas }     from 'zcanvas';
import CaveRenderer   from '@/renderers/cave-renderer';
import WorldRenderer  from '@/renderers/world-renderer';
import SpriteCache    from '@/utils/sprite-cache';
import WorldCache     from '@/utils/world-cache';
import ImageUtil      from '@/utils/image-util';
import { CAVE_TYPE }  from '@/model/factories/cave-factory';
import { WORLD_TYPE } from '@/model/factories/world-factory';

export default {
    data: () => ({
        zcanvas: null,
        renderer: null,
        handlers: [],
    }),
    computed: {
        ...mapGetters([
            'activeEnvironment',
            'player',
        ]),
    },
    watch: {
        activeEnvironment: {
            handler( value ) {
                this.handleEnvironment();
            },
        },
    },
    created() {
        /**
         * Construct zCanvas instance to render the game world. The zCanvas
         * also maintains the game loop that will update the world prior to each render cycle.
         */
        this.zcanvas = new canvas({
            width: window.innerWidth,
            height: window.innerHeight,
            animate: true,
            smoothing: false,
            stretchToFit: true,
            backgroundColor: '#000',
            fps: 60,
            onUpdate: this.updateGame.bind( this )
        });
        this.setLastRender( Date.now() );

        // attach event handlers
        const resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';
        this.handlers.push({ event: resizeEvent, callback: this.handleResize.bind( this ) });
        this.handlers.forEach(({ event, callback }) => {
            window.addEventListener( event, callback );
        });
        this.handleEnvironment();
    },
    mounted() {
        this.zcanvas.insertInPage( this.$refs.canvasContainer );
        this.handleResize( null ); // size to match device / browser dimensions
    },
    destroyed() {
        this.handlers.forEach(({ event, callback }) => {
            window.removeEventListener( event, callback );
        });
        this.handlers = [];
        this.zcanvas.dispose();
        this.renderer && this.renderer.dispose();
    },
    methods: {
        ...mapMutations([
            'setLastRender',
        ]),
        ...mapActions([
            'movePlayer',
            'updateGame',
        ]),
        handleResize() {
            const { clientWidth, clientHeight } = document.documentElement;

            // we'd like at least 9 horizontal tiles please
            const tilesInWidth  = WorldCache.tileWidth * ( clientWidth > 800 ? 15 : 9 );
            const tilesInHeight = Math.round(( clientHeight / clientWidth ) * tilesInWidth );

            //this.zcanvas.setDimensions( tilesInWidth, tilesInHeight );
            this.zcanvas.scale( clientWidth / tilesInWidth, clientHeight / tilesInHeight );
            this.renderer && this.renderer.setTileDimensions( tilesInWidth, tilesInHeight );

            // nope, keep at given dimensions mentioned above
            /*
            this._canvas.setDimensions( windowWidth, windowHeight );
            this.renderer.updateImage ( null, windowWidth, windowHeight );
            */
        },
        handleEnvironment() {
            this.renderer && this.renderer.dispose();
            const environment = this.activeEnvironment;

            if ( !environment ) return;
            let sprite;

            switch ( environment.type ) {
                default:
                    throw new Error(`No renderer for type '${environment.type}'`);
                    break;
                case CAVE_TYPE:
                    this.renderer = new CaveRenderer( this.$store, 100, 100 );
                    sprite = SpriteCache.CAVE;
                    break;
                case WORLD_TYPE:
                    this.renderer = new WorldRenderer( this.$store, 100, 100 );
                    sprite = SpriteCache.WORLD;
                    break;
            }
            ImageUtil.onReady( sprite, () => {
                this.zcanvas.addChild( this.renderer );
                this.renderer.render( environment, this.player );
            });
        },
    }
};
</script>
