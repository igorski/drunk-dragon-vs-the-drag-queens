var Models = module.exports = {};

var MVC         = require( "zmvc" ).MVC;
var AudioModel  = require( "../model/AudioModel" );
var BattleModel = require( "../model/BattleModel" );
var GameModel   = require( "../model/GameModel" );
var PlayerModel = require( "../model/PlayerModel" );
var ShopModel   = require( "../model/ShopModel" );

Models.init = function()
{
    MVC.registerModel( new AudioModel() );
    MVC.registerModel( new BattleModel() );
    MVC.registerModel( new GameModel() );
    MVC.registerModel( new PlayerModel() );
    MVC.registerModel( new ShopModel() );
};
