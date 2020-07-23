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
};
