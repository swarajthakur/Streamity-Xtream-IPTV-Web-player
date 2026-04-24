export const getEpg = (epg, id) => {
  const found =
    id && epg && epg.find((x) => id === x.id && x.start <= Date.now() && x.end > Date.now());
  return found || { start: undefined };
};
