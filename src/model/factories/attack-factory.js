import { QUEEN, DRAGON } from "@/definitions/character-types";
import AttackTypes       from "@/definitions/attack-types";
import { SHOE_HEELS }    from "@/definitions/item-types";

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
    // TODO multiply/divide attack damage by carried items
    let baseValue = 1;
    const { items } = queenCharacter.inventory;
    switch ( attackType ) {
        default:
        case AttackTypes.SLAP:
            return queenCharacter.level * 1;
        case AttackTypes.KICK:
            baseValue = queenCharacter.level * 2;
            if ( items.find(({ name }) => name === SHOE_HEELS )) {
                baseValue *= 2.5;
            }
            return baseValue;
    }
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
