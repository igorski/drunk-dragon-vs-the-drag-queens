import { describe, it, expect, vi } from "vitest";
import store            from "@/store/modules/battle-module";
import AttackTypes, { ATTACK_PREPARED, ATTACK_MISSED } from "@/definitions/attack-types";
import { DRAGON }       from "@/definitions/character-types";
import { XP_PER_LEVEL } from "@/definitions/constants";
import { GAME_OVER }    from "@/definitions/game-states";
import { SCREEN_GAME }  from "@/definitions/screens";
import CharacterFactory from "@/model/factories/character-factory";

const { getters, mutations, actions } = store;

let mockRandomValue;
vi.mock( "@/utils/random-util", () => ({
    random: () => mockRandomValue,
    randomBool: () => mockRandomValue,
    randomFromList: list => list[0],
    randomInRangeInt: (min, max) => min,
}));
let mockDamageForAttack;
let mockPrepareAttack;
vi.mock( "@/model/factories/attack-factory", () => ({
    prepareAttack: () => mockPrepareAttack,
    getDamageForAttack: () => mockDamageForAttack,
}));

describe( "Vuex battle module", () => {
    describe( "getters", () => {
        it( "should be able to retrieve the currently battling opponent", () => {
            const state = { opponent: CharacterFactory.create() };
            expect( getters.opponent( state )).toEqual( state.opponent );
        });

        it( "should be able to retrieve whether it is currently the players turn", () => {
            const state = { playerTurn: true };
            expect( getters.playerTurn( state )).toEqual( state.playerTurn );
        });

        it( "should be able to retrieve whether the battle has been won by the player", () => {
            const state = { battleWon: true };
            expect( getters.battleWon( state )).toEqual( state.battleWon );
        });
    });

    describe( "mutations", () => {
        it( "should be able to set the currently battling opponent", () => {
            const state = { opponent: null };
            const opponent = CharacterFactory.create({ type: DRAGON });
            mutations.setOpponent( state, opponent );
            expect( state.opponent ).toEqual( opponent );
        });

        it( "should be able to set the award for winning the current battle", () => {
            const state = { award: 0 };
            mutations.setAward( state, 2 );
            expect( state.award ).toEqual( 2 );
        });

        it( "should be able to update the properties of the currently battling opponent", () => {
            const state = { opponent: CharacterFactory.create({ x: 10, y: 11, hp: 10, maxHp: 10, type: DRAGON }) };
            const { appearance, inventory, properties } = state.opponent;
            const updatedOpponent = {
                hp: 200,
                maxHp: 210,
                xp: 100,
                x: 12,
                y: 13,
                level: 2,
                properties: {
                    speed: 5
                },
                inventory: {
                    cash: 10
                },
            };
            mutations.updateOpponent( state, updatedOpponent );
            expect( state.opponent ).toEqual({
                id: expect.any( String ),
                hp: 200,
                maxHp: 210,
                xp: 100,
                x: 12,
                y: 13,
                level: 2,
                type: DRAGON,
                width: 1,
                height: 1,
                properties: {
                    ...properties,
                    speed: 5
                },
                inventory: {
                    ...inventory,
                    cash: 10
                },
                appearance
            });
        });

        it( "should be able to set the player turn", () => {
            const state = { playerTurn: false };
            mutations.setPlayerTurn( state, true );
            expect( state.playerTurn ).toBe( true );
        });

        it( "should be able to set the battle won (by player) status", () => {
            const state = { battleWon: false };
            mutations.setBattleWon( state, true );
            expect( state.battleWon ).toBe( true );
        });
    });

    describe( "actions", () => {
        describe( "when attacking an Opponent", () => {
            const opponent      = CharacterFactory.create({ type: DRAGON });
            const player        = CharacterFactory.create();
            const state         = { opponent };
            const mockedGetters = { player };

            it( "should be unsuccessful when the attack preparation failed", async () => {
                const commit = vi.fn();
                mockPrepareAttack = ATTACK_MISSED;
                const { success, prepareResult } = await actions.attackOpponent(
                    { state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP }
                );
                expect( success ).toBe( false );
                expect( prepareResult ).toEqual( mockPrepareAttack );
                expect( commit ).toHaveBeenCalledTimes( 1 );
            });

            it( "should always end the players current turn, regardless of outcome", async () => {
                let commit = vi.fn();
                mockPrepareAttack = ATTACK_PREPARED;
                await actions.attackOpponent({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 1, "setPlayerTurn", false );

                mockPrepareAttack = ATTACK_MISSED;
                commit = vi.fn();
                await actions.attackOpponent({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 1, "setPlayerTurn", false );
            });

            it( "should update the opponent HP and return the damage for the given attack type when successful", async () => {
                const commit = vi.fn();
                const dispatch = vi.fn();
                opponent.hp = 10;
                mockDamageForAttack = 5;
                mockPrepareAttack = ATTACK_PREPARED;

                const { success, damage } = await actions.attackOpponent(
                    { state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP }
                );
                expect( success ).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 2, "updateOpponent", { hp: opponent.hp - mockDamageForAttack });
                expect( damage ).toEqual( mockDamageForAttack );
                expect( dispatch ).not.toHaveBeenCalledWith( "resolveBattle", expect.any( Number ));
            });

            it( "should resolve the battle if the opponent has no HP left after attack", async () => {
                const commit = vi.fn();
                const dispatch = vi.fn();
                opponent.hp = 1;
                mockDamageForAttack = 1;
                mockPrepareAttack = ATTACK_PREPARED;

                await actions.attackOpponent({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( dispatch ).toHaveBeenCalledWith( "resolveBattle", AttackTypes.SLAP );
            });
        });

        describe( "when attempting to run from the current Opponent", () => {
            const opponent      = CharacterFactory.create({ type: DRAGON });
            const player        = CharacterFactory.create();
            const state         = { opponent };
            const mockedGetters = { player };

            it( "should always end the players current turn, regardless of outcome", async () => {
                const commit = vi.fn();
                await actions.runFromOpponent({ state, getters: mockedGetters, commit, dispatch: vi.fn() });
                expect( commit ).toHaveBeenNthCalledWith( 1, "setPlayerTurn", false );
            });

            it( "should not allow intoxicated players to escape", async () => {
                player.properties.intoxication = 0.8;
                const commit = vi.fn();
                const escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit });
                expect( escaped ).toBe( false );
                expect( commit ).not.toHaveBeenNthCalledWith( 1, "setOpponent", null );
                expect( commit ).not.toHaveBeenNthCalledWith( 2, "setScreen",   SCREEN_GAME );
            });

            it( "should always allow escape to level 1 players", async () => {
                player.properties.intoxication = 0;
                player.level = 1;
                const commit   = vi.fn();
                const dispatch = vi.fn();
                const escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit, dispatch });
                expect( escaped ).toBe( true );
                expect( dispatch ).toHaveBeenCalledWith( "positionCharacter", { id: opponent.id, distance: expect.any( Number ) });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setOpponent", null );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setScreen",   SCREEN_GAME );
            });

            it( "should randomize the escape for player higher than level 1", async () => {
                player.level = 2;
                mockRandomValue = .4;

                let escaped = await actions.runFromOpponent({
                    state, getters: mockedGetters, commit: vi.fn(), dispatch: vi.fn()
                });
                expect( escaped ).toBe( false );

                mockRandomValue = .6;
                escaped = await actions.runFromOpponent({
                    state, getters: mockedGetters, commit: vi.fn(), dispatch: vi.fn()
                });
                expect( escaped ).toBe( true );
            });

            it( "should multiply the randomized escape value for boosted players with a level higher than 1", async () => {
                player.level = 2;
                player.properties.boost = 1.5;
                mockRandomValue = .4;

                const escaped = await actions.runFromOpponent({
                    state, getters: mockedGetters, commit: vi.fn(), dispatch: vi.fn()
                });
                expect( escaped ).toBe( true );
            });
        });

        describe( "when the Player is attacked", () => {
            const opponent      = CharacterFactory.create({ type: DRAGON });
            const player        = CharacterFactory.create();
            const state         = { opponent };
            const mockedGetters = { player };

            it( "should be unsuccessful when the attack preparation failed", async () => {
                const commit = vi.fn();
                mockPrepareAttack = ATTACK_MISSED;
                const { success, prepareResult } = await actions.attackPlayer(
                    { state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP }
                );
                expect( success ).toBe( false );
                expect( prepareResult ).toEqual( mockPrepareAttack );
                expect( commit ).toHaveBeenCalledWith( "setPlayerTurn", true );
                expect( commit ).toHaveBeenCalledTimes( 1 );
            });

            it( "should activate the Players turn if the Player still has HP left after a successful attack", async () => {
                const commit = vi.fn();
                const dispatch = vi.fn();
                player.hp = 10;
                mockDamageForAttack = 1;
                mockPrepareAttack = ATTACK_PREPARED;
                await actions.attackPlayer({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerTurn", true );
                expect( dispatch ).not.toHaveBeenCalledWith( "resolveBattle", expect.any( Number ));
            });

            it( "should not activate the Players turn if the Player has no HP left after a successful attack", async () => {
                const commit = vi.fn();
                const dispatch = vi.fn();
                player.hp = 1;
                mockDamageForAttack = 1;
                mockPrepareAttack = ATTACK_PREPARED;
                await actions.attackPlayer({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerTurn", false );
            });

            it( "should resolve the battle if the Player has no HP left after a successful attack", async () => {
                const commit = vi.fn();
                const dispatch = vi.fn();
                player.hp = 1;
                mockDamageForAttack = 1;
                mockPrepareAttack = ATTACK_PREPARED;
                await actions.attackPlayer({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( dispatch ).toHaveBeenCalledWith( "resolveBattle", expect.any( Number ));
            });

            it( "should update the opponent HP and return the damage for the given attack type after a successful attack", async () => {
                const commit = vi.fn();
                player.hp = 10;
                mockDamageForAttack = 5;
                mockPrepareAttack = ATTACK_PREPARED;

                const { success, damage } = await actions.attackPlayer({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });

                expect( success ).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 1, "updatePlayer", { hp: player.hp - mockDamageForAttack });
                expect( damage ).toEqual( mockDamageForAttack );
            });
        });

        describe( "when starting a battle", () => {
            const mockedGetters = { player: CharacterFactory.create() };
            const opponent      = CharacterFactory.create();
            mockRandomValue     = true; // forces ambush when speed check passes

            it( "should be able to start a battle setting the appropriate values", async () => {
                const commit   = vi.fn();
                const dispatch = vi.fn();

                await actions.startBattle({ commit, getters: mockedGetters, dispatch }, opponent );

                expect( commit ).toHaveBeenNthCalledWith( 1, "setBattleWon", false );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setOpponent", opponent );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setAward", expect.any( Number ));
                expect( dispatch ).toHaveBeenNthCalledWith( 1, "playSound", expect.any( Number ));
            });

            it( "should not ambush the player when the opponent is slower", async () => {
                const commit   = vi.fn();
                const dispatch = vi.fn();

                opponent.properties.speed = mockedGetters.player.properties.speed - 0.1;

                await actions.startBattle({ commit, getters: mockedGetters, dispatch }, opponent );

                expect( commit ).toHaveBeenNthCalledWith( 4, "setPlayerTurn", true );
            });

            it( "should ambush the player when the opponent is faster", async () => {
                const commit   = vi.fn();
                const dispatch = vi.fn();

                opponent.properties.speed = mockedGetters.player.properties.speed + 0.1;

                await actions.startBattle({ commit, getters: mockedGetters, dispatch }, opponent );

                expect( commit ).toHaveBeenNthCalledWith( 4, "setPlayerTurn", false );
            });
        });

        describe( "When resolving a battle", () => {
            let mockedGetters;
            const createMockAwardGetter = () => {
                return vi.fn(( mutation, value ) => {
                    if ( mutation === "awardXP" ) {
                        mockedGetters.player.xp += value;
                    }
                });
            };

            it( "should set the game over state when the opponent has won", async () => {
                const state = { opponent: { hp: 1 } };
                mockedGetters = { player: { hp: 0 } };
                const commit = vi.fn();
                await actions.resolveBattle({ state, commit, getters: mockedGetters });
                expect( commit ).toHaveBeenCalledWith( "setGameState", GAME_OVER );
            });

            if( "should award XP, set the battle won status, clear the Opponent and start environment music when the Player has won", async () => {
                const state = { opponent: CharacterFactory.create({ hp: 0 }), award: 10 };
                mockedGetters = { player: { hp: 1 }, activeEnvironment: { foo: "bar" } };
                const commit = vi.fn();
                const dispatch = vi.fn();

                await actions.resolveBattle({ state, commit, getters: mockedGetters, dispatch });
                expect( commit ).toHaveBeenNthCalledWith( 1, "awardXP", state.award );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setBattleWon", true );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setOpponent", null );
                expect( dispatch ).toHaveBeenNthCalledWith( 1, "playMusicForEnvironment", mockedGetters.activeEnvironment );
            });

            if( "should steal the Opponents cash when the Player has won", async () => {
                const state = { opponent: { hp: 0, inventory: { cash: 10 } }, award: 10 };
                mockedGetters = { player: { hp: 1 } };
                const commit = vi.fn();
                await actions.resolveBattle({ state, commit, getters: mockedGetters });
                expect( commit ).toHaveBeenNthCalledWith( 4, "awardCash", state.opponent.inventory.cash );
            });

            it( "should increase the level when sufficient XP has been gathered", async () => {
                const halfLevelXP = XP_PER_LEVEL / 2;
                const state       = { opponent: CharacterFactory.create({ hp: 0 }), award: halfLevelXP };
                const dispatch    = vi.fn();
                mockedGetters     = { player: { xp: 0, level: 1, hp: 3, maxHp: 5 } };

                let commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });

                // expected level not to have risen yet
                expect( commit ).not.toHaveBeenCalledWith( "setPlayerLevel", expect.any( Number ));

                mockedGetters.player.xp = 0;
                state.award = XP_PER_LEVEL;
                commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });

                // expected level to have risen
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerLevel", 2 );
                // expect HP to have risen
                expect( commit ).toHaveBeenNthCalledWith( 3, "updatePlayer", { hp: 8, maxHp: 10 } );
            });

            it( "should require increasingly more XP to raise subsequent levels", async () => {
                // if XP_PER_LEVEL is 10, level 2 is reached at 10 XP, level 3 at 30 XP,
                // level 4 at 70 XP, level 5 at 130 XP, etc.
                const state    = { opponent: CharacterFactory.create({ hp: 0 }), award: XP_PER_LEVEL };
                mockedGetters  = { player: { xp: XP_PER_LEVEL, level: 2 }};
                const dispatch = vi.fn();
                let commit     = createMockAwardGetter();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });

                // expect not have to have risen yet
                expect( commit ).not.toHaveBeenCalledWith( "setPlayerLevel", expect.any( Number ));

                // to advance from level 2 to 3, you need twice the XP_PER_LEVEL above
                // the amount needed to advance from level 1 to 2 (which is XP_PER_LEVEL)
                mockedGetters.player = { xp: XP_PER_LEVEL, level: 2 };
                state.award = XP_PER_LEVEL * 2;
                commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });

                // expect to have risen
                expect( commit ).toHaveBeenCalledWith( "setPlayerLevel", 3 );

                mockedGetters.player = { xp: XP_PER_LEVEL * 3, level: 3 };
                state.award = XP_PER_LEVEL * 2;
                commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });

                // expect not have to have risen yet
                expect( commit ).not.toHaveBeenCalledWith( "setPlayerLevel", expect.any( Number ));

                // to advance from level 3 to 4, you need four times the XP_PER_LEVEL above
                // the amount needed to advance from level 2 to 3 (which is XP_PER_LEVEL * 3)
                state.award = XP_PER_LEVEL * 2;
                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });

                // expect to have risen
                expect( commit ).toHaveBeenCalledWith( "setPlayerLevel", 4 );
            });

            it( "should remove it from the environment after winning", async () => {
                const state   = { opponent: CharacterFactory.create({ id: "opponentId", hp: 0 }), award: XP_PER_LEVEL };
                mockedGetters = { player: { xp: XP_PER_LEVEL, level: 2 }};
                let dispatch  = vi.fn();
                let commit    = vi.fn();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });
                expect( dispatch ).not.toHaveBeenCalledWith( "positionCharacter", expect.any( Object ));
                expect( commit ).toHaveBeenCalledWith( "removeCharacter", state.opponent );
            });

            it( "should reposition and update the opponent if it was the Dragon as it can't be killed without a special weapon", async () => {
                const state   = { opponent: CharacterFactory.create({ id: "opponentId", hp: 0, type: DRAGON }), award: XP_PER_LEVEL };
                mockedGetters = { player: { xp: XP_PER_LEVEL, level: 2 }};
                let dispatch  = vi.fn();
                let commit    = vi.fn();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });
                expect( dispatch ).toHaveBeenCalledWith( "positionCharacter", { id: "opponentId", distance: expect.any( Number ) });
                expect( commit ).toHaveBeenCalledWith( "updateCharacter", expect.any( Object ));
                expect( commit ).not.toHaveBeenCalledWith( "removeCharacter", state.opponent );
            });

            it( "should end the game by requesting the finale if the opponent was the Dragon and the last attack was a Sword slash", async () => {
                const state   = { opponent: CharacterFactory.create({ id: "opponentId", hp: 0, type: DRAGON }), award: XP_PER_LEVEL };
                mockedGetters = { player: { xp: XP_PER_LEVEL, level: 2 }};
                let dispatch  = vi.fn();
                let commit    = vi.fn();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch }, AttackTypes.SWORD );

                expect( dispatch ).toHaveBeenCalledWith( "showFinale" );
            });

            it( "should NOT end the game if opponent was killed using a Sword slash, but wasn't the Dragon", async () => {
                const state   = { opponent: CharacterFactory.create({ id: "opponentId", hp: 0 }), award: XP_PER_LEVEL };
                mockedGetters = { player: { xp: XP_PER_LEVEL, level: 2 }};
                let dispatch  = vi.fn();
                let commit    = vi.fn();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch }, AttackTypes.SWORD );

                expect( dispatch ).not.toHaveBeenCalledWith( "showFinale" );
            });
        });
    });
});
