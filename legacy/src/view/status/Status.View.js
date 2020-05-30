/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = StatusView;

var Inheritance = require( "zjslib" ).Inheritance;
var Sprite      = require( "zjslib" ).Sprite;
var View        = require( "zmvc" ).View;

/**
 * @constructor
 * @extends {View}
 */
function StatusView()
{
    Inheritance.super( this, "ul" );
    this.setAttribute( "id", "status" );
}

View.extend( StatusView, View );

/* class constants */

/** @public @const @type {string} */ StatusView.NAME = "StatusView";

/* class properties */

/** @protected @type {Sprite} */ StatusView.prototype._level;
/** @protected @type {Sprite} */ StatusView.prototype._hpMeter;
/** @protected @type {Sprite} */ StatusView.prototype._mpMeter;
/** @protected @type {Sprite} */ StatusView.prototype._spMeter;
/** @protected @type {Sprite} */ StatusView.prototype._xpMeter;
/** @protected @type {Sprite} */ StatusView.prototype._moneyMeter;
/** @protected @type {Sprite} */ StatusView.prototype._msgContainer;

/* public methods */

/**
 * @public
 *
 * @param {Object} aPlayer
 */
StatusView.prototype.updateStatus = function( aPlayer )
{
    this._level.setContent     ( "LEVEL: " + aPlayer.level );
    this._hpMeter.setContent   ( "HP: "    + aPlayer.HP + " / " + aPlayer.maxHP );
    this._mpMeter.setContent   ( "MP: "    + aPlayer.MP + " / " + aPlayer.maxMP );
    this._spMeter.setContent   ( "SP: "    + aPlayer.SP + " / " + aPlayer.maxSP );
    this._moneyMeter.setContent( "$: "     + aPlayer.inventory.money );
    this._spMeter.setContent   ( "XP: "    + aPlayer.XP );
};

/**
 * flash a message displaying a particular status update
 *
 * @public
 *
 * @param {string} aMessage
 */
StatusView.prototype.showMessage = function( aMessage )
{
    var theMessage = new Sprite( "li", {}, aMessage ), self = this;
    var timer;

    // message animates out on removal
    var removeMessage = function( e )
    {
        clearTimeout( timer );

        if ( theMessage )
        {
            theMessage.removeClass( "visible" );

            setTimeout( function()
            {
                if ( theMessage ) {
                    theMessage.dispose();
                    self._msgContainer.removeChild( theMessage );
                    theMessage = null;
                }

            }, 1000 );
        }
    };

    self._msgContainer.addChild( theMessage );
    theMessage.addClass( "visible" );

    // remove message on click
    theMessage.addEventListener( "click", removeMessage );

    // and after a set period passed

    timer = setTimeout( removeMessage, 3000 * self._msgContainer.numChildren() );
};

/* protected methods */

/**
 * @override
 * @protected
 */
StatusView.prototype.init = function()
{
    if ( this.initialized )
        return;

    Inheritance.super( this, "init" );

    this._level = new Sprite( "li", { "class" : "level" });
    this.addChild( this._level );

    this._hpMeter = new Sprite( "li", { "class" : "hp" });
    this.addChild( this._hpMeter );

    this._mpMeter = new Sprite( "li", { "class" : "mp" });
    this.addChild( this._mpMeter );

    this._spMeter = new Sprite( "li", { "class" : "sp" });
    this.addChild( this._spMeter );

    this._xpMeter = new Sprite( "li", { "class" : "xp" });
    this.addChild( this._xpMeter );

    this._moneyMeter = new Sprite( "li", { "class" : "money" });
    this.addChild( this._moneyMeter );

    this._msgContainer = new Sprite( "ul", { "class" : "notifications" });
    this.addChild( this._msgContainer );
};
