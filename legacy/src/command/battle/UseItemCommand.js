module.exports = UseItemCommand;

var Inheritance   = require( "zjslib" ).Inheritance;
var ArrayUtil     = require( "zjslib" ).utils.ArrayUtil;
var Sprite        = require( "zjslib" ).Sprite;
var Command       = require( "zmvc" ).Command;
var Copy          = require( "../../definitions/Copy" );
var Notifications = require( "../../definitions/Notifications" );
var PlayerModel   = require( "../../model/PlayerModel" );
var BattleModel   = require( "../../model/BattleModel" );
var ItemFactory   = require( "../../model/factories/ItemFactory" );
var ItemOverlay   = require( "../../view/item/ItemOverlay" );
var ItemTypes     = require( "../../definitions/ItemTypes" );

function UseItemCommand()
{

}

Inheritance.extend( UseItemCommand, Command );

/* public methods */

/**
 * @override
 * @public
 *
 * @param {string} aMessageType
 * @param {*=} aMessageData
 */
UseItemCommand.prototype.execute = function( aMessageType, aMessageData )
{
    console.log( "USE ITEM COMMAND" );

    var playerModel = this.getModel( PlayerModel.NAME );
    var battleModel = this.getModel( BattleModel.NAME );

    var player = playerModel.getPlayer();

    if ( battleModel.inBattle &&
         battleModel.isPlayerTurn &&
         player )
    {
        // spawn item selection popup

        var overlay = new ItemOverlay( player.inventory,
                                       this.handleSelect.bind( this ),
                                       this.handleMPup.bind( this ),
                                       ItemTypes.MEDICINE );

        this.broadcast( Notifications.Navigation.OPEN_OVERLAY, overlay );
    }
};

/* event handlers */

/**
 * @protected
 *
 * @param {Event} aEvent
 */
UseItemCommand.prototype.handleSelect = function( aEvent )
{
    var playerModel = this.getModel( PlayerModel.NAME );
    var battleModel = this.getModel( BattleModel.NAME );

    var player = playerModel.getPlayer();
    var items  = player.inventory.items;

    if ( !items || items.length === 0 ||
         !( aEvent.target instanceof Sprite ))
    {
        return this.handleMPup( aEvent );
    }

    var btn  = aEvent.target;
    var item = items[ parseInt( btn.getDataAttribute( "index" ), 10 ) ];

    ItemFactory.applyItem( item, player );

    // remove item from inventory

    ArrayUtil.removeItem( items, item );

    // switch turn

    battleModel.isPlayerTurn = false;

    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );
    this.broadcast( Notifications.Player.UPDATE_STATUS );
    this.broadcast( Notifications.Battle.CONTINUE_BATTLE );
    this.done();
};

/**
 * @protected
 *
 * @param {Event} aEvent
 * @return {obj}
 */
UseItemCommand.prototype.handleMPup = function( aEvent )
{
    this.broadcast( Notifications.Navigation.CLOSE_OVERLAY );
    this.done();
};
