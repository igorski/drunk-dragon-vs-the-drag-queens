var Inheritance   = require( "zjslib" ).Inheritance;
var Sprite        = require( "zjslib" ).Sprite;
var Controller    = require( "zmvc" ).Controller;
var MVC           = require( "zmvc" ).MVC;
var BattleModel   = require( "../../model/BattleModel" );
var PlayerModel   = require( "../../model/PlayerModel" );
var Notifications = require( "../../definitions/Notifications" );
var AttackTypes   = require( "../../definitions/AttackTypes" );
var BattleView    = require( "./Battle.View" );

module.exports = BattleController;

/**
 * @constructor
 */
function BattleController()
{

}

Controller.extend( BattleController, Controller );

/* class properties */

/** @protected @type {BattleModel} */ BattleController.prototype._battleModel;
/** @protected @type {PlayerModel} */ BattleController.prototype._playerModel;

/* public methods */

/**
 * @override
 * @public
 */
BattleController.prototype.subscribe = function()
{
    return [

        Notifications.Battle.ATTACK_OPPONENT_SUCCESS,
        Notifications.Battle.ATTACK_OPPONENT_FAILURE,
        Notifications.Battle.OPPONENT_ATTACK_SUCCESS,
        Notifications.Battle.OPPONENT_ATTACK_FAILURE,
        Notifications.Battle.CONTINUE_BATTLE,
        Notifications.UI.SHOW_BATTLE_UI,
        Notifications.UI.HIDE_BATTLE_UI
        
    ].concat( Inheritance.super( this, "subscribe" ));
};

/**
 * @override
 * @public
 */
BattleController.prototype.init = function()
{
    Inheritance.super( this, "init" );

    this._battleModel = MVC.getModel( BattleModel.NAME );
    this._playerModel = MVC.getModel( PlayerModel.NAME );

    this.addListeners();
    this.updateBattle( true );
};

/**
 * invoked when the pubsub system has broadcast a
 * message that this Controller is interested in
 *
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
BattleController.prototype.onMessage = function( aMessageType, aMessageData )
{
    switch ( aMessageType )
    {
        case Notifications.Battle.ATTACK_OPPONENT_SUCCESS:
        case Notifications.Battle.ATTACK_OPPONENT_FAILURE:
        case Notifications.Battle.OPPONENT_ATTACK_SUCCESS:
        case Notifications.Battle.OPPONENT_ATTACK_FAILURE:
        case Notifications.Battle.CONTINUE_BATTLE:
            this.updateBattle();
            this.nextBattleAction();
            break;

        case Notifications.UI.SHOW_BATTLE_UI:
            this.view.controls.show();
            break;

        case Notifications.UI.HIDE_BATTLE_UI:
            this.view.controls.hide();
            break;
    }
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
BattleController.prototype.doAttack = function( aEvent )
{
    var player     = this._playerModel.getPlayer();
    var attackType = AttackTypes.PUNCH;
    var weapons    = player.inventory.getWeapons();

    if ( weapons.length > 0 )
        attackType = weapons[ 0 ].value;

    this.broadcast( Notifications.Battle.ATTACK_OPPONENT,
                           player.attack( attackType ) );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
BattleController.prototype.doDefend = function( aEvent )
{
    this.broadcast( Notifications.Battle.DEFEND );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
BattleController.prototype.doItem = function( aEvent )
{
    this.broadcast( Notifications.Battle.USE_ITEM );
};

/**
 * @protected
 *
 * @param {Event} aEvent
 */
BattleController.prototype.doRun = function( aEvent )
{
    this.broadcast( Notifications.Battle.RUN );
};

/* protected methods */

/**
 * @protected
 */
BattleController.prototype.addListeners = function()
{
    this.view.addEventListener( BattleView.ATTACK,   this.doAttack.bind( this ));
    this.view.addEventListener( BattleView.DEFEND,   this.doDefend.bind( this ));
    this.view.addEventListener( BattleView.USE_ITEM, this.doItem.bind  ( this ));
    this.view.addEventListener( BattleView.RUN,      this.doRun.bind   ( this ));
};

/**
 * @protected
 */
BattleController.prototype.updateBattle = function()
{
    this.view.updateBattle( this._battleModel.getOpponent(),
                            this._playerModel.getPlayer() );
};

/**
 * handle the next battle action (e.g. toggle players
 * attack UI on/off, invoke Opponents attack strategy)
 *
 * @protected
 */
BattleController.prototype.nextBattleAction = function()
{
    // TODO : this is just temporary
    // put this logic inside a command ??

    var player   = this._playerModel.getPlayer();
    var opponent = this._battleModel.getOpponent();

    if ( !opponent.isAlive() || !player.isAlive() ) {
        this.broadcast( Notifications.Battle.BATTLE_END );
    }
    else
    {
        if ( this._battleModel.isPlayerTurn )
        {
            this.broadcast( Notifications.UI.SHOW_BATTLE_UI );
        }
        else {

            this.broadcast( Notifications.UI.HIDE_BATTLE_UI );

            setTimeout( function()
            {

                this.broadcast( Notifications.Battle.OPPONENT_ATTACKS,
                                       opponent.attack() );

            }.bind( this ), 1500 );
        }
    }
};
