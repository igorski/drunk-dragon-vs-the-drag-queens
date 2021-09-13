/* game time */

// the time of day the player is allowed to roam in- or outside
export const VALID_HOURS_OUTSIDE = [ 22, 23, 0, 1, 2, 3, 4, 5 ];
export const VALID_HOURS_INSIDE  = [ 22, 23, 0, 1, 2, 3, 4 ];

export const GAME_START_HOUR         = VALID_HOURS_OUTSIDE[ 0 ];
export const GAME_START_TIME         = `1986-08-29T${GAME_START_HOUR}:00:00.000Z`;
export const GAME_START_TIME_UNIX    = new Date( GAME_START_TIME ).getTime();
export const GAME_TIME_RATIO         = 20; // how much faster the clock ticks in game time vs real time
export const VALIDITY_CHECK_INTERVAL = 10000 * GAME_TIME_RATIO;
export const HOUR                    = 1000 * 60 * 60; // milliseconds
export const HALF_HOUR               = HOUR / 2;
export const TWENTY_FOUR_HOURS       = HOUR * 24;
export const MS_IN_AN_HOUR           = 3600000;
export const MS_IN_A_DAY             = MS_IN_AN_HOUR * 24;

/* levelling mechanism */

export const XP_PER_LEVEL = 10; // amount of XP needed to level up. Multiply by current level for each subsequent level up.

// the amount of XP needed to reach given level
export const xpNeededForLevel = level => XP_PER_LEVEL + (( XP_PER_LEVEL * level ) * ( level - 1 ));
