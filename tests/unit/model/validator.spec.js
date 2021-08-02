import { validateProperties, validateInventory } from "@/model/validator";

describe( "Validator", () => {
    describe( "Character properties", () => {
        it( "should validate the percentile range properties", () => {
            const boost = 1;
            expect(() => validateProperties({ intoxication: 1.1, boost, speed: 1 })).toThrow();
            expect(() => validateProperties({ intoxication: -1, boost, speed: 1 })).toThrow();
            expect(() => validateProperties({ intoxication: 0, boost, speed: 1 })).not.toThrow();
            expect(() => validateProperties({ intoxication: 1, boost, speed: 1 })).not.toThrow();
        });

        it( "should validate speed to be positive", () => {
            const intoxication = 1;
            const boost = 1;
            expect(() => validateProperties({ speed: -1, intoxication, boost })).toThrow();
            expect(() => validateProperties({ speed: 0.1, intoxication, boost })).not.toThrow();
        })
    });

    describe( "Inventory", () => {
        it( "should validate cash", () => {
            const items = []; // valid items
            expect(() => validateInventory({ cash: "A", items })).toThrow();
            expect(() => validateInventory({ cash: 100, items })).not.toThrow();
            expect(() => validateInventory({ cash: -100, items })).not.toThrow(); // debt is fine
        });

        it( "should validate items", () => {
            const cash = 10; // valid money
            expect(() => validateInventory({ cash, items: "A" })).toThrow();
            expect(() => validateInventory({ cash, items: [] })).not.toThrow();
        })
    });
});
