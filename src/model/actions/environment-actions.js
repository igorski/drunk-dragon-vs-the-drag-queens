import { BUILDING_TYPE }  from '@/model/factories/building-factory';
import { WORLD_TYPE } from '@/model/factories/world-factory';

export default {
    /**
     * @param {Object} Vuex store getters and dispatch methods
     * @param {Object} environment environment to traverse
     * @return {boolean} whether we've hit something
     */
    hitTest({ dispatch, getters }, environment ) {
        const { characters, shops, buildings, x, y } = environment;
        let hit;

        if ( hit = internalHitTest( x, y, characters )) {
            // hit an character, do something!!!
            console.warn("HIT AN CHARACTER!");
        } else if ( environment.type === WORLD_TYPE ) {
            if ( hit = internalHitTest( x, y, shops )) {
                // entered shop, open the shop page
                dispatch('enterShop', hit );
            }
            else if ( hit = internalHitTest( x, y, buildings )) {
                // entered building
                dispatch('enterBuilding', hit );
            }
        } else if ( environment.type === BUILDING_TYPE ) {
            if ( hit = internalHitTest( x, y, environment.exits )) {
                dispatch('changeFloor', getters.floor + 1 );
            }
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
