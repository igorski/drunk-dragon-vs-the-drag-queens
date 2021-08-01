import LZString         from "lz-string";
import BuildingFactory  from "./building-factory";
import CharacterFactory from "./character-factory";
import EffectFactory    from "./effect-factory";
import WorldFactory     from "./world-factory";

export default
{
    /**
     * disassemble the state of the models into a
     * LZ compressed JSON String
     *
     * @param {Object} game state
     * @param {Object} player state
     * @param {Object} world state
     * @param {Object=} building optional entered building state
     * @return {string} compressed JSON String
     */
    disassemble( game, player, world, building ) {
        const out = {
            h: game.hash,
            c: game.created,
            m: game.modified,
            gs: game.gameStart,
            gt: game.gameTime,
            p: CharacterFactory.disassemble( player ),
            w: WorldFactory.disassemble( world, game.hash ),
            b: building ? BuildingFactory.disassemble( building ) : null,
            e: game.effects ? game.effects.map( e => EffectFactory.disassemble( e )) : [],
        };
        const json = JSON.stringify( out );
        try {
            const compressed = LZString.compressToUTF16( json );
            if ( process.env.NODE_ENV === "development" ) {
                console.log(
                    `Compressed ${json.length} to ${compressed.length}
                    (${(( compressed.length / json.length ) * 100 ).toFixed( 2 )}% of original size)`
                );
            }
            return compressed;
        }
        catch ( e ) {
            return json;
        }
    },

    /**
     * assemble a LZ compressed JSON String
     * back into model structure and instances
     *
     * @param {string} encodedData compressed JSON String
     * @return {Object|null}
     */
    assemble( encodedData ) {
        let data;
        try {
            data = JSON.parse( LZString.decompressFromUTF16( encodedData ));
        } catch ( e ) {
            return null;
        }

        if ( !data || typeof data.h !== "string" ) {
            return null;
        }
        const game = {
            hash: data.h,
            created: data.c,
            modified: data.m,
            gameStart: data.gs,
            gameTime: data.gt,
            effects: data.e.map( e => EffectFactory.assemble( e )),
        };
        return {
            game,
            world: WorldFactory.assemble( data.w, data.h ),
            building: data.b ? BuildingFactory.assemble( data.b ) : null,
            player: CharacterFactory.assemble( data.p )
        };
    }
};
