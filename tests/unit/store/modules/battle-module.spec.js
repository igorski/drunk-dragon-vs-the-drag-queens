import store            from "@/store/modules/battle-module";
import AttackTypes      from "@/definitions/attack-types";
import { DRAGON }       from "@/definitions/character-types";
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
    });

    describe( "mutations", () => {
        it( "should be able to set the currently battling opponent", () => {
            const state = { opponent: null };
            const opponent = CharacterFactory.create({ type: DRAGON });
            mutations.setOpponent( state, opponent );
            expect( state.opponent ).toEqual( opponent );
        });

        it( "should be able to update the properties of the currently battling opponent", () => {
            const state = { opponent: CharacterFactory.create({ x: 10, y: 11, hp: 10, type: DRAGON }) };
            const { appearance, inventory, properties } = state.opponent;
            const updatedOpponent = {
                hp: 200,
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
                hp: 200,
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
                opponent.hp = 10;
                mockDamageForAttack = 5;
                const damage = await actions.attackOpponent({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "updateOpponent", { hp: opponent.hp - mockDamageForAttack });
                expect( damage ).toEqual( mockDamageForAttack );
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
                player.hp = 10;
                mockDamageForAttack = 1;
                await actions.attackPlayer({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerTurn", true );
            });

            it( "should not activate the Players turn if the Player has no HP left after attack", async () => {
                const commit = jest.fn();
                player.hp = 1;
                mockDamageForAttack = 1;
                await actions.attackPlayer({ state, getters: mockedGetters, commit }, { type: AttackTypes.SLAP });
                expect( commit ).toHaveBeenNthCalledWith( 2, "setPlayerTurn", false );
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
    });
});
