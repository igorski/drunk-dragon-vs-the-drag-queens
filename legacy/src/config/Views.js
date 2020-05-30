var Views = module.exports = {};

var MVC  = require( "zmvc" ).MVC;
var View = require( "zmvc" ).View;

var StageView        = require( "../view/Stage.View" );
var StageController  = require( "../view/Stage.Controller" );
var StatusView       = require( "../view/status/Status.View" );
var StatusController = require( "../view/status/Status.Controller" );
var BattleView       = require( "../view/battle/Battle.View" );
var BattleController = require( "../view/battle/Battle.Controller" );
var MenuView         = require( "../view/menu/Menu.View" );
var MenuController   = require( "../view/menu/Menu.Controller" );
var WorldView        = require( "../view/world/World.View" );
var WorldController  = require( "../view/world/World.Controller" );
var CaveView         = require( "../view/cave/Cave.View" );
var CaveController   = require( "../view/cave/Cave.Controller" );
var ShopView         = require( "../view/shop/Shop.View" );
var ShopController   = require( "../view/shop/Shop.Controller" );
var ConfigView       = require( "../view/config/Config.View" );
var ConfigController = require( "../view/config/Config.Controller" );

// list here all Views and their Controllers

Views.BINDINGS = [
    { view : BattleView, controller : BattleController },
    { view : MenuView,   controller : MenuController },
    { view : ShopView,   controller : ShopController },
    { view : StageView,  controller : StageController },
    { view : StatusView, controller : StatusController },
    { view : CaveView,   controller : CaveController },
    { view : WorldView,  controller : WorldController },
    { view : ConfigView, controller : ConfigController }
];

/**
 * initialize and bind all the views
 * for the application
 *
 * @public
 */
Views.init = function()
{
    Views.BINDINGS.forEach( function( binding )
    {
        MVC.registerView( binding.view, binding.controller );
    });

    // MVC.stage is unique as it is already present in the DOM

    MVC.stage = new StageView( document.body );
};
