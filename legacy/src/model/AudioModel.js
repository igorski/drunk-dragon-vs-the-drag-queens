/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = AudioModel;

var Inheritance = require( "zjslib" ).Inheritance;
var Model       = require( "zmvc" ).Model;
var Player      = require( "./vo/Player" );
var AudioTracks = require( "../definitions/AudioTracks" );

/**
 * AudioModel allows us to player sounds
 *
 * @constructor
 * @extends {Model}
 */
function AudioModel()
{
    Inheritance.super( this, AudioModel.NAME );
}

Inheritance.extend( AudioModel, Model );

/* class constants */

/** @public @const @type {string} */ AudioModel.NAME = "AudioModel";

/* class properties */

/** @public @type {boolean} */   AudioModel.prototype.playing = false;
/** @public @type {boolean} */   AudioModel.prototype.muted   = window.location.href.indexOf( "localhost" ) !== -1;
/** @public @type {boolean} */   AudioModel.prototype.inited  = false;
/** @protected @type {Object} */ AudioModel.prototype._sound;       // currently playing sound
/** @protected @type {string} */ AudioModel.prototype._lastTrackId; // last played track Id

/* public methods */

/**
 * @public
 */
AudioModel.prototype.init = function(optCallback)
{
    var handler = function() {
        document.removeEventListener("keyup", handler);
        document.removeEventListener("click", handler);
        SC.initialize({
            client_id: "0028757d978a9473e5310125967e7e47"
            //    redirect_uri: "https://developers.soundcloud.com/callback.html"
        });
        this.inited = true;

        if (typeof optCallback === 'function') {
            optCallback();
        }
    }.bind(this);
    document.addEventListener("keyup", handler);
    document.addEventListener("click", handler);
};

/**
 * play a track by its unique identifier
 * (you can retrieve the identifier by clicking "Share" on the track page,
 * selecting "Embed" and retrieving the numerical value from the URL)
 *
 * @public
 *
 * @param {string} aTrackId
 */
AudioModel.prototype.playTrack = function( aTrackId )
{
    if ( this.muted ) {
        return;
    }

    var start = function() {
        if ( this._lastTrackId === aTrackId ) return;   // already playing this tune!

        this.stop();    // stop playing the current track (TODO : fade out?)

        this._lastTrackId = aTrackId;

        // Background Sounds - Rain
        SC.stream( "/tracks/" + aTrackId, function( sound )
        {
            this._sound = sound;
            sound.play();

        }.bind( this ));

        this.playing = true;
    }.bind(this);

    if ( !this.inited ) {
        this.init(start);
    } else {
        start();
    }
};

/**
 * continue playing the last track id
 *
 * @public
 */
AudioModel.prototype.play = function()
{
    if ( !this.muted && !this.playing ) {
        this.playTrack( this._lastTrackId );
    }
};

/**
 * stops playing all tracks
 *
 * @public
 */
AudioModel.prototype.stop = function()
{
    if ( this._sound ) {
        this._sound.stop();
        this._sound = null;
    }
    this.playing = false;
};
