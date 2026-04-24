/// <reference types="vite/client" />

declare global {
  interface Window {
    playername?: string;
    dns?: string;
    cors?: boolean;
    https?: boolean;
    tmdb?: string;
    __REDUX_DEVTOOLS_EXTENSION__?: () => unknown;
  }
}

export {};
