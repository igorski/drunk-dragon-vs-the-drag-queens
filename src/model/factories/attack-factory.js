imports ATTACK from "@/definitions/attack-types";

export const getDamageForAttack = ( character, type ) => {
    switch ( type ) {
        default:
        case ATTACK.SLAP:
            return character.level * 2;
            break;
        case ATTACK.KICK:
            return character.level * 3;
            break;
    }
};
