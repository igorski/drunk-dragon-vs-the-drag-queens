export const GAME_START_TIME = '1986-08-29T23:00:00.000Z';
export const GAME_TIME_RATIO = 8; // the amount of real time vs game time

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

/* internal methods */

function addZero( input ) {
    input = input.toString();

    if ( input.length < 2 )
        return `0${input}`;

    return input;
}
