import store            from "@/store/modules/battle-module";
import { DRAGON }       from "@/definitions/character-types";
import CharacterFactory from "@/model/factories/character-factory";

const { getters, mutations } = store;

describe( "Vuex battle module", () => {
    describe( "getters", () => {
        it( "should be able to retrieve the currently battling opponent", () => {
            const state = { opponent: CharacterFactory.create() };
            expect( getters.opponent( state )).toEqual( state.opponent );
        });
    });

    describe( "mutations", () => {
        it( "should be able to set the currently battling opponent", () => {
            const state = { opponent: null };
            const opponent = CharacterFactory.create();
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
});
