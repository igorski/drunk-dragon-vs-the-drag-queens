import { BUILDING_TYPE }  from '@/model/factories/building-factory';
import { WORLD_TYPE } from '@/model/factories/world-factory';

export default {
    /**
     * @param {Object} environment environment to traverse
     * @param {Function} dispatch Vuex store dispatch
     * @return {boolean} whether we've hit something
     */
    hitTest( environment, dispatch ) {
        const { enemies, shops, buildings, x, y } = environment;
        let hit;

        if ( hit = internalHitTest( x, y, enemies )) {
            // hit an enemy, start battle !!
            console.warn("HIT AN ENEMY!");
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
                dispatch('changeFloor', hit );
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
