import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * One site, several pages. Phase 1 ships only the placeholder index; the
 * student page (play.html) arrives in phase 2 and the instructor console
 * (gm.html) in phase 3.
 *
 * GitHub Pages serves a project site from /<repo>/, so the workflow passes
 * VITE_BASE; local dev keeps the root.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: 'index.html' },
    },
  },
})
