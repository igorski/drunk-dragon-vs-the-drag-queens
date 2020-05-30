module.exports = Character;

var AttackTypes     = require( "../../definitions/AttackTypes" );
var AttackFactory   = require( "../../model/factories/AttackFactory" );
var Inheritance     = require( "zjslib" ).Inheritance;
var EventDispatcher = require( "zjslib" ).EventDispatcher;
var Random          = require( "random-seed" );

/**
 * @constructor
 * @extends {EventDispatcher}
 *
 * @param {string=} aName
 * @param {number=} aMaxHP
 * @param {number=} aHP
 * @param {number=} aMaxMP
 * @param {number=} aMP
 * @param {number=} aMaxSP
 * @param {number=} aSP
 */
function Character( aName, aLevel, aMaxHP, aHP, aMaxMP, aMP, aMaxSP, aSP )
{
    Inheritance.super( this );

    this.name  = aName || "Foo";
    this.level = aLevel || 1;
    this.maxHP = aMaxHP || 5;
    this.HP    = !isNaN( aHP ) ? aHP : this.maxHP;
    this.maxMP = !isNaN( aMaxMP ) ? aMaxMP : 5;
    this.MP    = !isNaN( aMP ) ? aMP : this.maxMP;
    this.maxSP = !isNaN( aMaxSP ) ? aMaxSP : 0;
    this.SP    = !isNaN( aSP ) ? aSP : this.maxSP;
}

Inheritance.extend( Character, EventDispatcher );

/* class properties */

/** @public @type {string} */  Character.prototype.name;
/** @public @type {number} */  Character.prototype.level;
/** @public @type {number} */  Character.prototype.maxHP;
/** @public @type {number} */  Character.prototype.HP;
/** @public @type {number} */  Character.prototype.maxMP;
/** @public @type {number} */  Character.prototype.MP;
/** @public @type {number} */  Character.prototype.maxSP;
/** @public @type {number} */  Character.prototype.SP;    // floating point
/** @public @type {boolean} */ Character.prototype.isDefending;
/** @public @type {number} */  Character.prototype.x = 0;
/** @public @type {number} */  Character.prototype.y = 0;

/* public methods */

/**
 * returns an Attack describing the type of attack
 * and the damage dealt to the players HP, override
 * in derived Character classes for specific Attack types
 *
 * can be null if attack preparation failed (e.g. Character
 * is confused / dizzy / etc.)
 *
 * @public
 *
 * @param {string=} aAttackType what type of attack to execute
 * @return {Attack|null}
 */
Character.prototype.attack = function( aAttackType )
{
    var rand = Random.create();

    if ( rand.intBetween( 0, 10 ) === 0 )
        return null;

    // TODO : randomize even further in case of item (confusion, dizzy, etc. to miss)

    aAttackType = aAttackType || AttackTypes.PUNCH;

    return AttackFactory.getAttack( aAttackType, this );
};

/**
 * invoked whenever this Character is attacked by its Opponent
 *
 * @public
 *
 * @param {Attack} aAttack
 * @return {boolean} whether the attack was successful
 */
Character.prototype.collect = function( aAttack )
{
    // can be null if attack preparation failed
    if ( !aAttack )
        return false;

    // TODO : randomize in case of defend or item (shield for less damage, etc.)

    if ( !this.isDefending )
    {
        this.HP = Math.max( 0, this.HP - aAttack.power );
        return true;
    }
    this.isDefending = false;   // reset for next turn
    return false;
};

/**
 * query whether this Character is still alive
 * (has HP left) and can thus continue the battle
 *
 * @public
 *
 * @return {boolean}
 */
Character.prototype.isAlive = function()
{
    return this.HP > 0;
};
