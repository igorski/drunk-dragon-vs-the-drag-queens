import { validateAppearance, validateProperties, validateInventory } from '@/model/validator';

describe('Validator', () => {
    describe('Character appearance', () => {
        it('should validate sex', () => {
            expect(() => validateAppearance({ sex: 'M' })).not.toThrow();
            expect(() => validateAppearance({ sex: 'F' })).not.toThrow();
            expect(() => validateAppearance({ sex: 'x' })).toThrow();
        });
    });

    describe('Character properties', () => {
        it('should validate all percentile ranges', () => {
            const intoxication = 1;
            const boost = 1;
            expect(() => validateProperties({ speed: -1, intoxication, boost })).toThrow();
            expect(() => validateProperties({ speed: 1.1, intoxication, boost })).toThrow();
            expect(() => validateProperties({ speed: 0, intoxication, boost })).not.toThrow();
            expect(() => validateProperties({ speed: 1, intoxication, boost })).not.toThrow();
        });
    });

    describe('Character inventory', () => {
        it('should validate cash', () => {
            const jewelry = []; // valid jewelry
            expect(() => validateInventory({ cash: 'A', jewelry })).toThrow();
            expect(() => validateInventory({ cash: 100, jewelry })).not.toThrow();
            expect(() => validateInventory({ cash: -100, jewelry })).not.toThrow(); // debt is fine
        });

        it('should validate jewelry', () => {
            const cash = 10; // valid money
            expect(() => validateInventory({ cash, jewelry: 'A' })).toThrow();
            expect(() => validateInventory({ cash, jewelry: [] })).not.toThrow();
        })
    });
});
