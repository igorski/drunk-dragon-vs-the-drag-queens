import { QUEEN, DRAGON } from "@/definitions/character-types";
import AttackTypes       from "@/definitions/attack-types";

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
    // TODO multiply attack damage by carried items
    switch ( attackType ) {
        default:
        case AttackTypes.SLAP:
            return queenCharacter.level * 1;
        case AttackTypes.KICK:
            return queenCharacter.level * 2;
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
