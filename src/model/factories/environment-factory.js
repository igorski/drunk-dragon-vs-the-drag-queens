import { BUILDING_TYPE, BUILDING_TILES } from './building-factory';
import { WORLD_TYPE, WORLD_TILES } from './world-factory';

export default
{
    /**
     * an Environment describes an area the player can
     * navigate through (e.g. derived Environments are the overground
     * world or buildings) an environment can also contain enemies, yikes!
     *
     * @param {Number} x player x position within the environment
     * @param {Number} y player y position within the environment
     * @param {Number} width total tiles this Environment occupies in its width
     * @param {Number} height total tiles this Environment occopies in its height
     * @param {Array<Object>=} enemies optional enemies in this Environment
     * @param {Array<Number>=} terrain describing the Environment tile types
     */
    create( x = 0, y = 0, width = 0, height = 0, enemies = [], terrain = [] ) {
        return { x, y, width, height, enemies, terrain };
    },

    /**
     * Whether tile at given coordinates is free
     *
     * @param {Object} environment
     * @param {number} x
     * @param {number} y
     */
    isPositionFree( environment, x, y ) {
        if ( !environment.terrain ) {
            return false;  // likely still generating for the active level / depth
        }
        const terrain = environment.terrain[ y * environment.width + x ];

        switch ( environment.type )
        {
            default:
                throw new Error(`Cannot determine positioning for unknown environment type "${environment.type}"`);
                break;

            case BUILDING_TYPE:
                switch ( terrain ) {
                    case BUILDING_TILES.GROUND:
                    case BUILDING_TILES.STAIRS:
                        return true;

                    default:
                    case BUILDING_TILES.NOTHING:
                    case BUILDING_TILES.WALL:
                        return false;
                }
                break;

            case WORLD_TYPE:
                switch ( terrain ) {
                    default:
                    case WORLD_TILES.GRASS:
                    case WORLD_TILES.SAND:
                        return true;

                    case WORLD_TILES.WATER:
                    case WORLD_TILES.MOUNTAIN:
                    case WORLD_TILES.TREE:
                        return false;
                }
                break;
        }
    },
};
