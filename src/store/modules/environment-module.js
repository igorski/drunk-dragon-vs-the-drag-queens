import AudioTracks                           from '@/definitions/audio-tracks';
import BuildingFactory, { BUILDING_TILES }   from '@/model/factories/building-factory';
import EffectFactory                         from '@/model/factories/effect-factory';
import IntentFactory                         from '@/model/factories/intent-factory';
import ShopFactory                           from '@/model/factories/shop-factory';
import { renderEnvironment }                 from '@/services/environment-bitmap-cacher';
import SpriteCache                           from '@/utils/sprite-cache';
import { getFirstFreeTileOfTypeAroundPoint } from '@/utils/terrain-util';

import {
    SCREEN_GAME, SCREEN_SHOP, SCREEN_CHARACTER_INTERACTION
} from '@/definitions/screens';

export default {
    state: {
        world: null,
        character: null,         // character the player is currently interacting with
        activeEnvironment: null, // environment the player is currently navigating
        building: null,          // currently entered building
        shop: null,              // currently entered shop
    },
    getters: {
        world: state => state.world,
        character: state => state.character,
        activeEnvironment: state => state.activeEnvironment,
        building: state => state.building,
        floor: state => state.building?.floor ?? NaN,
        shop: state => state.shop,
        isOutside: state => !state.building && !state.shop,
    },
    mutations: {
        setCharacter( state, character ) {
            state.character = character;
        },
        setWorld( state, world ) {
            state.world = world;
        },
        setBuilding( state, building ) {
            state.building = building;
        },
        setShop( state, shop ) {
            state.shop = shop;
        },
        setXPosition( state, value ) {
            state.activeEnvironment.x = value;
        },
        setYPosition( state, value ) {
            state.activeEnvironment.y = value;
        },
        setActiveEnvironment( state, environment ) {
            state.activeEnvironment = environment;
        },
        setFloor( state, floor ) {
            state.building.floor = floor;
        },
        addItemToShop( state, item ) {
            const { items } = state.shop;
            if ( !items.includes( item )) {
                items.push( item );
            }
        },
        removeItemFromShop( state, item ) {
            const index = state.shop.items.indexOf( item );
            if ( index > -1 ) {
                state.shop.items.splice( index, 1 );
            }
        },
        removeCharacter( state, character ) {
            if ( state.character === character ) {
                state.character = null;
            }
            const { characters } = state.activeEnvironment;
            const index = characters.indexOf( character );
            if ( index > -1 ) {
                characters.splice( index, 1 );
            }
        },
        addItemToCharacterInventory( state, { item, character }) {
            const char = state.activeEnvironment.characters.find( c => character );
            if ( char ) {
                char.inventory.items.push( item );
            }
        },
        markVisitedTerrain( state, visitedTerrainIndices = [] ) {
            const { visitedTerrain } = state.activeEnvironment;
            visitedTerrainIndices.forEach( index => {
                if ( !visitedTerrain.includes( index )) {
                    visitedTerrain.push( index );
                }
            });
        },
        flushBitmaps( state ) {
            state.activeEnvironment.characters.forEach( character => {
                delete character.bitmap;
            });
        },
    },
    actions: {
        enterShop({ state, getters, commit }, shop ) {
            if ( !shop.items.length ) {
                ShopFactory.generateItems( shop, 5 );
            }
            commit( 'setShop', shop );
            commit( 'setScreen', SCREEN_SHOP );
            commit( 'addEffect', EffectFactory.create(
                null, getters.gameTime, 60000, 0, 1, 'handleShopTimeout'
            ));
        },
        leaveShop({ commit }) {
            commit( 'removeEffectsByCallback', [ 'handleShopTimeout' ]);
        },
        handleShopTimeout({ commit, getters, dispatch }) {
            commit( 'openDialog', { message: getters.translate('timeouts.shop') });
            commit( 'setScreen', SCREEN_GAME );
            dispatch( 'leaveShop' );
        },
        async enterBuilding({ state, getters, commit, dispatch }, building ) {
            // generate levels, terrains and characters inside the building
            BuildingFactory.generateFloors( state.hash, building, getters.player );

            commit( 'setBuilding', building );

            // enter building at the first floor
            await dispatch( 'changeFloor', 0 );
            // change music to building theme
            dispatch( 'playSound', AudioTracks.BUILDING_THEME );
        },
        // change floor inside building
        async changeFloor({ state, getters, commit, dispatch }, floor ) {
            const { floors } = state.building;
            const maxFloors  = floors.length;
            const isDown     = floor < state.building.floor;

            if ( floor < 0 ) {
                // was first stairway, go back to outside world
                dispatch( 'leaveBuilding' );
            } else {
                // ascend/descend to requested level
                commit( 'setFloor', floor );
                await dispatch( 'changeActiveEnvironment', floors[ floor ]);
                // position player next to stairway
                const environment = getters.activeEnvironment;
                const firstExit   = environment.exits[ isDown ? 1 : 0 ];
                const startCoordinates = getFirstFreeTileOfTypeAroundPoint( firstExit.x, firstExit.y, environment, BUILDING_TILES.GROUND );
                commit( 'setXPosition', startCoordinates.x );
                commit( 'setYPosition', startCoordinates.y );
            }
        },
        async leaveBuilding({ state, commit, dispatch }) {
            commit( 'setBuilding', null );
            SpriteCache.ENV_BUILDING.src = ''; // reset building level cache

            await dispatch( 'changeActiveEnvironment', state.world );

            // change music to overground theme
            dispatch( 'playSound', AudioTracks.OVERGROUND_THEME );
        },
        async changeActiveEnvironment({ state, getters, commit }, environment ) {
            if ( !!state.activeEnvironment ) {
                // free memory allocated to Bitmaps
                commit( 'flushBitmaps' );
            }
            commit( 'setActiveEnvironment', environment );
            commit( 'setLoading', true );
            await renderEnvironment( environment, getters.player );
            commit( 'setLoading', false );
        },
        interactWithCharacter({ state, commit }, character ) {
            let { intent } = character.properties;
            if ( !intent ) {
                character.properties.intent = IntentFactory.create();
            }
            commit( 'setCharacter', character );
            commit( 'setScreen', SCREEN_CHARACTER_INTERACTION );
        },
    }
};
