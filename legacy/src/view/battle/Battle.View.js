/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = BattleView;

var Inheritance = require( "zjslib" ).Inheritance;
var Sprite      = require( "zjslib" ).Sprite;
var View        = require( "zmvc" ).View;

/**
 * @constructor
 * @extends {View}
 */
function BattleView()
{
    Inheritance.super( this, "div" );
    this.setAttribute( "id", "battle" );
}

View.extend( BattleView, View );

/* class constants */

/** @public @const @type {string} */ BattleView.NAME     = "BattleView";

/** @public @const @type {string} */ BattleView.ATTACK   = "UI::A";
/** @public @const @type {string} */ BattleView.DEFEND   = "UI::D";
/** @public @const @type {string} */ BattleView.USE_ITEM = "UI::I";
/** @public @const @type {string} */ BattleView.RUN      = "UI::R";

/* class properties */

/** @public @type {Sprite} */    BattleView.prototype.controls;
/** @protected @type {Sprite} */ BattleView.prototype._attack;
/** @protected @type {Sprite} */ BattleView.prototype._defend;
/** @protected @type {Sprite} */ BattleView.prototype._item;
/** @protected @type {Sprite} */ BattleView.prototype._run;
/** @protected @type {Sprite} */ BattleView.prototype._enemy;

/* public methods */

/**
 * @public
 *
 * @param {Opponent} aOpponent
 * @param {Player} aPlayer
 */
BattleView.prototype.updateBattle = function( aOpponent, aPlayer )
{
    this._enemy.setContent( "ENEMY HP: " + aOpponent.HP );

    // only items we support for now is medicine

    if ( aPlayer.inventory.hasItems() &&
         aPlayer.inventory.getMedicine().length > 0 )
    {
        this._item.show();
    }
    else {
        this._item.hide()
    }
};

/* protected methods */

/**
 * @override
 * @protected
 */
BattleView.prototype.init = function()
{
    if ( this.initialized )
        return;

    Inheritance.super( this, "init" );

    this._enemy = new Sprite( "div", { "class" : "enemy" });
    this.addChild( this._enemy );

    this.controls = new Sprite( "ul", { "class" : "controls" });
    this.addChild( this.controls );

    this._attack = new Sprite( "li", { "class" : "attack" }, "ATTK" );
    this._attack.addEventListener( "click", function( e )
    {
        this.dispatchEvent( new Event( BattleView.ATTACK ));

    }.bind( this ));
    this.controls.addChild( this._attack );

    this._defend = new Sprite( "li", { "class" : "attack" }, "DFND" );
    this._defend.addEventListener( "click", function( e )
    {
        this.dispatchEvent( new Event( BattleView.DEFEND ));

    }.bind( this ));
    this.controls.addChild( this._defend );

    this._item = new Sprite( "li", { "class" : "item" }, "ITEM" );
    this._item.addEventListener( "click", function( e )
    {
        this.dispatchEvent( new Event( BattleView.USE_ITEM ));

    }.bind( this ));
    this.controls.addChild( this._item );

    this._run = new Sprite( "li", { "class" : "attack" }, "RUN" );
    this._run.addEventListener( "click", function( e )
    {
        this.dispatchEvent( new Event( BattleView.RUN ));

    }.bind( this ));
    this.controls.addChild( this._run );
};
