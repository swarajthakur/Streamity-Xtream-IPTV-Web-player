let focused;
export const getFocus = () => focused;
export const setFocus = (el) => {
  focused = el;
};

export default { getFocus, setFocus };
