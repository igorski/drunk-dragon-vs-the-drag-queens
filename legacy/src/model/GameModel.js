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

/**
 * GameModel holds the current state of the Player
 *
 * @constructor
 * @extends {Model}
 */
function GameModel()
{
    Inheritance.super( this, GameModel.NAME );

    this.world = new World();
}

Inheritance.extend( GameModel, Model );

/* class constants */

/** @public @const @type {string} */ GameModel.NAME = "GameModel";

/* class properties */

/** @public @type {string} */     GameModel.prototype.hash;
/** @public @type {World} */      GameModel.prototype.world;
/** @public @type {Cave} */       GameModel.prototype.cave;       // if the player is inside a Cave, this is it
/** @public @type {number} */     GameModel.prototype.created;
/** @public @type {number} */     GameModel.prototype.modified;
/** @public @type {number} */     GameModel.prototype.totalTime;      // total playing time in milliseconds
/** @public @type {number} */     GameModel.prototype.sessionStart;   // timestamp of the current session start
/** @public @type {number} */     GameModel.prototype.lastSavedTime;  // the last time the game was saved this session
/** @public @type {boolean} */    GameModel.prototype.autoSave = false;
/** @protected @type {boolean} */ GameModel.prototype._aiActive;
/** @protected @type {number} */  GameModel.prototype._aiTimer;
/** @protected @type {number} */  GameModel.prototype._saveTimer;
/** @protected @type {boolean} */ GameModel.prototype._state;

/* public methods */

/**
 * enable / disable auto saving
 *
 * @public
 *
 * @param {boolean} aValue
 */
GameModel.prototype.setAutoSave = function( aValue )
{
    clearInterval( this._saveTimer );

    this.autoSave = aValue;

    if ( aValue )
    {
        this._saveTimer = setInterval( function()
        {
            this.broadcast( Notifications.Storage.SAVE_GAME );

        }.bind( this ), 3 * 60 * 1000 );
    }
};

/**
 * invoke to request a newly rendered World
 *
 * @public
 */
GameModel.prototype.invalidateWorld = function()
{
    console.log( "GameModel::invalidateWorld" );

    // pre-render the worlds terrain
    this.broadcast( Notifications.UI.RENDER_WORLD );
};

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

/**
 * @public
 *
 * @return {boolean}
 */
GameModel.prototype.getGameState = function()
{
    return this._state;
};

/**
 * toggle the current game state, if not active, game is over.
 *
 * @public
 *
 * @param {boolean} aIsActive
 */
GameModel.prototype.setGameState = function( aIsActive )
{
    this._state = aIsActive;

    if ( !aIsActive )
        this.setEnemyAI( false );
};

/**
 * enter given Cave
 *
 * @public
 *
 * @param {Cave} aCave
 * @param {Player} aPlayer
 */
GameModel.prototype.enterCave = function( aCave, aPlayer )
{
    // generate levels, terrains and enemies inside the cave
    CaveFactory.generate( this.hash, aCave, aPlayer );

    this.cave = aCave;

    // we're entering a new cave, clear existing opponents from the cache
    WorldCache.clearPositionsOfType( Opponent );

    this.broadcast( Notifications.Game.ENTER_CAVE );
};

/**
 * descend deeper / leave cave when a tunnel has been reached
 *
 * @public
 *
 * @param {Cave} aCave
 * @param {Player} aPlayer
 */
GameModel.prototype.enterCaveTunnel = function( aCave, aPlayer )
{
    var maxLevels = this.cave.levels.length;

    if ( this.cave.level === ( maxLevels - 1 ))
    {
        // was final tunnel, go back up to overground
        this.broadcast( Notifications.Game.ENTER_OVERGROUND );
    }
    else {
        // descend to next level
        this.broadcast( Notifications.Game.ENTER_CAVE_LEVEL, this.cave.level + 1 );
    }
};
