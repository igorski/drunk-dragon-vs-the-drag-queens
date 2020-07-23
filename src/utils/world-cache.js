/**
 * The WorldCache is used to:
 * identify the sizes of Objects when translated from a tile onto a rectangle in pixels.
 */
export default
{
    // the amount of pixels per terrain tile

    tileWidth  : 20,
    tileHeight : 20,

    // Object sizes (in tiles)

    sizeBuilding : { width: 7, height: 6 },
    sizeShop     : { width: 5, height: 3 },
};
