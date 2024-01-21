import { describe, it, expect } from "vitest";
import { GAME_START_TIME_UNIX, VALID_HOURS_INSIDE, VALID_HOURS_OUTSIDE } from "@/definitions/constants";
import {
    timestampToTimeString, isValidHourToBeInside, isValidHourToBeOutside, timestampToFormattedDate
} from "@/utils/time-util";

function addLeadingZero( input ) {
    input = input.toString();

    if ( input.length < 2 ) {
        return `0${input}`;
    }
    return input;
}

describe( "Time utility", () => {
    it( "should be able to format a timestamp to show the time of day String", () => {
        expect( timestampToTimeString( GAME_START_TIME_UNIX )).toEqual( "22:00" );
    });

    it( "should be able to determine whether the current game date is valid to be wandering outside", () => {
        for ( let i = 0; i < 23; ++i ) {
            const date = new Date( `1986-08-29T${addLeadingZero( i )}:00:00.000Z` );
            expect( isValidHourToBeOutside( date )).toBe( VALID_HOURS_OUTSIDE.includes( i ));
        }
    });

    it( "should be able to determine whether the current game date is valid to be inside a building", () => {
        for ( let i = 0; i < 23; ++i ) {
            const date = new Date( `1986-08-29T${addLeadingZero( i )}:00:00.000Z` );
            expect( isValidHourToBeInside( date )).toBe( VALID_HOURS_INSIDE.includes( i ));
        }
    });

    it( "should be able to format a timestamp to a formatted date String, including the year by default", () => {
        expect( timestampToFormattedDate( GAME_START_TIME_UNIX )).toEqual( "Aug 29, 1986" );
    });

    it( "should be able to format a timestamp to a formatted date String, excluding the year by request", () => {
        expect( timestampToFormattedDate( GAME_START_TIME_UNIX, false )).toEqual( "Aug 29" );
    });
});
