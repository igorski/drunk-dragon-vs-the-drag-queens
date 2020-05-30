/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = BattleModel;

var Inheritance   = require( "zjslib" ).Inheritance;
var Model         = require( "zmvc" ).Model;
var Opponent      = require( "../model/vo/Opponent" );
var Notifications = require( "../definitions/Notifications" );

/**
 * BattleModel holds the current battle data
 *
 * @constructor
 */
function BattleModel()
{
    Inheritance.super( this, BattleModel.NAME );
}

Inheritance.extend( BattleModel, Model );

/* class constants */

/** @public @const @type {string} */ BattleModel.NAME = "BattleModel";

/* class properties */

/** @public @type {string} */      BattleModel.prototype.inBattle     = false;
/** @public @type {string} */      BattleModel.prototype.isPlayerTurn = false;
/** @protected @type {Opponent} */ BattleModel.prototype._opponent;

/* public methods */

/**
 * @public
 *
 * @param {Opponent|null} aOpponent
 */
BattleModel.prototype.setOpponent = function( aOpponent )
{
    this._opponent = aOpponent;

    if ( this._opponent instanceof Opponent ) {
        this.broadcast( Notifications.Battle.BATTLE_START );
    }
};

/**
 * @public
 *
 * @return {Opponent}
 */
BattleModel.prototype.getOpponent = function()
{
    return this._opponent;
};

/**
 * after a battle has completed this method can be
 * invoked to reset the application status
 *
 * @public
 */
BattleModel.prototype.resetBattleState = function()
{
    this.inBattle     = false;
    this.isPlayerTurn = true;

    this.setOpponent( null );
};
