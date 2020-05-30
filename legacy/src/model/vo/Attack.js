module.exports = Attack;

/**
 * Attack describes a single attack, it has power (depletes
 * enemy HP), has a cost (requires MP) and a type (enumerated
 * in AttackTypes)
 *
 * @constructor
 *
 * @param {number} aPower
 * @param {number} aCost
 * @param {string} aType
 */
function Attack( aPower, aCost, aType )
{
    this.power = aPower;
    this.cost  = aCost;
    this.type  = aType;
}

/* class properties */

/** @public @type {number} */ Attack.prototype.power;
/** @public @type {number} */ Attack.prototype.cost;
/** @public @type {number} */ Attack.prototype.type;
