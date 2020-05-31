<template>
    <div ref='canvasContainer' />
</template>

<script>
import { mapGetters } from 'vuex';
import zCanvas from 'zcanvas';
import CaveRenderer from '@/renderers/cave-renderer';
import WorldRenderer from '@/renderers/world-renderer';
import WorldCache from '@/utils/world-cache';

import { CAVE_TYPE } from '@/model/cave-factory';
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
            immediate: true,
            handler( value ) {
                this.renderer && this.renderer.dispose();

                if ( !value ) return;

                switch ( value.type ) {
                    default:
                        throw new Error(`No renderer for type '${value.type}'`);
                        break;
                    case CAVE_TYPE:
                        this.renderer = new CaveRenderer( 100, 100 );
                        break;
                    case WORLD_TYPE:
                        this.renderer = new WorldRenderer( 100, 100 );
                        break;
                }
                // TODO ImageUtil must wait for spritecache for environment to be ready
                // prior to adding it to the canvas and trigger rendering

                this.zcanvas.addChild( this.renderer );
                this.renderer.render( value, this.player );
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
        handleKeyDown( aEvent ) {
            let preventDefault = false;
            switch ( aEvent.keyCode ) {
                case 37:    // left
                    this._player.move( Player.MOVE_LEFT );
                    preventDefault = true;
                    break;
                case 39:    // right
                    this._player.move( Player.MOVE_RIGHT );
                    preventDefault = true;
                    break;
                case 38:    // up
                    this._player.move( Player.MOVE_UP );
                    preventDefault = true;
                    break;
                case 40:    // down
                    this._player.move( Player.MOVE_DOWN );
                    preventDefault = true;
                    break;
            }
            if ( preventDefault )
                aEvent.preventDefault();
        },
        handleKeyUp({ keyCode }) {
            switch ( keyCode ) {
                case 37:    // left
                    this._player.stop( Player.MOVE_LEFT );
                    break;

                case 39:    // right
                    this._player.stop( Player.MOVE_RIGHT );
                    break;

                case 38:    // up
                    this._player.stop( Player.MOVE_UP );
                    break;

                case 40:    // down
                    this._player.stop( Player.MOVE_DOWN );
                    break;
            }
        }
    }
};
</script>