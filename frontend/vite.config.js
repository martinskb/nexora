import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // App instalável: o service worker guarda só a "casca" (HTML, JS, CSS, fontes,
    // ícones). Respostas da API NÃO são guardadas aqui: dados ficam no cache do
    // TanStack Query, separado por loja.
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icones/apple-touch-icon.png'],
      manifest: {
        name: 'Nexora',
        short_name: 'Nexora',
        description: 'Vendas e estoque juntos, sem complicação.',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        background_color: '#f5f6f9',
        theme_color: '#f5f6f9',
        icons: [
          { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icones/icone-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    // Em desenvolvimento, /api é repassado para o backend (evita problemas de CORS).
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
})
