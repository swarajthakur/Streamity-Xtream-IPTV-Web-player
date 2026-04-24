export const convertRemToPixels = (rem) =>
  rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

export const convertVhToPixels = (value) => {
  const parts = value.match(/([0-9\.]+)(vh|vw)/);
  const q = Number(parts[1]);
  const side = window[['innerHeight', 'innerWidth'][['vh', 'vw'].indexOf(parts[2])]];
  return side * (q / 100);
};
