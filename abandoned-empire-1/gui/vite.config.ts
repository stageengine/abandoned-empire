import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This project's build output lands in ../gui-dist - the folder config.yaml's
// own `gui:` points Stage's build at, and which engine/build/gui.ts's
// readAssets walks whole into the built game. Vite's own defaults (hashed,
// chunked, code-split output plus a generated index.html full of
// <script type="module"> tags) are all wrong for that folder: assemble.ts
// inlines index.html's body verbatim, wraps style.css in a <style> tag and
// script.js in a single plain (non-module) <script> tag, and nothing here is
// ever served over HTTP for a module graph or hashed filename to resolve
// against. So this config forces library mode - one self-executing IIFE, one
// CSS file, both under fixed names - and copies public/index.html (hand-
// written, never Vite's own generated one) into the output verbatim.
export default defineConfig({
  plugins: [react()],

  // Vite's app builds replace `process.env.NODE_ENV` (and strip the dev-only
  // branches it guards, inside React itself included) automatically; library
  // mode does not, since it's meant to leave a consuming bundler to do that
  // later. There is no later bundler here - this script runs as-is, inlined
  // into a document with no Node `process` global at all - so left alone,
  // React's own bundled code throws `process is not defined` the moment it
  // reads that check, before anything ever renders.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    outDir: '../gui-dist',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,

    // Library mode defaults this to false (Vite only copies publicDir
    // automatically for its own app/html builds) - forced back on since
    // public/index.html is exactly the third fixed file this build needs to
    // produce, and nothing else touches it.
    copyPublicDir: true,

    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'AbandonedEmpireGui',
      fileName: () => 'script.js',
    },
    rollupOptions: {
      output: {
        // Library mode still names the CSS after build.lib.fileName's own
        // basename by default (script.css) - forced to style.css to match
        // what assemble.ts looks for by name.
        assetFileNames: 'style.css',
      },
    },
  },
});
