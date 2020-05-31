import zCanvas from 'zcanvas';
import { getBaseURL } from '@/config';
import SpriteCache from '@/utils/sprite-cache';

let _queue = [];
let _loadContainer;

export const preloadAssets = () =>
{
    console.log( 'PRELOAD ASSETS' );

    // we create a container (positioned off-screen) to append the images to, this is to
    // overcome mobile browsers not actually loading the Images until they are inside the DOM and
    // no, we cannot add it to a display:none; -container !

    _loadContainer = document.createElement( 'div' );

    const { style } = _loadContainer;
    style.position  = 'absolute';
    style.left      = '-9999px';
    style.top       = '0';

    document.body.appendChild( _loadContainer );

    // all editor assets

    const assetRoot = `${getBaseURL()}assets/sprites`;
    _queue = [
        { src : `${assetRoot}cave.png`,  target : SpriteCache.CAVE },
        { src : `${assetRoot}rock.png`,  target : SpriteCache.ROCK },
        { src : `${assetRoot}sand.png`,  target : SpriteCache.SAND },
        { src : `${assetRoot}grass.png`, target : SpriteCache.GRASS },
        { src : `${assetRoot}tree.png`,  target : SpriteCache.TREE },
        { src : `${assetRoot}water.png`, target : SpriteCache.WATER },
        { src : `${assetRoot}drone.png`, target : SpriteCache.DRONE },
        { src : `${assetRoot}hero.png`,  target : SpriteCache.HERO }
    ];
    return new Promise((resolve, reject) => {
        const processQueue = () => {
            if ( _queue.length === 0 ) {
                // queue complete, remove temporary container and complete excution
                document.body.removeChild( _loadContainer );
                resolve();
            } else {
                const asset = _queue.shift();
                const image = asset.target;

                image.crossOrigin = 'anonymous';
                _loadContainer.appendChild( image );

                zCanvas.loader.loadImage( asset.src, processQueue, image );
            }
        }
        processQueue();
    });
};
