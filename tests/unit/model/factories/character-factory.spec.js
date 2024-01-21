import { describe, it, expect } from "vitest";
import { DRAGON } from "@/definitions/character-types";
import CharacterFactory  from "@/model/factories/character-factory";
import IntentFactory     from "@/model/factories/intent-factory";
import InventoryFactory  from "@/model/factories/inventory-factory";

describe("Character factory", () => {
    describe("when creating a character structure", () => {
        it("should throw when an invalid property configuration is passed", () => {
            const properties = {
                intoxication: 2, // out of range value, so should be invalid
            };
            expect(() => CharacterFactory.create({ x: 0, y: 0 }, {}, properties )).toThrow();
        });

        it("should leave all construction arguments unchanged", () => {
            const appearance = {
                name: "Duul",
                skin: "#00FF00",
                eyes: 3,
                hair: 2,
                jewelry: 1,
                clothes: 0,
                mouth: 1,
                nose: 0,
            };
            const properties = {
                speed: 0.5,
                intoxication: 0.4,
                boost: 0.3,
                intent: IntentFactory.create()
            };
            const id = "fooBar";
            const x = 11;
            const y = 12;
            const level = 3;
            const xp = 500;
            const hp = 12;
            const maxHp = 20;
            const type = DRAGON;
            const inventory = InventoryFactory.create();

            const char = CharacterFactory.create({ id, x, y, level, hp, xp, maxHp, type }, appearance, properties, inventory );

            expect( char.id ).toEqual( id );
            expect( char.type ).toEqual( type );
            expect( char.x ).toEqual( x );
            expect( char.y ).toEqual( y );
            expect( char.level ).toEqual( level );
            expect( char.hp ).toEqual( hp );
            expect( char.maxHp ).toEqual( maxHp );
            expect( char.xp ).toEqual( xp );
            expect( char.appearance ).toEqual( appearance );
            expect( char.properties ).toEqual( properties );
            expect( char.inventory ).toEqual( inventory );
        });
    });

    it("should be able to assemble and disassemble a serialized character without loss of data", () => {
        const character = CharacterFactory.create({ id: "bazQux", x: 15, y: 20, level: 10, xp: 1200, type: DRAGON }, { name: "Billy" });
        const { appearance, properties, inventory } = character;
        properties.speed = .7;
        properties.intent = IntentFactory.create();
        properties.intoxication = .3;
        properties.boost = .2;

        const disassembled = CharacterFactory.disassemble( character );
        expect( CharacterFactory.assemble( disassembled )).toEqual( character );
    });
});
