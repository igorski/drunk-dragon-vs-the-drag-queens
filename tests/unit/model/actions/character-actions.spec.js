import CharacterActions from '@/model/actions/character-actions';
import CharacterFactory from '@/model/factories/character-factory';

describe('Character actions', () => {
    const x = 5;
    const y = 10;

    describe('getters', () => {
        describe('speed', () => {
            const speed = 0.75;

            it('without modifiers, it should return the same value as specified in the constructor', () => {
                const character = CharacterFactory.create({ x, y }, {}, { speed });
                expect( CharacterActions.getSpeed( character )).toEqual( speed );
            });

            it('should reduce speed when intoxicated', () => {
                const intoxication = 0.5;
                const character = CharacterFactory.create({ x, y }, {}, { speed, intoxication });
                expect( CharacterActions.getSpeed( character )).toEqual( 0.25 );
            });

            it('should increase speed when boosted', () => {
                const boost = 0.5;
                const character = CharacterFactory.create({ x, y }, {}, { speed, boost });
                expect( CharacterActions.getSpeed( character )).toEqual( 1.25 );
            });

            it('should combine boost and intoxication as a cumulative effect', () => {
                const intoxication = 0.2;
                const boost = 0.5;
                const character = CharacterFactory.create({ x, y }, {}, { speed, intoxication, boost });
                expect( CharacterActions.getSpeed( character )).toEqual( 1.05 );
            });
        });

        describe('charisma', () => {
            describe('the effects of alcohol', () => {
                it('should consider a lightly intoxicated person as more attractive', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { intoxication: 0 });
                    const baseCharisma = CharacterActions.getCharisma( character );

                    CharacterActions.updateProperties( character, { intoxication: 0.5 });
                    expect( CharacterActions.getCharisma( character ) > baseCharisma );
                });

                it('should consider a highly intoxicated person as less attractive', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { intoxication: 0 });
                    const baseCharisma = CharacterActions.getCharisma( character );

                    CharacterActions.updateProperties( character, { intoxication: .9 });
                    expect( CharacterActions.getCharisma( character ) < baseCharisma );
                });

                it('should consider a massively intoxicated person as unattractive', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { intoxication: 1 });
                    expect( CharacterActions.getCharisma( character ) === 0 );
                });

                it('should not consider a massively intoxicated person as unattractive when compared to an equally intoxicated Character', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { intoxication: 0 });
                    expect( CharacterActions.getCharisma( character, CharacterFactory.create( {}, { intoxication: 1 })) === 1 );
                });
            });

            describe('the effects of drugs', () => {
                it('should consider a lightly coked up person as more attractive', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { boost: 0 });
                    const baseCharisma = CharacterActions.getCharisma( character );

                    CharacterActions.updateProperties( character, { boost: 0.5 });
                    expect( CharacterActions.getCharisma( character ) > baseCharisma );
                });

                it('should consider a highly coked up person as less attractive', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { boost: 0 });
                    const baseCharisma = CharacterActions.getCharisma( character );

                    CharacterActions.updateProperties( character, { boost: .9 });
                    expect( CharacterActions.getCharisma( character ) < baseCharisma );
                });

                it('should consider a massively coked up person as unattractive', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { boost: 1 });
                    expect( CharacterActions.getCharisma( character ) === 0 );
                });
            });

            describe('the cumulative effects of recreational concoctions', () => {
                it('should add up different types of buzz to your charisma', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { intoxication: 0, boost: 0 });
                    CharacterActions.updateProperties( character, { intoxication: .4 });
                    expect( CharacterActions.getCharisma( character )).toEqual( 0.45 );
                    CharacterActions.updateProperties( character, { boost: .2 });
                    expect( CharacterActions.getCharisma( character )).toEqual( 0.55 );
                });

                it('should have a single excess cancel out all positive effect on your charisma', () => {
                    const character = CharacterFactory.create({ x, y }, {}, { intoxication: 1, boost: 1 });
                    expect( CharacterActions.getCharisma( character )).toEqual( 0 );
                });
            });
        });
    });

    describe('mutations', () => {
        it('should be able to update an existing property configuration', () => {
            const properties = {
                speed: 1,
                intoxication: 0,
                boost: 0,
            };
            const character = CharacterFactory.create({ x, y }, {}, properties );
            const newConfig = {
                speed: 0.5,
                intoxication: 0.9,
                boost: 1
            };
            CharacterActions.updateProperties( character, newConfig );
            expect( character.properties.speed ).toEqual( newConfig.speed );
            expect( character.properties.intoxication ).toEqual( newConfig.intoxication );
            expect( character.properties.boost ).toEqual( newConfig.boost );
        });
    });
});
