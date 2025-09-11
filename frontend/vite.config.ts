// FIX: Removed the triple-slash directive which was causing a "Cannot find type definition file for 'vitest'" error. The import from 'vitest/config' is sufficient for typing the configuration object.
// FIX: Import `defineConfig` from `vitest/config` to include type definitions for the `test` property.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: __dirname is not available in ES modules. Resolve from the project root instead.
      '@': path.resolve('./src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  }
})