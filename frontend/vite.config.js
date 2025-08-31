import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  // If you want to use @ imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})