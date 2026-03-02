import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import os from 'os'

// Detectar automáticamente la IP local
function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Buscar IPv4 que no sea loopback
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    console.warn('No se pudo detectar IP local, usando localhost');
  }
  return 'localhost';
}

const localIP = getLocalIP();
const backendURL = process.env.BACKEND_URL || `http://${localIP}:3000`;

console.log(`🔗 Frontend → Backend: ${backendURL}`);

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces de red
    port: 5175,
    proxy: {
      '/api': {
        target: backendURL,
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              res.setHeader('set-cookie', cookies);
            }
          });
        }
      }
    }
  }
})
