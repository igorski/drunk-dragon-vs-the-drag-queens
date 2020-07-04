import CaveFactory from './cave-factory';
import CharacterFactory from './character-factory';
import WorldFactory from './world-factory';

export default
{
    /**
     * disassemble the state of the models into a base64-
     * encoded stringified JSON Object
     *
     * @param {Object} game state
     * @return {string} base64 encoded JSON Object
     */
    disassemble( game ) {
        const out = {
            h: game.hash,
            c: game.created,
            m: game.modified,
            gs: game.gameStart,
            gt: game.gameTime,
            p: CharacterFactory.disassemble( game.player ),
            w: WorldFactory.disassemble( game.world, game.hash ),
            ca: game.cave ? CaveFactory.disassemble( game.cave ) : null,
        };
        return window.btoa( JSON.stringify( out ));
    },

    /**
     * assemble a base64 stringified JSON Object
     * back into model structure and instances
     *
     * @param {string} encodedData base64 encoded JSON String
     * @return {Object|null}
     */
    assemble( encodedData ) {
        let data;
        try {
            data = JSON.parse( window.atob( encodedData ));
        } catch ( e ) {
            return null;
        }

        if ( !data || typeof data.h !== 'string' ) {
            return null;
        }
        const game = {
            hash: data.h,
            created: data.c,
            modified: data.m,
            gameStart: data.gs,
            gameTime: data.gt,
            gameActive: true,
            player: CharacterFactory.assemble( data.p ),
            world: WorldFactory.assemble( data.w, data.h ),
            cave: data.ca ? CaveFactory.assemble( data.ca ) : null,
        };
        return game;
    }
};
