import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'webrtc-signaling-relay',
      configureServer(server) {
        server.ws.on('mesh:signal', (data, client) => {
          server.ws.clients.forEach((c) => {
            if (c !== client) {
              c.send({ type: 'custom', event: 'mesh:signal', data });
            }
          });
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@localfirst/mesh-sync': path.resolve(__dirname, '../../packages/mesh-sync/src/index.ts')
    }
  },
  server: {
    port: 5174
  }
});
