import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    esbuildOptions: {
      keepNames: true,
      pure: [],
    },
    rollupOptions: {
      treeshake: false,
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
