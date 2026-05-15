import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Chillies Restaurant',
        short_name: 'Chillies',
        description: 'Order food directly from Chillies and earn loyalty points!',
        theme_color: '#0c0c0c',
        background_color: '#0c0c0c',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_react: ['react', 'react-dom', 'react-router-dom'],
          vendor_firebase: ['firebase/app', 'firebase/firestore', 'firebase/storage', 'firebase/messaging'],
          vendor_lucide: ['lucide-react']
        }
      }
    }
  }
});