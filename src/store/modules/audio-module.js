import bowser from "bowser";
import scriptLoader from "promised-script-loader";
import { TRACK_TYPES, OVERGROUND_THEMES, BUILDING_THEMES, BATTLE_THEMES } from "@/definitions/audio-tracks";
import { WORLD_TYPE } from "@/model/factories/world-factory";
import { BUILDING_TYPE } from "@/model/factories/building-factory";
import { randomFromList } from "@/utils/random-util";

const SOUNDCLOUD_SDK = "https://connect.soundcloud.com/sdk.js";
// request your own at https://soundcloud.com/you/apps
const SC_API_ID = "" || localStorage?.getItem( "soundCloudApiKey" );

const parsedBrowser = bowser.getParser( window.navigator.userAgent );
const isIOS = parsedBrowser?.os?.name === "iOS" || parsedBrowser?.browser?.name === "Safari" // iOS 13 reports as MacOS...

// automatic audio playback is blocked until a user interaction
const prepare = ({ state, commit }, optCallback ) => {
    if ( !state.sdkReady ) {
        throw new Error( "Soundcloud SDK not yet loaded" );
    }
    const handler = () => {
        document.removeEventListener( "keyup", handler );
        document.removeEventListener( "click", handler );
        SC.initialize({ client_id: SC_API_ID || window.soundCloudApiKey });

        commit( "setPrepared", true );

        if ( typeof optCallback === "function" ) optCallback();
    };
    document.addEventListener( "keyup", handler );
    document.addEventListener( "click", handler );
};

export default {
    state: {
        sdkReady    : false,
        prepared    : false,
        muted       : false,//process.env.NODE_ENV === "development",
        playing     : false,
        lastTrackId : null,
    },
    getters: {
        muted: state => state.muted,
    },
    mutations: {
        setSDKReady( state, value ) {
            state.sdkReady = !!value;
        },
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
        async prepareAudio({ state, commit }) {
            try {
                await scriptLoader([ SOUNDCLOUD_SDK ]);
                commit( "setSDKReady", true );
                prepare({ state, commit });
            } catch {
                // non critical, continue.
            }
        },
        playSound({ state, commit, dispatch }, trackTypeIdOrTrackId = null ) {
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
            const start = () => {
                if ( state.lastTrackId === trackId && state.playing ) {
                    return;  // already playing this tune!
                }
                dispatch( "stopSound" ); // stop playing the current track (TODO : fade out?)
                commit( "setLastTrackId", trackId );

                SC.stream( `/tracks/${trackId}`, sound => {
                    commit( "setSound", sound );
                    sound.play({ onfinish: () => {
                        console.warn( `Finished playing "${trackId}", repeating from pool.` );
                        commit( "setPlaying", false );
                        dispatch( "playSound", trackTypeIdOrTrackId );
                    }});
                });
                commit( "setPlaying", true );
            };
            console.warn( "is IOS > " + isIOS);
            // on iOS, each subsequent track needs click handler
            if ( !state.prepared || isIOS ) {
                prepare({ state, commit }, start );
            } else {
                start();
            }
        },
        stopSound({ state, commit }) {
            if ( state.sound ) {
                state.sound.stop();
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
