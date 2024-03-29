import { describe, it, expect, beforeEach } from "vitest";
import { prepareAttack, getDamageForAttack } from "@/model/factories/attack-factory";
import CharacterFactory  from "@/model/factories/character-factory";
import InventoryFactory  from "@/model/factories/inventory-factory";
import AttackTypes, { ATTACK_PREPARED } from "@/definitions/attack-types";
import { QUEEN, DRAGON } from "@/definitions/character-types";
import { SHOE_HEELS }    from "@/definitions/item-types";

describe( "Attack factory", () => {
    describe( "when preparing an attack", () => {
        const character = CharacterFactory.create();
        const opponent  = CharacterFactory.create();

        it( "should return the prepared state for unintoxicated and unboosted characters", () => {
            expect( prepareAttack( character, opponent )).toBe( ATTACK_PREPARED );
        });

        // how test random results ?
    });

    describe( "when a Queen attacks", () => {
        let opponent, character;

        beforeEach(() => {
            opponent  = CharacterFactory.create({ type: DRAGON });
            character = CharacterFactory.create({ type: QUEEN });
        });

        it( "should be able to perform a slap where the attack damage equals the player level", () => {
            character.level = 1;
            let damage = getDamageForAttack( character, opponent, AttackTypes.SLAP );
            expect( damage ).toBe( 1 );

            character.level = 2;
            damage = getDamageForAttack( character, opponent, AttackTypes.SLAP );
            expect( damage ).toBe( 2 );
        });

        it( "should be able to perform a kick where the attack damage equals double the player level", () => {
            character.level = 1;
            let damage = getDamageForAttack( character, opponent, AttackTypes.KICK );
            expect( damage ).toBe( 2 );

            character.level = 2;
            damage = getDamageForAttack( character, opponent, AttackTypes.KICK );
            expect( damage ).toBe( 4 );
        });

        it( "should perform a stronger kick when the inventory contains the high heels item", () => {
            character.level = 1;
            character.inventory = InventoryFactory.create( 0, [{ name: SHOE_HEELS }]);
            let damage = getDamageForAttack( character, opponent, AttackTypes.KICK );
            expect( damage ).toBe( 5 );

            character.level = 2;
            damage = getDamageForAttack( character, opponent, AttackTypes.KICK );
            expect( damage ).toBe( 10 );
        });

        it( "should perform a stronger attack when the player is boosted", () => {
            let damage = getDamageForAttack( character, opponent, AttackTypes.SLAP );
            expect( damage ).toBe( 1 );

            character.properties.boost = 1;

            damage = getDamageForAttack( character, opponent, AttackTypes.SLAP );
            expect( damage ).toBe( 2 );
        });
    });
});
