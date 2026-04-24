import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Local PHP dev server (if running): php -S localhost:8000 -t public
const PHP_DEV = process.env.PHP_DEV_URL || 'http://localhost:8000';

export default defineConfig({
  plugins: [
    react({
      // Legacy components still carry JSX inside .js files. Phase-out as they migrate to .tsx.
      include: /\.(js|jsx|ts|tsx)$/,
    }),
    tailwindcss(),
  ],
  // Legacy CRA convention — expose REACT_APP_* env vars alongside VITE_*.
  envPrefix: ['VITE_', 'REACT_APP_'],
  resolve: {
    // Prefer .tsx / .ts over .js so rebuilt components shadow any lingering
    // legacy shim file with the same basename.
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Legacy components import from 'react-redux'; route to Zustand shim.
      'react-redux': path.resolve(__dirname, 'src/store/legacy.ts'),
    },
  },
  esbuild: {
    loader: 'tsx',
    include: [/src\/.*\.[jt]sx?$/],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 3006,
    proxy: {
      '/proxy.php': PHP_DEV,
      '/tmdb.php': PHP_DEV,
      '/epg.php': PHP_DEV,
      '/epg-api.php': PHP_DEV,
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
});
