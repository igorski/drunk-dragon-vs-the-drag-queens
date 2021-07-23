import { getDamageForAttack } from "@/model/factories/attack-factory";
import CharacterFactory  from "@/model/factories/character-factory";
import InventoryFactory  from "@/model/factories/inventory-factory";
import AttackTypes       from "@/definitions/attack-types";
import { QUEEN, DRAGON } from "@/definitions/character-types";
import { SHOE_HEELS }    from "@/definitions/item-types";

describe( "Attack factory", () => {
    describe( "When a Queen attacks", () => {
        const opponent = CharacterFactory.create({ type: DRAGON });
        const character = CharacterFactory.create({ type: QUEEN });

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
    });
});
