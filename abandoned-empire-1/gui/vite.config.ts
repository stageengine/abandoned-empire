import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    outDir: '../gui-dist',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,

    copyPublicDir: true,

    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'AbandonedEmpireGui',
      fileName: () => 'script.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'style.css',
      },
    },
  },
});
