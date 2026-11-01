/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Where the site lives. Root ('/') locally and on a custom domain (www.nompongfamily.xxx).
// CI sets BASE_PATH=/nompongfamily/ only while the site is still on bankbab1.github.io/nompongfamily/.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  // Dev port: 5210 by default, or PORT when a tool assigns one (e.g. a second preview).
  // host: true also listens on the local network, so a phone on the same Wi-Fi can open
  // http://<this PC's IP>:5210/ (Vite prints the address on start).
  server: {
    host: true,
    port: Number(process.env.PORT) || 5210,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // The mock adapter + seed + Zod ship in the entry chunk (the session check needs them on
    // first paint). Pages are lazy chunks. Revisit once the real API adapter replaces the mock.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'threads',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
