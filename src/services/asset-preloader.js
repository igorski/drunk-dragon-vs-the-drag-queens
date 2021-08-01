import { loader }  from "zcanvas";
import SpriteCache from "@/utils/sprite-cache";

let _queue = [];
let _loadContainer;

export const preloadAssets = () =>
{
    console.log( "PRELOAD ASSETS" );

    // we create a container (positioned off-screen) to append the images to, this is to
    // overcome mobile browsers not actually loading the Images until they are inside the DOM and
    // no, we cannot add it to a display:none; -container !

    _loadContainer = document.createElement( "div" );

    const { style } = _loadContainer;
    style.position  = "absolute";
    style.left      = "-9999px";
    style.top       = "0";

    document.body.appendChild( _loadContainer );

    // all editor assets

    const assetRoot = `./assets/sprites/`;
    _queue = [
        { src: `${assetRoot}building.png`,        target: SpriteCache.BUILDING },
        { src: `${assetRoot}floor.png`,           target: SpriteCache.FLOOR },
        { src: `${assetRoot}grass.png`,           target: SpriteCache.GRASS },
    //    { src: `${assetRoot}road.png`,            target: SpriteCache.ROAD },
        { src: `${assetRoot}rock.png`,            target: SpriteCache.ROCK },
        { src: `${assetRoot}sand.png`,            target: SpriteCache.SAND },
        { src: `${assetRoot}shop.png`,            target: SpriteCache.SHOP },
        { src: `${assetRoot}sidewalk.png`,        target: SpriteCache.GROUND },
        { src: `${assetRoot}tree.png`,            target: SpriteCache.TREE },
        { src: `${assetRoot}water.png`,           target: SpriteCache.WATER },
        { src: `${assetRoot}crosshairs.png`,      target: SpriteCache.CROSSHAIRS },
        { src: `${assetRoot}furniture.png`,       target: SpriteCache.FURNITURE },
        { src: `${assetRoot}sheet_drab.png`,      target: SpriteCache.DRAB },
        { src: `${assetRoot}sheet_queen.png`,     target: SpriteCache.QUEEN },
        { src: `${assetRoot}sheet_dragon.png`,    target: SpriteCache.DRAGON }
    ];
    return new Promise((resolve, reject) => {
        const processQueue = async () => {
            if ( _queue.length === 0 ) {
                // queue complete, remove temporary container and complete excution
                document.body.removeChild( _loadContainer );
                resolve();
            } else {
                const asset = _queue.shift();
                const image = asset.target;

                image.crossOrigin = "anonymous";
                _loadContainer.appendChild( image );

                try {
                    await loader.loadImage( asset.src, image );
                } catch( e ) {
                    console.error( e, asset.src );
                }
                processQueue();
            }
        }
        processQueue();
    });
};
