<template>
    <div ref='canvasContainer' />
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import zCanvas       from 'zcanvas';
import PlayerActions from '@/definitions/player-actions';
import CaveRenderer  from '@/renderers/cave-renderer';
import WorldRenderer from '@/renderers/world-renderer';
import SpriteCache   from '@/utils/sprite-cache';
import WorldCache    from '@/utils/world-cache';
import ImageUtil     from '@/utils/image-util';

import { CAVE_TYPE }  from '@/model/cave-factory';
import { WORLD_TYPE } from '@/model/world-factory';

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
        this.zcanvas = new zCanvas.canvas( 100, 100, true, 60 );
        this.zcanvas.setBackgroundColor( '#000000' );
        this.zcanvas.setSmoothing( false );

        // attach event handlers
        const resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';

        this.handlers.push({ event: 'keydown',   callback: this.handleKeyDown.bind( this ) });
        this.handlers.push({ event: 'keyup',     callback: this.handleKeyUp.bind  ( this ) });
        this.handlers.push({ event: resizeEvent, callback: this.handleResize.bind ( this ) });

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
        ...mapActions([
            'movePlayer',
        ]),
        handleResize() {
            const { clientWidth, clientHeight } = document.documentElement;

            // we'd like at least 9 horizontal tiles please
            const tilesInWidth  = WorldCache.tileWidth * ( clientWidth > 800 ? 15 : 9 );
            const tilesInHeight = Math.round(( clientHeight / clientWidth ) * tilesInWidth );

            this.zcanvas.setDimensions( tilesInWidth, tilesInHeight );

            // scale up using CSS

            const scaleStyle = `scale(${clientWidth  / tilesInWidth}, ${clientHeight / tilesInHeight})`;

            this.zcanvas.getElement().style[ '-webkit-transform' ] = scaleStyle;
            this.zcanvas.getElement().style[ 'transform' ]         = scaleStyle;

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
        handleKeyDown( aEvent ) {
            let preventDefault = false;
            switch ( aEvent.keyCode ) {
                case 37:    // left
                    this.movePlayer( PlayerActions.MOVE_LEFT );
                    preventDefault = true;
                    break;
                case 39:    // right
                    this.movePlayer( PlayerActions.MOVE_RIGHT );
                    preventDefault = true;
                    break;
                case 38:    // up
                    this.movePlayer( PlayerActions.MOVE_UP );
                    preventDefault = true;
                    break;
                case 40:    // down
                    this.movePlayer( PlayerActions.MOVE_DOWN );
                    preventDefault = true;
                    break;
            }
            if ( preventDefault )
                aEvent.preventDefault();
        },
        handleKeyUp({ keyCode }) {
            return; // nothing yet, this would imply animated movement
            switch ( keyCode ) {
                case 37:    // left
                    this.stopPlayerMovement( PlayerActions.MOVE_LEFT );
                    break;

                case 39:    // right
                    this.stopPlayerMovement( PlayerActions.MOVE_RIGHT );
                    break;

                case 38:    // up
                    this.stopPlayerMovement( PlayerActions.MOVE_UP );
                    break;

                case 40:    // down
                    this.stopPlayerMovement( PlayerActions.MOVE_DOWN );
                    break;
            }
        }
    }
};
</script>
