/* types of Character available in the game */

export const QUEEN  = 1;
export const DRAB   = 2;
export const DRAGON = 3;

/* assets */

export const fileSuffix = idx => {
    const filenum = idx + 1;
    return filenum < 10 ? `0${filenum}` : filenum;
};

/**
* All assets, coordinates and dimensions
* to assemble a queen Character from a Character Object
*/
export const QUEEN_ASSET_PATH = "./assets/characters/queen/";

export const QUEEN_DIMENSIONS = {
    bounds: {
        width: 1280,
        height: 1296
    },
    body: {
        top: 322,
        left: 277,
        width: 817,
        height: 974
    },
    parts: {
        shadows: {
            top: 540,
            left: 0,
            width: 1280,
            height: 756
        },
        mouth: {
            top: 716,
            left: 447,
            width: 181,
            height: 100
        },
        nose: {
            top: 540,
            left: 416,
            width: 235,
            height: 225
        },
        eyes: {
            top: 491,
            left: 409,
            width: 341,
            height: 140
        },
        clothes: {
            top: 610,
            left: 0,
            width: 1280,
            height: 686
        },
        hair: {
            top: 0,
            left: 0,
            width: 1280,
            height: 1084
        },
        jewelry: {
            top: 660,
            left: 321,
            width: 575,
            height: 369
        },
    }
};
