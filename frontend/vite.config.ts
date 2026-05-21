import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cargado siempre
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // MUI es muy pesado — chunk propio para caché independiente
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // PDF — solo se usa en páginas específicas
          pdf: ['@react-pdf/renderer'],
          // Mapa — solo se usa en páginas de localización
          maps: ['leaflet', 'react-leaflet'],
          // Utilidades de archivo
          files: ['jszip', 'file-saver'],
          // HTTP
          http: ['axios'],
        },
      },
    },
  },
})
