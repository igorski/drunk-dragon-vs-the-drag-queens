export const GAME_START_TIME = '1986-08-29T20:00:00.000Z';
export const GAME_TIME_RATIO = 20; // how much faster the clock ticks in game time vs real time

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
