import scriptLoader from 'promised-script-loader';

const SOUNDCLOUD_SDK = 'https://connect.soundcloud.com/sdk.js';
const SC_API_ID      = '0028757d978a9473e5310125967e7e47'; // roll your own!

// automatic audio playback is blocked until a user interaction

const prepare = ({ state, commit }, optCallback ) => {
    if ( !state.sdkReady ) {
        throw new Error('Soundcloud SDK not yet loaded');
    }
    const handler = () => {
        document.removeEventListener( 'keyup', handler );
        document.removeEventListener( 'click', handler );
        SC.initialize({ client_id: SC_API_ID });

        commit( 'setPrepared', true );

        if ( typeof optCallback === 'function' ) optCallback();
    };
    document.addEventListener( 'keyup', handler );
    document.addEventListener( 'click', handler );
};

export default {
    state: {
        sdkReady: false,
        prepared: false,
        muted: window.location.href.includes( 'localhost' ),
        playing: false,
        lastTrackId: null,
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
                commit( 'setSDKReady', true );
                prepare({ state, commit });
            } catch {
                // non critical, continue.
            }
        },
        playSound({ state, commit, dispatch }, trackId = null ) {
            if ( state.muted || state.playing ) {
                return;
            }
            if ( !trackId ) {
                trackId = state.lastTrackId;
            }
            const start = () => {
                if ( state.lastTrackId === trackId ) {
                    return;  // already playing this tune!
                }
                dispatch( 'stopSound' ); // stop playing the current track (TODO : fade out?)
                commit( 'setLastTrackId', trackId );

                SC.stream( `/tracks/${trackId}`, sound => {
                    commit( 'setSound', sound );
                    sound.play();
                });
                commit( 'setPlaying', true );
            };

            if ( !state.prepared ) {
                prepare({ state, commit }, start );
            } else {
                start();
            }
        },
        stopSound({ state, commit }) {
            if ( state.sound ) {
                state.sound.stop();
                commit( 'setSound', null );
            }
            commit( 'setPlaying', false );
        }
    },
};
