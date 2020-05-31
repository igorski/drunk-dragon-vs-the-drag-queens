var Opponent    = require( "../vo/Opponent" );
var Item        = require( "../vo/Item" );
var World       = require( "../vo/World" );
var ItemFactory = require( "./ItemFactory" );
var Random      = require( "random-seed" );

import EnvironmentFactory from '@/model/environment-factory';
import InventoryFactory from '@/model/inventory-factory';

/**
 * EnemyFactory generates a pseudo-random enemy
 * for the Player specific to the Players current location
 * and level
 */
var EnemyFactory = module.exports =
{
    /**
     * generate a set of enemies for the given World
     *
     * @param {Player} aPlayer
     * @param {Environment} aEnvironment
     */
    generateEnemies : function( aPlayer, aEnvironment )
    {
        var mpi = Math.PI / 180;
        var enemiesInCircle = 3, circleRadius = 20;
        var incrementRadians = ( 360 / enemiesInCircle ) * mpi;
        var circle = 0, radians = mpi;
        var maxDistanceFromEdge = 10;
        var amountOfEnemies = aEnvironment instanceof World ? aEnvironment.width / 2 : Math.min( aPlayer.level * 2, 50 );
        var x, y, enemy;

        for ( var i = 0; i < amountOfEnemies; ++i, ++circle )
        {
            x = aEnvironment.x + Math.sin( radians ) * circleRadius;
            y = aEnvironment.y + Math.cos( radians ) * circleRadius;

            // keep within bounds of map

            if ( x < maxDistanceFromEdge ) {
                x = maxDistanceFromEdge;
            }
            else if ( x > aEnvironment.width - maxDistanceFromEdge ) {
                x = aEnvironment.width - maxDistanceFromEdge;
                circleRadius *= .6;
            }

            if ( y < maxDistanceFromEdge ) {
                y = maxDistanceFromEdge;
            }
            else if ( y > aEnvironment.height - maxDistanceFromEdge ) {
                y = aEnvironment.height - maxDistanceFromEdge;
                circleRadius *= .6;
            }

            radians += incrementRadians;

            enemy   = EnemyFactory.generateEnemy( aPlayer );
            enemy.x = Math.round( x );
            enemy.y = Math.round( y );

            // TODO : should try again at different coordinates ;)

            if ( EnvironmentFactory.isPositionFree( aEnvironment, x, y )) {
                aEnvironment.enemies.push( enemy );
            }

            if ( circle === enemiesInCircle ) {
                circle = 0;
                circleRadius *= 1.05;
                incrementRadians = ( 90 / enemiesInCircle ) * mpi;
                incrementRadians *= 1.02; // scatter enemies around more
            }
        }
    },

    /**
     * @public
     *
     * @param {Player} aPlayer
     * @param {Object=} aLocation
     */
    generateEnemy : function( aPlayer, aLocation )
    {
        var rand = Random.create();

        // TODO : integrate location for matching levels

        var level = rand.intBetween( aPlayer.level, aPlayer.level + 2 );
        var enemy = new Opponent( level, level + rand.intBetween( 0, 2 ));

        EnemyFactory.generateInventory( enemy );

        return enemy;
    },

    /**
     * used internally to provide Enemy with an inventory
     *
     * @private
     * @param {Opponent} aEnemy
     */
    generateInventory : function( aEnemy )
    {
        // enemy carries inventory items ?

        var rand = Random.create();

        if ( rand.intBetween( 0, 2 ) === 0 )
        {
            var money = rand.intBetween( 1, 5 );
            var items;

            if ( rand.intBetween( 0, 3 ) === 0 )
            {
                items = [ ItemFactory.generateItem() ];
            }
            aEnemy.inventory = InventoryFactory.createInventory( money, items );
        }
    }
};
