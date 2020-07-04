import { CAVE_TYPE, CAVE_TILES } from './cave-factory';
import { WORLD_TYPE, WORLD_TILES } from './world-factory';

export default
{
    /**
     * an Environment describes an area the player can
     * navigate through (e.g. derived Environments are the overground
     * world or Caves) an environment can also contain enemies, yikes!
     *
     * @param {number} x player x position
     * @param {number} y player y position
     * @param {number} width total tiles this Environment occupies in its width
     * @param {number} height total tiles this Environment occopies in its height
     * @param {Array<Object>=} enemies optional enemies in this Environment
     * @param {Array<number>=} terrain describing the Environment tile types
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

            case CAVE_TYPE:
                switch ( terrain ) {
                    case CAVE_TILES.GROUND:
                    case CAVE_TILES.TUNNEL:
                        return true;

                    default:
                    case CAVE_TILES.NOTHING:
                    case CAVE_TILES.WALL:
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
    }
};
