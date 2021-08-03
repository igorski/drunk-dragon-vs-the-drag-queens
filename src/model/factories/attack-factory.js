import { QUEEN, DRAGON } from "@/definitions/character-types";
import AttackTypes, { ATTACK_PREPARED, ATTACK_MISSED, ATTACK_DODGED } from "@/definitions/attack-types";
import { SHOE_HEELS } from "@/definitions/item-types";
import { randomBool } from "@/utils/random-util";

/**
 * Prepare an attack against a Character. Depending on the state
 * of the attacking Character, this can result in a miss. A successfully
 * prepared attack can execute using getDamageForAttack() in a subsequent call
 */
export const prepareAttack = ( character, targetCharacter ) => {
    const { intoxication } = character.properties;
    if ( intoxication > 0.25 && randomBool() ) {
        return ATTACK_MISSED;
    }
    const { boost } = targetCharacter.properties;
    if ( boost > 0.25 && randomBool() ) {
        return ATTACK_DODGED;
    }
    return ATTACK_PREPARED;
};

/**
 * Calculate the damage given character does when executing
 * attack of given attackType onto given targetCharacter
 */
export const getDamageForAttack = ( character, targetCharacter, attackType ) => {
    switch ( character.type ) {
        default:
        case QUEEN:
            return getDamageForAttackByQueen( character, targetCharacter, attackType );
        case DRAGON:
            return getDamageForAttackByDragon( character, targetCharacter, attackType );
    }
};

/* internal methods */

function getDamageForAttackByQueen( queenCharacter, targetCharacter, attackType ) {
    // TODO also multiply/divide attack damage by carried items
    let baseValue = 1;
    const { items } = queenCharacter.inventory;
    const { boost } = queenCharacter.properties;
    switch ( attackType ) {
        default:
        case AttackTypes.SLAP:
            baseValue = queenCharacter.level * 1;
            break;
        case AttackTypes.KICK:
            baseValue = queenCharacter.level * 2;
            if ( items.find(({ name }) => name === SHOE_HEELS )) {
                baseValue *= 2.5;
            }
            break;
    }
    // add multiplier when boosted
    if ( boost > 0 ) {
        baseValue *= ( 1 + boost );
    }
    return Math.round( baseValue );
}

function getDamageForAttackByDragon( dragonCharacter, targetCharacter, attackType ) {
    // we take some pity on new players
    const painMultiplier = targetCharacter.level === 1 ? 2 : 5;
    switch ( attackType ) {
        default:
        case AttackTypes.BITE:
            return dragonCharacter.level * painMultiplier;
    }
}
