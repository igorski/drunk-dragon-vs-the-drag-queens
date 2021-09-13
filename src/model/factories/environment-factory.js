import CharacterFactory from "@/model/factories/character-factory";
import ItemFactory      from "@/model/factories/item-factory";
import { getUid }       from "@/utils/uid-util";

export default
{
    /**
     * an Environment describes an area the player can
     * navigate through (e.g. derived Environments are the overground
     * world or buildings) an environment can also contain characters
     *
     * @param {Number} x player x position within the environment
     * @param {Number} y player y position within the environment
     * @param {Number} width total tiles this Environment occupies in its width
     * @param {Number} height total tiles this Environment occopies in its height
     * @param {Array<Object>=} characters optional characters in this Environment
     * @param {Array<Number>=} terrain describing the Environment tile types
     */
    create({ x = 0, y = 0, width = 0, height = 0, id = getUid(), characters = [], items = [], terrain = [] } = {}) {
        return {
            x, y, width, height, id,
            characters,
            items,
            terrain,
            visitedTerrain: [],
            type: "DEFAULT", // to be extended in inheriting factories
        };
    },

    /**
     * assemble a serialized JSON structure
     * back into an environment structure
     */
    assemble( data ) {
        return {
            id              : data.id,
            x               : data.x,
            y               : data.y,
            width           : data.w,
            height          : data.h,
            characters      : data.c.map( c => CharacterFactory.assemble( c )),
            items           : data.ims.map( i => ({
                x      : i.x,
                y      : i.y,
                width  : i.w,
                height : i.h,
                ...ItemFactory.assemble( i )
            })),
            terrain         : data.t,
            visitedTerrain  : data.v,
            type            : data.ty,
        };
    },

    /**
     * serializes an environment structure into a JSON structure
     */
     disassemble( environment ) {
         return {
             x:   environment.x,
             y:   environment.y,
             w:   environment.width,
             h:   environment.height,
             c:   environment.characters.map( c => CharacterFactory.disassemble( c )),
             ims: environment.items.map( i => ({
                 ...ItemFactory.disassemble( i ),
                 x: i.x,
                 y: i.y,
                 w: i.width,
                 h: i.height,
             })),
             t:   environment.terrain,
             v:   environment.visitedTerrain,
             ty:  environment.type,
             id:  environment.id
         };
     }
};
