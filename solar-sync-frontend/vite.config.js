import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure assets are referenced correctly
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for debugging
  },
}); 