import { CAVE_TYPE }  from '@/model/factories/cave-factory';
import { WORLD_TYPE } from '@/model/factories/world-factory';

export default {
    /**
     * @param {Object} environment environment to traverse
     * @param {Function} dispatch Vuex store dispatch
     * @return {boolean} whether we've hit something
     */
    hitTest( environment, dispatch ) {
        const { enemies, shops, caves, x, y } = environment;
        let hit;

        if ( hit = internalHitTest( x, y, enemies )) {
            // hit an enemy, start battle !!
            console.warn("HIT AN ENEMY!");
        } else if ( environment.type === WORLD_TYPE ) {
            if ( hit = internalHitTest( x, y, shops )) {
                // entered shop, open the shop page
                dispatch('enterShop', hit );
            }
            else if ( hit = internalHitTest( x, y, caves )) {
                // entered cave
                dispatch('enterCave', hit );
            }
        } else if ( environment.type === CAVE_TYPE ) {
            const caveLevel = environment.levels[ environment.level ];
            if ( hit = internalHitTest( x, y, caveLevel.exits )) {
                dispatch('enterCaveTunnel', hit );
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
