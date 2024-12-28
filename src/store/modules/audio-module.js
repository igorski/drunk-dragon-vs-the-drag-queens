import axios from "axios";
import bowser from "bowser";
import { TRACK_TYPES, OVERGROUND_THEMES, BUILDING_THEMES, BATTLE_THEMES } from "@/definitions/audio-tracks";
import { WORLD_TYPE } from "@/model/factories/world-factory";
import { BUILDING_TYPE } from "@/model/factories/building-factory";
import { randomFromList } from "@/utils/random-util";

const parsedBrowser = bowser.getParser( window.navigator.userAgent );
const isIOS = parsedBrowser?.os?.name === "iOS" || parsedBrowser?.browser?.name === "Safari" // iOS 13 reports as MacOS...

const MUSIC_SOURCE = "local";// "soundcloud";

// automatic audio playback is blocked until a user interaction
const prepare = ({ state, commit }, optCallback ) => {
    const handler = () => {
        document.removeEventListener( "keyup", handler );
        document.removeEventListener( "click", handler );

        commit( "setPrepared", true );

        if ( typeof optCallback === "function" ) optCallback();
    };
    document.addEventListener( "keyup", handler );
    document.addEventListener( "click", handler );
};

function createAudioElement( source, loop = false ) {
    const element = document.createElement( "audio" );
    element.crossOrigin = "anonymous";
    element.setAttribute( "src", source );
    if ( loop ) {
        element.setAttribute( "loop", "loop" );
    }
    return element;
}

export default {
    state: {
        prepared    : false,
        muted       : process.env.NODE_ENV === "development",
        sound       : null, // HTMLAudioElement
        playing     : false,
        lastTrackId : null,
    },
    getters: {
        muted: state => state.muted,
    },
    mutations: {
        setPrepared( state, value ) {
            state.prepared = !!value;
        },
        setMuted( state, value ) {
            state.muted = !!value;
        },
        setPlaying( state, value ) {
            state.playing = !!value;
        },
        setSound( state, sound ) {
            state.sound = sound;
        },
        setLastTrackId( state, trackId ) {
            state.lastTrackId = trackId;
        },
    },
    actions: {
        async playSound({ state, commit, dispatch }, trackTypeIdOrTrackId = null ) {
            if ( state.muted ) {
                return;
            }
            let trackId = state.lastTrackId;
            if ( typeof trackTypeIdOrTrackId === "number" ) {
                let list;
                switch ( trackTypeIdOrTrackId ) {
                    default:
                    case TRACK_TYPES.OVERGROUND:
                        list = OVERGROUND_THEMES;
                        break;
                    case TRACK_TYPES.BUILDING:
                        list = BUILDING_THEMES;
                        break;
                    case TRACK_TYPES.BATTLE:
                        list = BATTLE_THEMES;
                        break;
                }
                trackId = randomFromList( list );
            } else if ( typeof trackTypeIdOrTrackId === "string" ) {
                trackId = trackTypeIdOrTrackId;
            }

            let sourcePath = "";
            if ( MUSIC_SOURCE === "soundcloud" ) {
                // a valid SoundCloud access token should be managed by the containing page.
                // see https://developers.soundcloud.com/docs/api/explorer/open-api on how
                // to register an application and retrieve a valid token
                const token = window.soundCloudAccessToken || localStorage?.getItem( "soundCloudAccessToken" );
                if ( !token ) {
                    return;
                }
                const requestData = {
                    headers: {
                        "Content-Type"  : "application/json; charset=utf-8",
                        "Authorization" : `OAuth ${token}`
                    }
                };
                let { data } = await axios.get( `https://api.soundcloud.com/tracks/${trackId}`, requestData );
                if ( data?.access === "playable" && data.stream_url ) {
                    // data.stream_url should be the way to go but this leads to CORS errors when following
                    // a redirect... for now use the /streams endpoint
                    ({ data } = await axios.get( `https://api.soundcloud.com/tracks/${trackId}/streams`, requestData ));
                    sourcePath = data?.http_mp3_128_url;
                }
            } else {
                sourcePath = `./music/music-${trackId}.mp3`;
            }

            const start = async () => {
                if ( state.lastTrackId === trackId && state.playing ) {
                    return;  // already playing this tune!
                }
                dispatch( "stopSound" ); // stop playing the current track (TODO : fade out?)
                commit( "setLastTrackId", trackId );

                if ( sourcePath ) {
                    const sound = createAudioElement( sourcePath, true );
                    commit( "setSound", sound );
                    sound.play();
                }
                commit( "setPlaying", true );
            };
            
            // on iOS, each subsequent track needs click handler
            if ( !state.prepared || isIOS ) {
                prepare({ state, commit }, start );
            } else {
                start();
            }
        },
        stopSound({ state, commit }) {
            if ( state.sound ) {
                state.sound.pause();
                commit( "setSound", null );
            }
            commit( "setPlaying", false );
        },
        playMusicForEnvironment({ dispatch }, environment ) {
            let trackType;
            switch ( environment.type ) {
                default:
                    case WORLD_TYPE:
                    trackType = TRACK_TYPES.OVERGROUND;
                    break;
                case BUILDING_TYPE:
                    trackType = TRACK_TYPES.BUILDING;
                    break;
            }
            dispatch( "playSound", trackType );
        }
    },
};
