<template>
    <div v-show="!DEBUG" ref="canvasContainer" class="world-canvas" />
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from "vuex";
import { canvas, loader } from "zcanvas";
import { SCREEN_GAME }    from "@/definitions/screens";
import BuildingRenderer   from "@/renderers/building-renderer";
import OvergroundRenderer from "@/renderers/overground-renderer";
import SpriteCache        from "@/utils/sprite-cache";
import WorldCache         from "@/utils/world-cache";
import { BUILDING_TYPE }  from "@/model/factories/building-factory";
import { WORLD_TYPE }     from "@/model/factories/world-factory";

const MIN_AMOUNT_OF_TILES = 9; // minimum amount of tiles visible on the dominant axis of the screen
let zcanvas, renderer;

export default {
    data: () => ({
        handlers: [],
        // in development mode debug mode toggles between the world renderer and the full map
        DEBUG: false,
    }),
    computed: {
        ...mapState([
            "screen",
        ]),
        ...mapGetters([
            "activeEnvironment",
            "player",
        ]),
    },
    watch: {
        activeEnvironment: {
            handler( value ) {
                this.handleEnvironment();
            },
        },
        screen: {
            immediate: true,
            handler( value ) {
                renderer?.setInteractive( value === SCREEN_GAME );
            }
        },
        DEBUG( value ) {
            if ( process.env.NODE_ENV === "development" ) {
                if ( value ) {
                    if ( !this._debugSprite ) {
                        this._debugSprite = new Image();
                        this._debugSprite.style.width  = "auto";
                        this._debugSprite.style.height = "550px";
                    }
                    this._debugSprite.src = ( this.activeEnvironment.type === BUILDING_TYPE ? SpriteCache.ENV_BUILDING : SpriteCache.ENV_WORLD ).src;
                    document.body.appendChild( this._debugSprite );
                } else if ( this._debugSprite ){
                    document.body.removeChild( this._debugSprite );
                }
            }
        }
    },
    created() {
        /**
         * Construct zCanvas instance to render the game world. The zCanvas
         * also maintains the game loop that will update the world prior to each render cycle.
         */
        zcanvas = new canvas({
            width: window.innerWidth,
            height: window.innerHeight,
            animate: true,
            smoothing: false,
            fps: 60,
            onUpdate: this.updateGame.bind( this )
        });
        this.setLastRender( Date.now() );

        // attach event handlers
        const resizeEvent = "onorientationchange" in window ? "orientationchange" : "resize";
        this.handlers.push({ event: resizeEvent, callback: this.handleResize.bind( this ) });
        this.handlers.forEach(({ event, callback }) => {
            window.addEventListener( event, callback );
        });
        this.handleEnvironment();

        if ( process.env.NODE_ENV === "development" ) {
            window.addEventListener( "keyup", ({ keyCode }) => {
                if ( keyCode === 68 ) {
                    this.DEBUG = !this.DEBUG; // toggle debug mode with D key
                }
            });
        }
    },
    mounted() {
        zcanvas.insertInPage( this.$refs.canvasContainer );
    },
    destroyed() {
        this.handlers.forEach(({ event, callback }) => {
            window.removeEventListener( event, callback );
        });
        this.handlers = [];
        zcanvas.dispose();
        renderer?.dispose();
    },
    methods: {
        ...mapMutations([
            "setLastRender",
        ]),
        ...mapActions([
            "movePlayer",
            "updateGame",
        ]),
        handleResize() {
            const { clientWidth, clientHeight } = document.documentElement;
            let tilesInWidth, tilesInHeight;

            if ( clientWidth > clientHeight ) {
                // landscape (like in the 80's!)
                tilesInHeight = WorldCache.tileHeight * MIN_AMOUNT_OF_TILES;
                tilesInWidth  = Math.round(( clientWidth / clientHeight ) * tilesInHeight );
            } else {
                // portrait (ah, a modern phone...)
                tilesInWidth  = WorldCache.tileWidth * MIN_AMOUNT_OF_TILES;
                tilesInHeight = Math.round(( clientHeight / clientWidth ) * tilesInWidth );
            }
            zcanvas.setDimensions( tilesInWidth, tilesInHeight );
            zcanvas.scale( clientWidth / tilesInWidth, clientHeight / tilesInHeight );
            renderer?.setTileDimensions( tilesInWidth, tilesInHeight );
        },
        async handleEnvironment() {
            renderer?.dispose();
            const environment = this.activeEnvironment;

            if ( !environment ) return;
            let sprite;

            switch ( environment.type ) {
                default:
                    throw new Error(`No renderer for type '${environment.type}'`);
                    break;
                case BUILDING_TYPE:
                    renderer = new BuildingRenderer( this.$store, 100, 100 );
                    sprite = SpriteCache.ENV_BUILDING;
                    break;
                case WORLD_TYPE:
                    renderer = new OvergroundRenderer( this.$store, 100, 100 );
                    sprite = SpriteCache.ENV_WORLD;
                    break;
            }
            await loader.onReady( sprite );

            zcanvas.addChild( renderer );
            renderer.render( environment, this.player );
            this.handleResize( null ); // size to match device / browser dimensions
        },
    }
};
</script>

<style scoped>
.world-canvas {
    cursor: none;
}
</style>
