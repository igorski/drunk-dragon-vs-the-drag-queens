import { zThread, zThreader } from 'zthreader';
import { createPixelCanvas }  from '@/utils/canvas-util';
import ImageUtil              from '@/utils/image-util';
import SpriteCache            from '@/utils/sprite-cache';
import WorldCache             from '@/utils/world-cache';
import TerrainRenderer        from '@/renderers/terrain-renderer';

export const renderEnvironment = environment =>
{
    console.log( 'RENDER ENVIRONMENT' );
// TODO: this is Overground only as of now, not Cave
    const { width, height, terrain } = environment;

    return new Promise(( resolve, reject ) => {

        const { tileWidth, tileHeight } = WorldCache;

        const { cvs, ctx } = createPixelCanvas();

        cvs.width  = tileWidth  * width;
        cvs.height = tileHeight * height;

        // we render the above coordinates, with addition of one extra
        // tile outside of the tiles (prevents blank screen during movement)

        let rl = 0, rr = width;
        let rt = 0, rb = height;

        let i, j, l, x, y, terrainTile;

        // use zThreader and zThreads as this can be quite a heavy operation
        // investigate how we can have a canvas and images available in a Worker

        zThreader.init( .65, 60 );

        const thread = new zThread(() => {
            // store the result
            // TODO : investigate https://github.com/imaya/CanvasTool.PngEncoder for 8-bit PNG ?

            SpriteCache.WORLD.src    = cvs.toDataURL( 'image/png' );
            SpriteCache.WORLD.width  = cvs.width;
            SpriteCache.WORLD.height = cvs.height;

            ImageUtil.onReady( SpriteCache.WORLD, () => {
                resolve( SpriteCache.WORLD );
            });
        });

        // function to render the sprites onto the Canvas

        function render( aIteration ) {
            // rows first
            for ( i = aIteration, l = aIteration + 1; i < l; ++i )    // a row
            {
                for ( j = rl; j < rr; ++j ) // all columns within a row
                {
                    x = j * tileWidth;
                    y = i * tileHeight;

                    TerrainRenderer.drawTileForSurroundings( ctx, j, i, x, y, environment, terrain );
                }
            }
        }

        // TODO : separate into individual tiles for mobile !!

        // here we define our own custom override of the ZThread internal execution handler to
        // render all columns of a single row, one by ony

        const MAX_ITERATIONS = rb;    // all rows
        let iterations       = rt - 1;

        thread._executeInternal = () => {
            // the amount of times we call the 'render'-function
            // per iteration of the internal execution method
            const stepsPerIteration = 1;

            for ( let i = 0; i < stepsPerIteration; ++i ) {
                if ( iterations >= MAX_ITERATIONS ) {
                    return true;
                }
                else {
                    // execute operation (and increment iteration)
                    render( ++iterations );
                }
            }
            return false;
        };
        thread.run(); // start crunching
    });
};
