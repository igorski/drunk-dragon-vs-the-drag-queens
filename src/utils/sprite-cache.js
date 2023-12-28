/**
 * The SpriteCache maintains all Bitmap images that are used when rendering the game.
 * Each Bitmap corresponds with a game actor (see @/model/factories/...)
 */
import CharacterRenderer from "@/renderers/character-renderer";
import { QUEEN, DRAB, DRAGON } from "@/definitions/character-types";

const SpriteCache =
{
    // these will contain a cached version of the world / buildings pre-rendered with their terrain
    // bitmap will reference an HTMLImageElement of the loaded content as a data source (see asset-preloader)
    // resourceId is the unique identifier of the asset with which it will be registered inside zCanvas, can
    // be omitted for resources that are not rendered through zCanvas (such as environment assets)
    
    ENV_WORLD       : { resourceId: "e1",  bitmap: null },
    ENV_BUILDING    : { resourceId: "e2",  bitmap: null },

    // cached version of all sprite sheets

    BUILDING        : { resourceId: "s1",  bitmap: null },
    GROUND          : { resourceId: "s2",  bitmap: null },
    GRASS           : { resourceId: "s3",  bitmap: null },
    ROAD            : { resourceId: "s4",  bitmap: null },
    ROCK            : { resourceId: "s5",  bitmap: null },
    SAND            : { resourceId: "s6",  bitmap: null },
    SHOP            : { resourceId: "s7",  bitmap: null },
    WATER           : { resourceId: "s8",  bitmap: null },
    TREE            : { resourceId: "s9",  bitmap: null },
    FLOOR_BAR       : { resourceId: "s10", bitmap: null },
    FLOOR_HOTEL     : { resourceId: "s11", bitmap: null },
    FLOOR_CAVE      : { resourceId: "s12", bitmap: null },
    CROSSHAIRS      : { resourceId: "s13", bitmap: null },
    FURNITURE       : { resourceId: "s14", bitmap: null },
    ITEMS           : { resourceId: "s15", bitmap: null },

    QUEEN           : { resourceId: "c1", bitmap: null },
    DRAB            : { resourceId: "c2", bitmap: null },
    DRAGON          : { resourceId: "c3", bitmap: null }
};
export default SpriteCache;

/* sprite sheets for animated content */

export const QUEEN_SHEET = {
    tileWidth  : 23,
    tileHeight : 23,
    frames: [
        { row: 0, col: 0, amount: 4, fpt: 3 }, // walk up
        { row: 1, col: 0, amount: 4, fpt: 3 }, // walk down
        { row: 2, col: 0, amount: 4, fpt: 4 }, // walk left
        { row: 3, col: 0, amount: 4, fpt: 4 }, // walk right
    ]
};

const DRAB_SHEET = {
    tileWidth  : 16,
    tileHeight : 18,
    frames: [
        { row: 0, col: 0, amount: 3, fpt: 3 }, // walk up
        { row: 1, col: 0, amount: 3, fpt: 3 }, // walk down
        { row: 2, col: 0, amount: 3, fpt: 3 }, // walk left
        { row: 3, col: 0, amount: 3, fpt: 3 }, // walk right
    ]
};

const DRAGON_SHEET = {
    tileWidth : 16,
    tileHeight: 16,
    frames: [
        { row: 0, col: 0, amount: 4, fpt: 3 }, // walk up
        { row: 1, col: 0, amount: 4, fpt: 3 }, // walk down
        { row: 2, col: 0, amount: 4, fpt: 4 }, // walk left
        { row: 3, col: 0, amount: 4, fpt: 4 }, // walk right
    ]
};

export const FURNITURE = {
    bed: { x: 0, y: 0, width: 48, height: 82 }
};

/* render utilities */

// TODO: these need cleanup when character is disposed
const sprites = new Map();

/**
 * Register provided image as a resouce in the zCanvas
 * instance so renderers (Sprites) can render these
 */
export const registerResources = async ( zCanvas ) => {
    for ( const [ key, value ] of Object.entries( SpriteCache )) {
        if ( value.resourceId && value.bitmap ) {
            console.info('loading ' + key,value);
            const size = await zCanvas.loadResource( value.resourceId, value.bitmap );
        } else {
            console.info('ignoring ' + key, value)
        }
    }
};

/**
 * Retrieve the Sprite (renderer) for given Character instance.
 * This lazily creates a renderer on first use.
 */
export function getSpriteForCharacter( zCanvas, parentSprite, character ) {
    const { id } = character;
    if ( !sprites.has( id )) {
        let entry, sheet;
        switch ( character.type ) {
            default:
                if ( process.env.NODE_ENV === "development" ) {
                    throw new Error( `Could not get Sprite for ${character.type}` );
                }
                return null;
            case DRAB:
                entry = SpriteCache.DRAB;
                sheet = DRAB_SHEET;
                break;
            case DRAGON:
                entry = SpriteCache.DRAGON;
                sheet = DRAGON_SHEET;
                break;
            case QUEEN:
                entry = SpriteCache.QUEEN;
                sheet = QUEEN_SHEET;
                break;
        }
        zCanvas.loadResource( entry.resourceId, entry.bitmap );

        const sprite = new CharacterRenderer( entry.resourceId, sheet );
        parentSprite.addChild( sprite );
        sprites.set( id, sprite );

        return sprite;
    }
    return sprites.get( id );
}

export function flushSpriteForCharacter( character ) {
    const { id } = character;
    if ( sprites.has( id )) {
        const sprite = sprites.get( id );
        sprite.dispose();
        return sprites.delete( id );
    }
    return false;
}

export function flushAllSprites() {
    sprites.clear();
}
