function sleep(delayInms) {
  return new Promise((resolve) => setTimeout(() => resolve(2), delayInms));
}

export const delay = sleep;
export { sleep };
