import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@localfirst/mesh-sync': path.resolve(__dirname, '../../packages/mesh-sync/src/index.ts')
    }
  },
  server: {
    port: 5173
  }
});
