function updateHP( damage, currentHP ) {
    return { hp: Math.max( 0, currentHP - damage ) };
}

export default
{
    /**
     * Deal given damage to given opponent
     */
    attackOpponent({ commit }, damage, opponent ) {
        commit( "updateOpponent", updateHP( damage, opponent.hp ));
    },
    /**
     * Deal given damage to the given player
     */
    attackPlayer({ commit }, damage, player ) {
        commit( "updatePlayer", updateHP( damage, player.hp ));
    }
};
