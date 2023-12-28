import cloneDeep from "lodash/cloneDeep";
import merge     from "lodash/merge";
import Vue       from "vue";

import { QUEEN, DRAGON }  from "@/definitions/character-types";
import CharacterActions   from "@/model/actions/character-actions";
import EnvironmentActions from "@/model/actions/environment-actions";
import BuildingFactory, {
    BUILDING_TILES, FLOOR_TYPES, generateBarQueens
} from "@/model/factories/building-factory";
import CharacterFactory from "@/model/factories/character-factory";
import EffectFactory    from "@/model/factories/effect-factory";
import IntentFactory    from "@/model/factories/intent-factory";
import InventoryFactory from "@/model/factories/inventory-factory";
import ShopFactory      from "@/model/factories/shop-factory";
import { WORLD_TYPE, getMaxWalkableTile } from "@/model/factories/world-factory";
import { renderEnvironment } from "@/services/environment-bitmap-cacher";
import { randomInRangeInt } from "@/utils/random-util";
import { getRandomFreeTilePosition } from "@/utils/terrain-util";

import SpriteCache, { flushSpriteForCharacter, flushAllSprites } from "@/utils/sprite-cache";
import { getFirstFreeTileOfTypeAroundPoint, positionInReachableDistanceFromPoint, distance } from "@/utils/terrain-util";

import {
    SCREEN_GAME, SCREEN_SHOP, SCREEN_HOTEL, SCREEN_CHARACTER_INTERACTION, SCREEN_BATTLE
} from "@/definitions/screens";

