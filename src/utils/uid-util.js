const START_TIME = Date.now(); // application start time
let GENERATED = 0;             // amount of generated instances

export const getUid = () => {
    ++GENERATED;
    return `${START_TIME}_${GENERATED}`;
};
