import EnvironmentActions from '@/model/actions/environment-actions';
import { BUILDING_TYPE }  from '@/model/factories/building-factory';
import { WORLD_TYPE }     from '@/model/factories/world-factory';

describe('Environment actions', () => {
    describe('When hit testing the players location with an Object', () => {
        it('should not take any action when the player is not touching any Object', () => {
            const dispatch    = jest.fn();
            const commit      = jest.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [{ x: 10, y: 11 }],
                shops: [{ x: 11, y: 10 }],
                buildings: [{ x: 11, y: 11 }]
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( false );
            expect( dispatch ).not.toHaveBeenCalled();
            expect( commit ).not.toHaveBeenCalled();
        });

        it('should interact with a character when the player collides with said character', () => {
            const dispatch    = jest.fn();
            const commit      = jest.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [{ x: 10, y: 10 }],
                shops: [],
                buildings: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( 'interactWithCharacter', environment.characters[ 0 ]);
            expect( commit ).toHaveBeenCalledWith( 'setYPosition', environment.y + 1 );
        });

        it('should enter a shop when the player collides with said shop', () => {
            const dispatch    = jest.fn();
            const commit      = jest.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [],
                shops: [{ x: 10, y: 10 }],
                buildings: []
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( 'enterShop', environment.shops[ 0 ]);
            expect( commit ).toHaveBeenCalledWith( 'setYPosition', environment.y + 1 );
        });

        it('should enter a building when the player collides with said building', () => {
            const dispatch    = jest.fn();
            const commit      = jest.fn();
            const getters     = {};
            const environment = {
                x: 10,
                y: 10,
                type: WORLD_TYPE,
                characters: [],
                shops: [],
                buildings: [{ x: 10, y: 10 }]
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( 'enterBuilding', environment.buildings[ 0 ]);
            expect( commit ).toHaveBeenCalledWith( 'setYPosition', environment.y + 1 );
        });

        it('should move to a lower floor when the player collides with the first exit inside a building', () => {
            const dispatch    = jest.fn();
            const commit      = jest.fn();
            const getters     = { floor : 1 };
            const environment = {
                x: 10,
                y: 10,
                type: BUILDING_TYPE,
                characters: [],
                shops: [],
                exits: [{ x: 10, y: 10 }, { x: 12, y: 12 }]
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( 'changeFloor', getters.floor - 1 );
            expect( commit ).toHaveBeenCalledWith( 'setYPosition', environment.y + 1 );
        });

        it('should move to a higher floor when the player collides with the last exit inside a building', () => {
            const dispatch    = jest.fn();
            const commit      = jest.fn();
            const getters     = { floor : 1 };
            const environment = {
                x: 10,
                y: 10,
                type: BUILDING_TYPE,
                characters: [],
                shops: [],
                exits: [{ x: 8, y: 8 }, { x: 10, y: 10 }]
            };
            expect( EnvironmentActions.hitTest({ commit, dispatch, getters }, environment )).toBe( true );
            expect( dispatch ).toHaveBeenCalledWith( 'changeFloor', getters.floor + 1 );
            expect( commit ).toHaveBeenCalledWith( 'setYPosition', environment.y + 1 );
        });
    });
});
