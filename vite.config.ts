import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://70fecc49fcf6.ngrok-free.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Agregar header para ngrok
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/socket.io': {
        target: 'https://70fecc49fcf6.ngrok-free.app',
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('socket proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('WebSocket proxy request:', req.method, req.url);
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('WebSocket proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
