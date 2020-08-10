import { BUILDING_TYPE }  from '@/model/factories/building-factory';
import { WORLD_TYPE } from '@/model/factories/world-factory';

export default {
    /**
     * @param {Object} Vuex store getters, commit and dispatch methods
     * @param {Object} environment environment to traverse
     * @return {boolean} whether we've hit something
     */
    hitTest({ dispatch, commit, getters }, environment ) {
        const { characters, shops, buildings, x, y } = environment;
        let hit, dispatchFn, dispatchValue;

        if ( hit = internalHitTest( x, y, characters )) {
            // hit an character, do something!!!
            dispatchFn = 'interactWithCharacter';
        } else if ( environment.type === WORLD_TYPE ) {
            if ( hit = internalHitTest( x, y, shops )) {
                // entered shop, open the shop page
                dispatchFn = 'enterShop';
            }
            else if ( hit = internalHitTest( x, y, buildings )) {
                // entered building
                dispatchFn = 'enterBuilding';
            }
        } else if ( environment.type === BUILDING_TYPE ) {
            if ( hit = internalHitTest( x, y, environment.exits )) {
                dispatchFn = 'changeFloor';
                dispatchValue = getters.floor + 1;
            }
        }
        if ( hit ) {
            // here we ensures that when we're done with the action (e.g. leaving
            // a building) we don't collide with the same object (re-entering the building again)
            commit( 'setYPosition', y + 1 );
            // dispatch after updating position (otherwise y is changed for new environment)
            dispatch( dispatchFn, dispatchValue ?? hit );
        }
        return hit !== null;
    },
};

function internalHitTest( x, y, collection = [] ) {
    let i = collection.length;
    while ( i-- ) {
        const compare = collection[ i ];
        if ( compare.x === x && compare.y === y ) {
            return compare;
        }
    }
    return null;
}
