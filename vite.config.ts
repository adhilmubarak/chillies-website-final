import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
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
    }),
    {
      name: 'remove-main-manifest-from-admin',
      closeBundle() {
        const filePath = resolve(__dirname, 'dist/admin.html');
        if (existsSync(filePath)) {
          const html = readFileSync(filePath, 'utf8');
          const cleanHtml = html.replace('<link rel="manifest" href="/manifest.webmanifest">', '');
          writeFileSync(filePath, cleanHtml, 'utf8');
          console.log('Successfully removed manifest.webmanifest from dist/admin.html on disk!');
        } else {
          console.log('dist/admin.html not found on disk at:', filePath);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      },
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