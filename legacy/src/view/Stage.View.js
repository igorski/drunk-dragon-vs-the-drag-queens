module.exports = StageView;

var Inheritance = require( "zjslib" ).Inheritance;
var View        = require( "zmvc" ).View;
var Sprite      = require( "zjslib" ).Sprite;

/**
 * @constructor
 * @extends {View}
 */
function StageView()
{
    Inheritance.super( this, document.body );
}

View.extend( StageView, View );

/* class constants */

/** @public @const @type {string} */  StageView.NAME = "StageView";
/** @private @const @type {string} */ StageView.prototype._preloader;

/* public methods */

StageView.prototype.togglePreloader = function( visible )
{
    if ( !this._preloader ) {
        this._preloader = new Sprite( "div", { "class" : "preloader" });
    }

    var animateElement = this._preloader.getElement();
    TweenLite.killTweensOf( animateElement );

    if ( visible ) {
        if ( !this.hasChild( this._preloader )) {
            this.addChild( this._preloader );
        }
        TweenLite.fromTo( animateElement, .3, { css : { opacity: 0 }}, { css : { opacity: 1 }, delay : .5 });
    }
    else {
        TweenLite.to( animateElement, .3, { css : { opacity : 0, delay : 1 }, onComplete : function()
        {
            this.removeChild( this._preloader );

        }.bind( this ) });
    }
};

