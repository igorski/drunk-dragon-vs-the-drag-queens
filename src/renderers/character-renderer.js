import { Sprite } from "zcanvas";
import WorldCache from "@/utils/world-cache";

/**
 * A wrapping class for zCanvas.Sprites that render animated
 * graphics using a sprite sheet. To be used with OvergroundRenderer classes.
 */
export default class CharacterRenderer extends Sprite {
    constructor( resourceId, sheetData, optX = 0, optY = 0 ) {
        super({
            resourceId,
            sheetTileWidth  : sheetData.tileWidth,
            sheetTileHeight : sheetData.tileHeight,
            sheet           : sheetData.frames
        });

        /* instance properties */

        this._width  = sheetData.tileWidth;
        this._height = sheetData.tileHeight;

        // cache for last known properties for player sprite animation
        // as these will be synced to the input commands

        this._lastX   = optX;
        this._lastY   = optY;
        this._lastDir = 0;
    }

    render( renderer, characterX, characterY, viewportX, viewportY ) {
        const { tileWidth, tileHeight } = WorldCache;

        const x = ( characterX - viewportX ) * tileWidth;
        const y = ( characterY - viewportY  ) * tileHeight;

        const targetX = x - ( this._width  * 0.5 - tileWidth  * 0.5 );
        const targetY = y - ( this._height * 0.5 - tileHeight * 0.5 );

        // determine whether and in which direction we're moving by taking the
        // world coordinate (represents player position) and compare it with the cached value
        const isMoving = characterX !== this._lastX || characterY !== this._lastY;
        if ( isMoving ) {
            let dir = this._lastDir;
            if ( characterX > this._lastX ) {
                dir = 3; // moving right
            }
            if ( characterX < this._lastX ) {
                dir = 2; // moving left
            }
            if ( characterY > this._lastY ) {
                dir = 1; // moving down
            }
            if ( characterY < this._lastY ) {
                dir = 0; // moving up
            }
            if ( dir !== this._lastDir ) {
                this.switchAnimation( dir );
                this._lastDir = dir;
            } else {
                this.update(); // updates spritesheet
            }
            this._lastX = characterX;
            this._lastY = characterY;
        }
        this.setBounds( targetX, targetY, this._width, this._height );
        this.draw( renderer );
    }
}
