import Random from 'random-seed';

const rand = Random.create();

export const randomFromList = list => list[ rand.intBetween( 0, list.length - 1 )];
export const randomBool     = () => rand.intBetween( 0, 1 ) === 1;
