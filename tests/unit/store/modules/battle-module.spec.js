import store            from "@/store/modules/battle-module";
import AttackTypes      from "@/definitions/attack-types";
import { DRAGON }       from "@/definitions/character-types";
import { XP_PER_LEVEL } from "@/definitions/constants";
import { GAME_OVER }    from "@/definitions/game-states";
import { SCREEN_GAME }  from "@/definitions/screens";
import CharacterFactory from "@/model/factories/character-factory";

const { getters, mutations, actions } = store;

let mockRandomValue;
jest.mock( "@/utils/random-util", () => ({
    random: () => mockRandomValue,
    randomFromList: list => list[0],
    randomInRange: (min, max) => min,
}));
let mockDamageForAttack;
jest.mock( "@/model/factories/attack-factory", () => ({
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

            it( "should always end the players current turn, regardless of outcome", async () => {
                const commit = jest.fn();
                await actions.attackOpponent({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 1, "setPlayerTurn", false );
            });

            it( "should update the opponent HP and return the damage for the given attack type", async () => {
                const commit = jest.fn();
                const dispatch = jest.fn();
                opponent.hp = 10;
                mockDamageForAttack = 5;
                const damage = await actions.attackOpponent({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "updateOpponent", { hp: opponent.hp - mockDamageForAttack });
                expect( damage ).toEqual( mockDamageForAttack );
                expect( dispatch ).not.toHaveBeenCalledWith( "resolveBattle" );
            });

            it( "should resolve the battle if the opponent has no HP left after attack", async () => {
                const commit = jest.fn();
                const dispatch = jest.fn();
                opponent.hp = 1;
                mockDamageForAttack = 1;
                await actions.attackOpponent({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( dispatch ).toHaveBeenCalledWith( "resolveBattle" );
            });
        });

        describe( "when attempting to run from the current Opponent", () => {
            const opponent      = CharacterFactory.create({ type: DRAGON });
            const player        = CharacterFactory.create();
            const state         = { opponent };
            const mockedGetters = { player };

            it( "should always end the players current turn, regardless of outcome", async () => {
                const commit = jest.fn();
                await actions.runFromOpponent({ state, getters: mockedGetters, commit });
                expect( commit ).toHaveBeenNthCalledWith( 1, "setPlayerTurn", false );
            });

            it( "should not allow intoxicated players to escape", async () => {
                player.properties.intoxication = 0.8;
                const commit = jest.fn();
                const escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit });
                expect( escaped ).toBe( false );
                expect( commit ).not.toHaveBeenNthCalledWith( 1, "setOpponent", null );
                expect( commit ).not.toHaveBeenNthCalledWith( 2, "setScreen",   SCREEN_GAME );
            });

            it( "should always allow escape to level 1 players", async () => {
                player.properties.intoxication = 0;
                player.level = 1;
                const commit = jest.fn();
                const escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit });
                expect( escaped ).toBe( true );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setOpponent", null );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setScreen",   SCREEN_GAME );
            });

            it( "should randomize the escape for player higher than level 1", async () => {
                player.level = 2;
                mockRandomValue = .4;

                let escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit: jest.fn() });
                expect( escaped ).toBe( false );

                mockRandomValue = .6;
                escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit: jest.fn() });
                expect( escaped ).toBe( true );
            });

            it( "should multiply the randomized escape value for boosted players with a level higher than 1", async () => {
                player.level = 2;
                player.properties.boost = 1.5;
                mockRandomValue = .4;

                const escaped = await actions.runFromOpponent({ state, getters: mockedGetters, commit: jest.fn() });
                expect( escaped ).toBe( true );
            });
        });

        describe( "when the Player is attacked", () => {
            const opponent      = CharacterFactory.create({ type: DRAGON });
            const player        = CharacterFactory.create();
            const state         = { opponent };
            const mockedGetters = { player };

            it( "should activate the Players turn if the Player still has HP left after attack", async () => {
                const commit = jest.fn();
                const dispatch = jest.fn();
                player.hp = 10;
                mockDamageForAttack = 1;
                await actions.attackPlayer({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerTurn", true );
                expect( dispatch ).not.toHaveBeenCalledWith( "resolveBattle" );
            });

            it( "should not activate the Players turn if the Player has no HP left after attack", async () => {
                const commit = jest.fn();
                const dispatch = jest.fn();
                player.hp = 1;
                mockDamageForAttack = 1;
                await actions.attackPlayer({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerTurn", false );
            });

            it( "should resolve the battle if the Player has no HP left after attack", async () => {
                const commit = jest.fn();
                const dispatch = jest.fn();
                player.hp = 1;
                mockDamageForAttack = 1;
                await actions.attackPlayer({ state, getters: mockedGetters, commit, dispatch }, { type: AttackTypes.SLAP });
                expect( dispatch ).toHaveBeenCalledWith( "resolveBattle" );
            });

            it( "should update the opponent HP and return the damage for the given attack type", async () => {
                const commit = jest.fn();
                player.hp = 10;
                mockDamageForAttack = 5;
                const damage = await actions.attackPlayer({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 1, "updatePlayer", { hp: player.hp - mockDamageForAttack });
                expect( damage ).toEqual( mockDamageForAttack );
            });
        });

        it( "should be able to start a battle setting the appropriate values", async () => {
            const commit = jest.fn();
            const opponent = { foo: "bar" };

            await actions.startBattle({ commit }, opponent );

            expect( commit ).toHaveBeenNthCalledWith( 1, "setBattleWon", false );
            expect( commit ).toHaveBeenNthCalledWith( 2, "setOpponent", opponent );
            expect( commit ).toHaveBeenNthCalledWith( 3, "setAward", expect.any( Number ));
        });

        describe( "When resolving a battle", () => {
            let mockedGetters;
            const createMockAwardGetter = () => {
                return jest.fn(( mutation, value ) => {
                    if ( mutation === "awardXP" ) {
                        mockedGetters.player.xp += value;
                    }
                });
            };

            it( "should set the game over state when the opponent has won", async () => {
                const state = { opponent: { hp: 1 } };
                mockedGetters = { player: { hp: 0 } };
                const commit = jest.fn();
                await actions.resolveBattle({ state, commit, getters: mockedGetters });
                expect( commit ).toHaveBeenCalledWith( "setGameState", GAME_OVER );
            });

            if( "should award XP, set the battle won status and clear the Opponent when the Player has won", async () => {
                const state = { opponent: { hp: 0 }, award: 10 };
                mockedGetters = { player: { hp: 1 } };
                const commit = jest.fn();
                await actions.resolveBattle({ state, commit, getters: mockedGetters });
                expect( commit ).toHaveBeenNthCalledWith( 1, "awardXP", state.award );
                expect( commit ).toHaveBeenNthCalledWith( 2, "setBattleWon", true );
                expect( commit ).toHaveBeenNthCalledWith( 3, "setOpponent", null );
            });

            it( "should increase the level when sufficient XP has been gathered", async () => {
                const halfLevelXP = XP_PER_LEVEL / 2;
                const state       = { opponent: { hp: 0 }, award: halfLevelXP };
                mockedGetters     = { player: { xp: 0, level: 1, hp: 3, maxHp: 5 } };

                let commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit });

                // expected level not to have risen yet
                expect( commit ).not.toHaveBeenCalledWith( "setPlayerLevel", expect.any( Number ));

                mockedGetters.player.xp = 0;
                state.award = XP_PER_LEVEL;
                commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit });

                // expected level to have risen
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerLevel", 2 );
                // expect HP to have risen
                expect( commit ).toHaveBeenNthCalledWith( 3, "updatePlayer", { hp: 8, maxHp: 10 } );
            });

            it( "should require increasingly more XP to raise subsequent levels", async () => {
                // if XP_PER_LEVEL is 10, level 2 is reached at 10 XP, level 3 at 30 XP,
                // level 4 at 70 XP, level 5 at 130 XP, etc.
                const state   = { opponent: { hp: 0 }, award: XP_PER_LEVEL };
                mockedGetters = { player: { xp: XP_PER_LEVEL, level: 2 }};
                let commit    = createMockAwardGetter();

                await actions.resolveBattle({ state, getters: mockedGetters, commit });

                // expect not have to have risen yet
                expect( commit ).not.toHaveBeenCalledWith( "setPlayerLevel", expect.any( Number ));

                // to advance from level 2 to 3, you need twice the XP_PER_LEVEL above
                // the amount needed to advance from level 1 to 2 (which is XP_PER_LEVEL)
                mockedGetters.player = { xp: XP_PER_LEVEL, level: 2 };
                state.award = XP_PER_LEVEL * 2;
                commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit });

                // expect to have risen
                expect( commit ).toHaveBeenCalledWith( "setPlayerLevel", 3 );

                mockedGetters.player = { xp: XP_PER_LEVEL * 3, level: 3 };
                state.award = XP_PER_LEVEL * 2;
                commit = createMockAwardGetter();
                await actions.resolveBattle({ state, getters: mockedGetters, commit });

                // expect not have to have risen yet
                expect( commit ).not.toHaveBeenCalledWith( "setPlayerLevel", expect.any( Number ));

                // to advance from level 3 to 4, you need four times the XP_PER_LEVEL above
                // the amount needed to advance from level 2 to 3 (which is XP_PER_LEVEL * 3)
                state.award = XP_PER_LEVEL * 2;
                await actions.resolveBattle({ state, getters: mockedGetters, commit });

                // expect to have risen
                expect( commit ).toHaveBeenCalledWith( "setPlayerLevel", 4 );
            });

            it( "should reposition the opponent if it was the Dragon or otherwise remove it from the environment", async () => {
                const state   = { opponent: { hp: 0 }, award: XP_PER_LEVEL };
                mockedGetters = { player: { xp: XP_PER_LEVEL, level: 2 }};
                let dispatch  = jest.fn();
                let commit    = jest.fn();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });
                expect( dispatch ).not.toHaveBeenCalled();
                expect( commit ).toHaveBeenCalledWith( "removeCharacter", state.opponent );

                state.opponent.type = DRAGON;
                commit = jest.fn();

                await actions.resolveBattle({ state, getters: mockedGetters, commit, dispatch });
                expect( dispatch ).toHaveBeenCalledWith( "positionDragon", expect.any( Number ));
                expect( commit ).not.toHaveBeenCalledWith( "removeCharacter", state.opponent );
            });
        });
    });
});
