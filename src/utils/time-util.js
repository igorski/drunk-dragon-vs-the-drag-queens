export const GAME_START_TIME = '1986-08-29T20:00:00.000Z';
export const GAME_TIME_RATIO = 20; // how much faster the clock ticks in game time vs real time
export const VALIDITY_CHECK_INTERVAL = 10000 * GAME_TIME_RATIO;

// the time of day the player is allowed to roam in- or outside
const VALID_HOURS_OUTSIDE = [ 22, 23, 0, 1, 2, 3, 4, 5 ];
const VALID_HOURS_INSIDE  = [ 22, 23, 0, 1, 2, 3, 4 ];

export const dateToTimeString = date => {
    // hours part from the timestamp
    const hours = date.getHours();

    // minutes part from the timestamp
    const minutes = addZero( date.getMinutes() );

    // seconds part from the timestamp
    //const seconds = addZero( date.getSeconds() );

    // will display time in 10:30:23 format
    return `${hours}:${minutes.substr( minutes.length - 2 )}`;//:${seconds.substr( seconds.length - 2 )}`;
};

export const timestampToTimeString = timestamp => dateToTimeString( new Date( timestamp ));

export const isValidHourToBeOutside = gameDate => VALID_HOURS_OUTSIDE.includes( gameDate.getHours() );
export const isValidHourToBeInside = gameDate => VALID_HOURS_INSIDE.includes( gameDate.getHours() );

export const timestampToFormattedDate = timestamp => {
    const dateTimeFormat = new Intl.DateTimeFormat( 'en', { year: 'numeric', month: 'short', day: '2-digit' });
    const [{ value: month },,{ value: day },,{ value: year }] = dateTimeFormat.formatToParts( new Date( timestamp ));
    return `${month} ${day}, ${year}`;
};

/* internal methods */

function addZero( input ) {
    input = input.toString();

    if ( input.length < 2 )
        return `0${input}`;

    return input;
}