export default {
    state: {
        world: null,
        character: null,         // character the player is currently interacting with
        activeEnvironment: null, // environment the player is currently navigating
        building: null,          // currently entered building
        shop: null,              // currently entered shop
        hotel: null,             // currently entered hotel
    },
    getters: {
        world: state => state.world,
        character: state => state.character,
        dragon: state => state.activeEnvironment === state.world ? state.world.characters.find(({ type }) => type === DRAGON ) : null,
        activeEnvironment: state => state.activeEnvironment,
        building: state => state.building,
        floor: state => state.building?.floor ?? NaN,
        shop: state => state.shop,
        hotel: state => state.hotel,
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
        setShopDebt( state, debt ) {
            state.shop.debt = debt;
        },
        setHotel( state, hotel ) {
            state.hotel = hotel;
        },
        /* coordinates for the player are set on the environment (to maintain position when switching envs) */
        setXPosition( state, { value }) {
            state.activeEnvironment.x = value;
        },
        setYPosition( state, { value }) {
            state.activeEnvironment.y = value;
        },
        /* all non-Player character coordinate updates */
        setCharacterXPosition( state, { value, target }) {
            const character = state.activeEnvironment.characters.find(({ id }) => id === target );
            if ( character ) {
                character.x = value;
            }
        },
        setCharacterYPosition( state, { value, target }) {
            const character = state.activeEnvironment.characters.find(({ id }) => id === target );
            if ( character ) {
                character.y = value;
            }
        },
        setActiveEnvironment( state, environment ) {
            flushAllSprites();
            state.activeEnvironment = environment;
        },
        setFloor( state, floor ) {
            state.building.floor = floor;
        },
        addItemToShop( state, item ) {
            const { items } = state.shop;
            if ( !items.find(({ id }) => id === item.id )) {
                items.push( item );
            }
        },
        removeItemFromShop( state, item ) {
            const index = state.shop.items.findIndex(({ id }) => id === item.id );
            if ( index > -1 ) {
                state.shop.items.splice( index, 1 );
            }
        },
        updateCharacter( state, character ) {
            const { characters } = state.activeEnvironment;
            const index = characters.findIndex(({ id }) => id === character.id );
            if ( index > -1 ) {
                Vue.set( characters, index, merge( cloneDeep( characters[ index ] ), character ));
            }
        },
        removeCharacter( state, character ) {
            if ( state.character?.id === character.id ) {
                state.character = null;
            }
            const { characters } = state.activeEnvironment;
            const index = characters.findIndex(({ id }) => id === character.id );
            if ( index > -1 ) {
                characters.splice( index, 1 );
            }
            flushSpriteForCharacter( character );
        },
        removeCharactersOfType( state, type ) {
            state.activeEnvironment.characters = state.activeEnvironment.characters.filter( c => c.type !== type );
        },
        addItemToCharacterInventory( state, { item, character }) {
            const char = state.activeEnvironment.characters.find(({ id }) => id === character.id );
            if ( char ) {
                char.inventory.items.push( item );
            }
        },
        removeItemFromEnvironment( state, item ) {
            const { items } = state.activeEnvironment;
            const index = items.findIndex(({ id }) => id === item.id );
            if ( index > -1 ) {
                items.splice( index, 1 );
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
                delete character.asset;
            });
        },
    },
    actions: {
        enterShop({ state, getters, commit }, shop ) {
            if ( !shop.items.length ) {
                ShopFactory.generateItems( shop, 5 );
            }
            commit( "setShop", shop );
            commit( "setScreen", SCREEN_SHOP );
            commit( "addEffect", EffectFactory.createRealTime(
                null, getters.gameTime, 60000, 0, 1, "handleShopTimeout"
            ));
        },
        leaveShop({ commit }) {
            commit( "removeEffectsByCallback", [ "handleShopTimeout" ]);
        },
        handleShopTimeout({ commit, getters, dispatch }) {
            commit( "openDialog", { message: getters.translate( "timeouts.shop" ) });
            commit( "setScreen", SCREEN_GAME );
            dispatch( "leaveShop" );
        },
        enterHotel({ commit }, hotel ) {
            commit( "setHotel", hotel );
            commit( "setScreen", SCREEN_HOTEL );
        },
        collectItem({ commit, getters }, item ) {
            commit( "addItemToInventory", item );
            commit( "removeItemFromEnvironment", item );
            commit( "openDialog", { message: getters.translate( `itemCollect.${item.name}` )});
        },
        async enterBuilding({ getters, commit, dispatch }, building ) {
            // generate levels, terrains and characters inside the building if they
            // weren't generated yet.
            if ( !building.floors?.length ) {
                BuildingFactory.generateFloors( building, getters.player );
            }
            commit( "setBuilding", building );

            // enter building at the first floor
            await dispatch( "changeFloor", 0 );
        },
        async enterCave({ state, getters, commit, dispatch }) {
            const { cave } = state.world;
            if ( !cave.floors?.length ) {
                BuildingFactory.generateFloors( cave, getters.player, 1, FLOOR_TYPES.CAVE );
            }
            commit( "setBuilding", cave );
            await dispatch( "changeFloor", 0 );
        },
        // change floor inside building
        async changeFloor({ state, getters, commit, dispatch }, floor ) {
            const { floors } = state.building;
            const maxFloors  = floors.length;
            const isDown     = floor < state.building.floor;

            if ( floor < 0 ) {
                // was first stairway, go back to outside world
                await dispatch( "leaveBuilding" );
            } else {
                // ascend/descend to requested level
                commit( "setFloor", floor );
                const environment = floors[ floor ];
                // generate characters for empty bars
                if ( environment.floorType === FLOOR_TYPES.BAR && environment.characters.length === 0 ) {
                    generateBarQueens( environment, getters.player );
                }
                await dispatch( "changeActiveEnvironment", environment );
                // position player next to stairway
                const firstExit        = environment.exits[ isDown ? 1 : 0 ];
                const startCoordinates = getFirstFreeTileOfTypeAroundPoint( firstExit.x, firstExit.y, environment, BUILDING_TILES.GROUND );
                commit( "setXPosition", { value: startCoordinates.x });
                commit( "setYPosition", { value: startCoordinates.y });
            }
        },
        async leaveBuilding({ state, commit, dispatch }) {
            commit( "setBuilding", null );
            SpriteCache.ENV_BUILDING.bitmap.src = ""; // reset building level cache

            await dispatch( "changeActiveEnvironment", state.world );
        },
        async changeActiveEnvironment({ state, getters, commit, dispatch }, environment ) {
            if ( state.activeEnvironment ) {
                commit( "flushBitmaps" ); // free memory allocated to Bitmaps
                dispatch( "cancelCharacterMovements" ); // cancel pending movement
            }
            commit( "setActiveEnvironment", environment );
            // whenever we enter the overground, the dragon must be repositioned
            if ( environment.type === WORLD_TYPE ) {
                const distance = getters.player.xp === 0 ? 25 : 20;
                dispatch( "positionCharacter", { id: getters.dragon?.id, distance });
            }
            commit( "setLoading", true );
            await renderEnvironment( environment, getters.player );
            commit( "setLoading", false );
            dispatch( "playMusicForEnvironment", environment );
        },
        interactWithCharacter({ state, commit, dispatch }, character ) {
            if ( character.type === QUEEN && !CharacterActions.isAggressive( character )) {
                let { intent } = character.properties;
                if ( !intent ) {
                    character.properties.intent = IntentFactory.create();
                }
                commit( "setCharacter", character );
                commit( "setScreen", SCREEN_CHARACTER_INTERACTION );
                return;
            }
            dispatch( "startBattle", character );
            commit( "setScreen", SCREEN_BATTLE );
        },
        hitTest({ getters, commit, dispatch }) {
            EnvironmentActions.hitTest({ dispatch, commit, getters }, getters.activeEnvironment );
        },
        generateCharacters({ getters }, { type, amount = 20 }) {
            const { activeEnvironment, player } = getters;
            const { characters } = activeEnvironment;
            // TODO: check for limits on existing characters of same type?
            const maxTile  = getMaxWalkableTile();
            for ( let i = 0; i < amount; ++i ) {
                // the first group should be guaranteed to be within walking distance
                const coords = ( i < ( amount / 4 )) ? positionInReachableDistanceFromPoint(
                    activeEnvironment, activeEnvironment.x, activeEnvironment.y, 20 + ( i * 5 ), maxTile
                ) : getRandomFreeTilePosition( activeEnvironment, 0 );
                console.warn(i,coords);
                if ( coords ) {
                    const lvl = CharacterActions.generateOpponentProps( player, type );
                    console.warn(lvl);
                    characters.push( CharacterFactory.create({
                        type, ...coords, ...lvl,
                    }, {}, {}, InventoryFactory.create( randomInRangeInt( 0, 25 ))));
                }
            }
        },
        positionCharacter({ getters, commit }, { id, distance = 20 }) {
            const { world } = getters;
            const character = world.characters.find( c => c.id === id );
            const newCoords = positionInReachableDistanceFromPoint(
                world, world.x, world.y, distance, getMaxWalkableTile()
            ) || {};
            console.warn( "character positioned", newCoords );
            commit( "updateCharacter", { ...character, ...newCoords });
        },
        /**
         * Run the game "AI". Non-queen Characters should walk towards you
         */
        updateCharacters({ getters, commit }) {
            const { activeEnvironment } = getters;
            const { x, y, characters }  = activeEnvironment;
            characters.forEach( character => {
                if ( character.type === QUEEN && !CharacterActions.isAggressive( character )) {
                    return;
                }
                // check if Character is within range of player
                if ( distance( character.x, character.y, x, y ) > 25 ) {
                    return;
                }
                // get existing movements so we can seemlessly update these to the new destination
                const existing = getters.effects.filter(({ target }) => target === character.id );
                // calculate the waypoints and enqueue the movements
                EnvironmentActions.moveCharacter({ commit, getters }, character, activeEnvironment, x, y, existing );
            });
        },
        cancelCharacterMovements({ state, commit }) {
            const { activeEnvironment } = state;
            commit( "removeEffectsByMutation", [ "setXPosition", "setYPosition" ]); // player movements
            activeEnvironment?.characters.forEach(({ id }) => {
                commit( "removeEffectsByTargetAndMutation", {
                    target: id, types: [ "setCharacterXPosition", "setCharacterYPosition" ]
                });
            });
        }
    }
};
