import Character from '@/model/character';
import Inventory from '@/model/inventory';

describe('Character', () => {
    describe('configuration', () => {
        it('should throw when an invalid appearance is passed', () => {
            const appearance = {
                sex: 'yes', // invalid sex, so should be invalid
            };
            expect(() => new Character( appearance )).toThrow();
        });

        it('should throw when an invalid property configuration is passed', () => {
            const properties = {
                speed: 2, // out of range value, so should be invalid
            };
            expect(() => new Character( {}, properties )).toThrow();
        });

        it('should leave all construction arguments unchanged', () => {
            const appearance = {
                sex: 'M',
                name: 'Duul',
            };
            const properties = {
                speed: 0.5,
                intoxication: 0.4,
                boost: 0.3
            };
            const inventory = new Inventory();
            const char = new Character( appearance, properties, inventory );
            expect( char.appearance ).toEqual( appearance );
            expect( char.properties ).toEqual( properties );
            expect( char.inventory ).toEqual( inventory );
        });

        it('should be able to update an existing property configuration', () => {
            const properties = {
                speed: 1,
                intoxication: 0,
                boost: 0,
            };
            const char = new Character( {}, properties );
            const newConfig = {
                speed: 0.5,
                intoxication: 0.9,
                boost: 1
            };
            char.updateProperties(newConfig );
            expect( char.properties.speed ).toEqual( newConfig.speed );
            expect( char.properties.intoxication ).toEqual( newConfig.intoxication );
            expect( char.properties.boost ).toEqual( newConfig.boost );
        });
    });

    describe('getters', () => {
        describe('speed', () => {
            const speed = 0.75;

            it('without modifiers, it should return the same value as specified in the constructor', () => {
                const char = new Character( {}, { speed });
                expect( char.getSpeed()).toEqual( speed );
            });

            it('should reduce speed when intoxicated', () => {
                const intoxication = 0.5;
                const char = new Character( {}, { speed, intoxication });
                expect( char.getSpeed()).toEqual( 0.25 );
            });

            it('should increase speed when boosted', () => {
                const boost = 0.5;
                const char = new Character( {}, { speed, boost });
                expect( char.getSpeed()).toEqual( 1.25 );
            });

            it('should combine boost and intoxication as a cumulative effect', () => {
                const intoxication = 0.2;
                const boost = 0.5;
                const char = new Character( {}, { speed, intoxication, boost });
                expect( char.getSpeed()).toEqual( 1.05 );
            });
        });

        describe('charisma', () => {
            it('should by default hold women in higher esteem than men', () => {
                const male = new Character({ sex: 'M' });
                const female = new Character({ sex: 'F' });
                expect( female.getCharisma() > male.getCharisma() );
            });

            describe('the effects of alcohol', () => {
                it('should consider a lightly intoxicated person as more attractive', () => {
                    const char = new Character( {}, { intoxication: 0 });
                    const baseCharisma = char.getCharisma();

                    char.updateProperties({ intoxication: 0.5 });
                    expect( char.getCharisma() > baseCharisma );
                });

                it('should consider a highly intoxicated person as less attractive', () => {
                    const char = new Character( {}, { intoxication: 0 });
                    const baseCharisma = char.getCharisma();

                    char.updateProperties({ intoxication: .9 });
                    expect( char.getCharisma() < baseCharisma );
                });

                it('should consider a massively intoxicated person as unattractive', () => {
                    const char = new Character( {}, { intoxication: 1 });
                    expect( char.getCharisma() === 0 );
                });

                it('should not consider a massively intoxicated person as unattractive when compared to an equally intoxicated Character', () => {
                    const char = new Character( {}, { intoxication: 0 });
                    expect( char.getCharisma( new Character( {}, { intoxication: 1 })) === 1 );
                });
            });

            describe('the effects of drugs', () => {
                it('should consider a lightly coked up person as more attractive', () => {
                    const char = new Character( {}, { boost: 0 });
                    const baseCharisma = char.getCharisma();

                    char.updateProperties({ boost: 0.5 });
                    expect( char.getCharisma() > baseCharisma );
                });

                it('should consider a highly coked up person as less attractive', () => {
                    const char = new Character( {}, { boost: 0 });
                    const baseCharisma = char.getCharisma();

                    char.updateProperties({ boost: .9 });
                    expect( char.getCharisma() < baseCharisma );
                });

                it('should consider a massively coked up person as unattractive', () => {
                    const char = new Character( {}, { boost: 1 });
                    expect( char.getCharisma() === 0 );
                });
            });

            describe('the cumulative effects of recreational concoctions', () => {
                it('should add up different types of buzz to your charisma', () => {
                    const char = new Character( {}, { intoxication: 0, boost: 0 });
                    char.updateProperties({ intoxication: .4 });
                    expect( char.getCharisma() ).toEqual( 0.45 );
                    char.updateProperties({ boost: .2 });
                    expect( char.getCharisma()).toEqual( 0.55 );
                });

                it('should have a single excess cancel out all positive effect on your charisma', () => {
                    const char = new Character( {}, { intoxication: 1, boost: 1 });
                    expect( char.getCharisma() ).toEqual( 0 );
                });
            });
        });
    });
});
