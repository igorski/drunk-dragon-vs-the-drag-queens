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

function getDamageForAttackByQueen( queen, targetCharacter, attackType ) {
    // TODO multiply attack damage by carried items
    switch ( attackType ) {
        default:
        case AttackTypes.SLAP:
            return queen.level * 1;
        case AttackTypes.KICK:
            return queen.level * 2;
    }
}

function getDamageForAttackByDragon( dragon, targetCharacter, attackType ) {
    // we take some pity on new players
    const painMultiplier = targetCharacter.level === 1 ? 2 : 5;
    switch ( attackType ) {
        default:
        case AttackTypes.BITE:
            return dragon.level * painMultiplier;
    }
}
