import { describe, it, expect } from "vitest";
import EnvironmentFactory from "@/model/factories/environment-factory";
import ItemFactory from "@/model/factories/item-factory";

describe( "Environment factory", () => {
    // note environment items here also contain coordinates to indicate their position
    const items = [{ x: 2, y: 2, width: 10, height: 5, ...ItemFactory.create() }];

    it( "should be able to create an Environment structure", () => {
        const x = 3, y = 5, width = 10, height = 20, id = "foo";
        const characters = [{ foo: "bar" }];
        const terrain = [ 0, 1, 2, 3 ];

        const environment = EnvironmentFactory.create({ x, y, width, height, characters, terrain, items, id });

        expect( environment.id ).toEqual( id );
        expect( environment.x ).toEqual( x );
        expect( environment.y ).toEqual( y );
        expect( environment.width ).toEqual( width );
        expect( environment.height ).toEqual( height );
        expect( environment.characters ).toEqual( characters );
        expect( environment.items ).toEqual( items );
        expect( environment.terrain ).toEqual( terrain );
    });

    it( "should be able to assemble and disassemble a serialized Environment without loss of data", () => {
        const environment = EnvironmentFactory.create({ x: 12, y: 7, items });
        const disassembled = EnvironmentFactory.disassemble( environment );
        expect( EnvironmentFactory.assemble( disassembled )).toEqual( environment );
    });
});
