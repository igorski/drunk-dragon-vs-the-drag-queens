export default
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

    PLAYER     : new Image()
};

// sprite sheet for the Sprite represented by PLAYER

export const PLAYER_SHEET = [
    { row: 0, col: 0, amount: 4, fpt: 3 }, // walk up
    { row: 1, col: 0, amount: 4, fpt: 3 }, // walk down
    { row: 2, col: 0, amount: 4, fpt: 4 }, // walk left
    { row: 3, col: 0, amount: 4, fpt: 4 }, // walk right
];
