/**
 * The SpriteCache maintains all Bitmap images that are used when rendering the game.
 * Each Bitmap corresponds with a game actor (see @/model/factories/...)
 */
import CharacterRenderer from "@/renderers/character-renderer";
import { QUEEN, DRAB, DRAGON } from "@/definitions/character-types";

const SpriteCache =
{
    // these will contain a cached version of the world / buildings pre-rendered with their terrain

    ENV_WORLD      : new Image(),
    ENV_BUILDING   : new Image(),

    // cached version of all sprite sheets

    BUILDING   : new Image(),
    GROUND     : new Image(),
    GRASS      : new Image(),
    ROAD       : new Image(),
    ROCK       : new Image(),
    SAND       : new Image(),
    SHOP       : new Image(),
    WATER      : new Image(),
    TREE       : new Image(),
    FLOOR      : new Image(),
    CROSSHAIRS : new Image(),

    QUEEN      : new Image(),
    DRAB       : new Image(),
    DRAGON     : new Image()
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

/* render utilities */

// TODO: this needs cleanup when character is disposed
const sprites = new Map();

/**
 * Retrieve the Sprite (renderer) for given Character instance.
 * This lazily creates a renderer on first use.
 *
 */
export function getSpriteForCharacter( parentSprite, character ) {
    const { id } = character;
    if ( !sprites.has( id )) {
        let bitmap, sheet;
        switch ( character.type ) {
            default:
                if ( process.env.NODE_ENV === "development" ) {
                    throw new Error( `Could not get Sprite for ${character.type}` );
                }
                return null;
            case DRAB:
                bitmap = SpriteCache.DRAB;
                sheet  = DRAB_SHEET;
                break;
            case DRAGON:
                bitmap = SpriteCache.DRAGON;
                sheet  = DRAGON_SHEET;
                break;
        }
        const sprite = new CharacterRenderer( bitmap, sheet );
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
