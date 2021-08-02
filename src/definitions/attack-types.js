/**
 * All different attack types Characters can execute.
 * Not all types are available to all Characters.
 *
 * @see AttackFactory
 */
export default {
    SLAP: 0,
    KICK: 1,
    BITE: 2
};

export const ATTACK_PREPARED = 1;
export const ATTACK_MISSED   = 2;
export const ATTACK_DODGED   = 3;
