/**
 * Created by igorzinken on 24-02-15.
 */
module.exports = ShopModel;

var Inheritance   = require( "zjslib" ).Inheritance;
var Model         = require( "zmvc" ).Model;
var Notifications = require( "../definitions/Notifications" );
var ShopView      = require( "../view/shop/Shop.View" );
var ShopFactory   = require( "./factories/ShopFactory" );

/**
 * ShopModel holds the current Shop data
 *
 * @constructor
 */
function ShopModel()
{
    Inheritance.super( this, ShopModel.NAME );
}

Inheritance.extend( ShopModel, Model );

/* class constants */

/** @public @const @type {string} */ ShopModel.NAME = "ShopModel";

/* class properties */

/** @protected @type {Shop} */ ShopModel.prototype._shop;

/* public methods */

/**
 * @public
 *
 * @param {Shop} aShop
 * @param {Player} aPlayer
 */
ShopModel.prototype.enterShop = function( aShop, aPlayer )
{
    this._shop = aShop;
    ShopFactory.generateShopItems( aShop, aPlayer );
    this.broadcast( Notifications.Navigation.OPEN_PAGE, ShopView );
};

/**
 * @public
 *
 * @return {Shop}
 */
ShopModel.prototype.getShop = function()
{
    return this._shop;
};
