let oldMode = '';
let previousGroup = -1;

export const resetMemory = (mode) => {
  if (mode !== oldMode) {
    oldMode = mode;
    previousGroup = -1;
    return true;
  }
  return false;
};

export const setGroup = (group) => {
  previousGroup = group;
};

export const getGroup = () => previousGroup;
