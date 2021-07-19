/* game time */

export const GAME_START_TIME         = "1986-08-29T22:00:00.000Z";
export const GAME_START_TIME_UNIX    = new Date( GAME_START_TIME ).getTime();
export const GAME_TIME_RATIO         = 20; // how much faster the clock ticks in game time vs real time
export const VALIDITY_CHECK_INTERVAL = 10000 * GAME_TIME_RATIO;

// the time of day the player is allowed to roam in- or outside
export const VALID_HOURS_OUTSIDE = [ 22, 23, 0, 1, 2, 3, 4, 5 ];
export const VALID_HOURS_INSIDE  = [ 22, 23, 0, 1, 2, 3, 4 ];

/* levelling mechanism */

export const XP_PER_LEVEL = 10; // amount of XP needed to level up. Multiply by current level for each subsequent level up.
