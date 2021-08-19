import { VALID_HOURS_INSIDE, VALID_HOURS_OUTSIDE } from "@/definitions/constants";

export const timestampToTimeString  = timestamp => dateToTimeString( new Date( timestamp ));
export const isValidHourToBeOutside = gameDate => VALID_HOURS_OUTSIDE.includes( gameDate.getUTCHours() );
export const isValidHourToBeInside  = gameDate => VALID_HOURS_INSIDE.includes( gameDate.getUTCHours() );

export const timestampToFormattedDate = ( timestamp, includeYear = true ) => {
    const dateTimeFormat = new Intl.DateTimeFormat( "en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "UTC"
    });
    const [{ value: month },,{ value: day },,{ value: year }] = dateTimeFormat.formatToParts( new Date( timestamp ));
    const formattedDate = `${month} ${day}`;
    return includeYear ? `${formattedDate}, ${year}` : formattedDate;
};

/* internal methods */

function dateToTimeString( date ) {
    // hours part from the timestamp
    const hours = date.getUTCHours();

    // minutes part from the timestamp
    const minutes = addLeadingZero( date.getUTCMinutes() );

    // seconds part from the timestamp
    //const seconds = addLeadingZero( date.getSeconds() );

    // will display time in 10:30:23 format
    return `${hours}:${minutes.substr( minutes.length - 2 )}`;//:${seconds.substr( seconds.length - 2 )}`;
}

function addLeadingZero( input ) {
    input = input.toString();

    if ( input.length < 2 ) {
        return `0${input}`;
    }
    return input;
}
