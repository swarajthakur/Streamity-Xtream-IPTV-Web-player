/**
 * Zustand-backed compatibility shim for react-redux. All legacy components
 * continue to import `useSelector` / `useDispatch` from 'react-redux' — Vite
 * aliases that specifier to this file (see vite.config.ts).
 *
 * As components migrate to Tailwind/shadcn in Phases 4-6, they should switch
 * to importing `useUiStore` directly. Once no component imports from
 * 'react-redux' anymore, delete the Vite alias and this file.
 */
import { useRef, useSyncExternalStore, type ReactNode } from 'react';
import { create } from 'zustand';
import Cookies from 'js-cookie';

// Action creators in src/actions/*.js return { type: string; payload: ... }
// with plain string literals (not string literal types), so we keep this
// loose and switch on string below.
type Action = { type: string; payload?: any };

export interface LegacyState {
  playingCh: any;
  timer60: number;
  timer5: number;
  h24: string;
  epgPopup: any;
  groupsList: any[];
  playlist: any[];
  playlistEpisodes: any[];
  fullScreen: any;
  volume: number;
}

type StoreShape = LegacyState & { dispatch: (a: Action) => void };

export const useUiStore = create<StoreShape>((set, get) => ({
  playingCh: null,
  timer60: Date.now(),
  timer5: Date.now(),
  h24: Cookies.get('h24') || 'HH:MM',
  epgPopup: null,
  groupsList: [],
  playlist: [],
  playlistEpisodes: [],
  fullScreen: '',
  volume: 50,

  dispatch: (action) => {
    set((s) => {
      switch (action.type) {
        case 'SET_EPG_POPUP':
          return { epgPopup: action.payload };
        case 'SET_FULLSCREEN':
          return { fullScreen: action.payload };
        case 'SET_GROUP':
          return { groupsList: action.payload };
        case 'SET_H24':
          Cookies.set('h24', action.payload, { expires: 365 });
          return { h24: action.payload };
        case 'SET_CHANNEL':
          return { playingCh: { ...(action.payload as object) } };
        case 'SET_PLAYLIST_EPISODES':
          return { playlistEpisodes: action.payload };
        case 'SET_PLAYLIST':
          return { playlist: action.payload };
        case 'SET_TIMER_5':
          return action.payload - s.timer5 > 1000 ? { timer5: action.payload } : {};
        case 'SET_TIMER_60':
          return action.payload - s.timer60 > 5000 ? { timer60: action.payload } : {};
        case 'SET_VOLUME': {
          let v = s.volume + (action.payload as number);
          if ((s.volume >= 100 && v >= 100) || (s.volume <= 0 && v <= 0)) return {};
          if (v > 100) v = 100;
          if (v < 0) v = 0;
          return { volume: v };
        }
      }
      return {};
    });
  },
}));

// react-redux drop-in shim. Legacy selectors frequently construct new
// objects inline (e.g. `s => s.playingCh || { disabled: true }`). Plain
// Zustand would re-evaluate on every render and each call returns a new
// reference, tripping React's "getSnapshot should be cached" guard and
// causing an infinite loop. Cache the result per state-reference so the
// selector only runs when the store actually changes.
export function useSelector<T>(selector: (state: LegacyState) => T): T {
  const memo = useRef<{ state?: StoreShape; selected?: T }>({});
  const api = useUiStore;
  const getSnapshot = () => {
    const state = api.getState();
    if (memo.current.state === state && 'selected' in memo.current) {
      return memo.current.selected as T;
    }
    const selected = selector(state);
    memo.current = { state, selected };
    return selected;
  };
  return useSyncExternalStore(api.subscribe, getSnapshot, getSnapshot);
}

export function useDispatch() {
  return useUiStore.getState().dispatch;
}

// No-op Provider so existing `<Provider store={...}>` wrappers (if any) don't break.
export function Provider({ children }: { store?: unknown; children: ReactNode }) {
  return children as any;
}
