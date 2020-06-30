var Player        = require( "../vo/Player" );
var Item          = require( "../vo/Item" );
var CaveAssembler = require( "./CaveAssembler" );

import InventoryFactory from '@/model/factories/inventory-factory';
import WorldFactory from '@/model/factories/world-factory';

var GameAssembler = module.exports =
{
    /**
     * disassemble the state of the models into a base64-
     * encoded stringified JSON Object
     *
     * @public
     *
     * @param {GameModel} gameModel
     * @param {PlayerModel} playerModel
     * @return {string} base64 encoded JSON Object
     */
    disassemble : function( gameModel, playerModel )
    {
        var out = { "hash"      : gameModel.hash,
                    "created"   : gameModel.created,
                    "modified"  : gameModel.modified,
                    "totalTime" : gameModel.totalTime };

        var player    = playerModel.getPlayer();
        var inventory = player.inventory;

        // player

        out.player = {
            "name"  : player.name,
            "level" : player.level,
            "XP"    : player.XP,
            "maxHP" : player.maxHP,
            "HP"    : player.HP,
            "maxMP" : player.maxMP,
            "MP"    : player.MP,
            "maxSP" : player.maxSP,
            "SP"    : player.SP
        };

        // inventory

        out.inventory = {
            "money" : inventory.money
        };

        if ( inventory.hasItems() )
        {
            var items = [];

            inventory.items.forEach( function( item )
            {
                items.push({ "type" : item.type, "value" : item.value });
            });
            out.inventory.items = items;
        }

        // world position (world should regenerate from hash)

        out.world = {
            "x" : gameModel.world.x,
            "y" : gameModel.world.y,
            "t" : gameModel.world.terrain.join( "" )    // the terrain (int values)
        };

        // are we in a cave/dungeon ?
        if ( gameModel.cave )
        {
            out.cave = CaveAssembler.toJSON( gameModel.cave );
        }

        return obfuscate( out );
    },

    /**
     * assemble a base64 stringified JSON Object
     * back into model states
     *
     * @public
     *
     * @param {GameModel} gameModel
     * @param {PlayerModel} playerModel
     * @param {string} encodedData
     *
     * @return {boolean} whether assembly was successful
     */
    assemble : function( gameModel, playerModel, encodedData )
    {
        var data;

        try
        {
            data = deobfuscate( encodedData );
        }
        catch ( e ) {
            return false;
        }

        if ( !data || !data.hash || !data.player || !data.world )
            return false;

        gameModel.hash      = data.hash;
        gameModel.created   = data.created;
        gameModel.modified  = data.modified;
        gameModel.totalTime = data.totalTime;

        const inventory = InventoryFactory.createInventory( data.inventory.money );

        if ( data.inventory.items && data.inventory.items.length > 0 )
        {
            var items = [];

            data.inventory.items.forEach( function( item )
            {
                items.push( new Item( item.type, item.value ));
            });
            inventory.items = items;
        }

        var hasTerrain = typeof data.world.t === "string";  // should always be true, dev fallback only

        var player = new Player( data.player.name,
                                 data.player.level,
                                 data.player.maxHP,
                                 data.player.HP,
                                 data.player.maxMP,
                                 data.player.MP,
                                 data.player.maxSP,
                                 data.player.SP,
                                 data.player.XP,
                                 inventory );


        playerModel.setPlayer( player );

        // recreate and restore world position

        WorldFactory.populate( gameModel.world, gameModel.hash, !hasTerrain );

        gameModel.world.x = data.world.x;
        gameModel.world.y = data.world.y;

        gameModel.invalidateWorld();

        // restore World terrain

        if ( hasTerrain )
        {
            var terrain = gameModel.world.terrain = data.world.t.split( "" ); // split integer values to Array
            var i       = terrain.length;
            while ( i-- )
            {
                terrain[ i ] = parseInt( terrain[ i ], 10 );    // String to numerical
            }
        }

        // were we in a cave/dungeon ?
        if ( data.cave )
        {
            var cave  = gameModel.cave = CaveAssembler.fromJSON( data.cave );
            var level = cave.levels[ cave.level ];

            // update the Caves properties to match the terrain dimensions of the current level

            cave.terrain = level.terrain;
        }
        gameModel.setGameState( true );

        return true;
    }
};

/**
 * lets make the stored data a bit harder to modify
 * by cunning players attempting to cheat ;)
 *
 * @private
 *
 * @param {Object} jsonData
 * @return {string}
 */
function obfuscate( jsonData )
{
    var base64 = btoa( JSON.stringify( jsonData ));

    // not terribly interesting, simply cutting in half
    // and inverting their order

    var middle = Math.floor( base64.length / 2 );
    var part1  = base64.substr( 0, middle );
    var part2  = base64.substr( middle );

    return reverseString( part2 ) + part1;
}

/**
 * restore saved game to its original properties
 *
 * @private
 *
 * @param {string} encodedData
 * @return {Object}
 */
function deobfuscate( encodedData )
{
    var middle = Math.ceil( encodedData.length / 2 );
    var part1  = encodedData.substr( 0, middle );
    var part2  = encodedData.substr( middle );

    var originalString = part2 + reverseString( part1 );

    return JSON.parse( atob( originalString ));
}

function reverseString( aString )
{
    return aString.split( "" ).reverse().join( "" );
}
