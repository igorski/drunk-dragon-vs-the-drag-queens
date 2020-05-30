/**
 * Created with IntelliJ IDEA.
 * User: igorzinken
 * Date: 22-03-15
 * Time: 11:06
 */
module.exports = ConfigView;

var Inheritance = require( "zjslib" ).Inheritance;
var Sprite      = require( "zjslib" ).Sprite;
var View        = require( "zmvc" ).View;

/**
 * @constructor
 * @extends {View}
 */
function ConfigView()
{
    Inheritance.super( this, "div" );
    this.setAttribute( "id", "config" );
}

Inheritance.extend( ConfigView, View );

/* class constants */

/** @public @const @type {string} */ ConfigView.NAME = "ConfigView";

/* class properties */

/** @public @type {Sprite} */ ConfigView.prototype.musicOption;
/** @public @type {Sprite} */ ConfigView.prototype.saveOption;
/** @public @type {Sprite} */ ConfigView.prototype.exitBTN;

/* public methods */

/**
 * @public
 *
 * @param {boolean} musicOn
 */
ConfigView.prototype.setData = function( musicOn, autoSaveOn )
{
    this.musicOption = createCheckbox( "music",     this, musicOn );
    this.saveOption  = createCheckbox( "auto save", this, autoSaveOn );

    this.addChild( this.exitBTN = new Sprite( "button", {}, "exit" ));
};

/* private methods */

function createCheckbox( aLabel, aContainer, isChecked )
{
    var wrapper = new Sprite( "div", { "class" : "checkbox-wrapper" });
    aContainer.addChild( wrapper );

    wrapper.addChild( new Sprite( "label", {}, aLabel ));

    var out = new Sprite( "input", { "type" : "checkbox" });
    wrapper.addChild( out );

    if ( isChecked )
        out.setAttribute( "checked", "checked" );

    return out;
}
