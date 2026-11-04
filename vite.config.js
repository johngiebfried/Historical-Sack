import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * One site, several pages: the landing page, the student page (play.html),
 * and in phase 3 the instructor console (gm.html).
 *
 * GitHub Pages serves a project site from /<repo>/, so the workflow passes
 * VITE_BASE; local dev keeps the root.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: 'index.html', play: 'play.html' },
    },
  },
})
