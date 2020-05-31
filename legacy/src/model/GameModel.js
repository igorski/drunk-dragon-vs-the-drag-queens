/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = GameModel;

var Inheritance   = require( "zjslib" ).Inheritance;
var Model         = require( "zmvc" ).Model;
var World         = require( "../model/vo/World" );
var Notifications = require( "../definitions/Notifications" );
var CaveFactory   = require( "./factories/CaveFactory" );
var Opponent      = require( "./vo/Opponent" );
var WorldCache    = require( "../utils/WorldCache" );

/* class constants */

/** @public @const @type {string} */ GameModel.NAME = "GameModel";



/**
 * enable / disable the AI controlling the enemies
 * outside of battle mode
 *
 * @public
 *
 * @param {boolean} aValue
 */
GameModel.prototype.setEnemyAI = function( aValue )
{
    this._aiActive = typeof aValue === "boolean" ? aValue : false;

    clearInterval( this._aiTimer );

    if ( this._aiActive )
    {
        this._aiTimer = setInterval( function()
        {
            this.broadcast( Notifications.Game.UPDATE_ENEMIES );

        }.bind( this ), 1000 );
    }
};

/**
 * @public
 * @return {boolean}
 */
GameModel.prototype.getEnemyAI = function()
{
    return this._aiActive;
};
