import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@styles": path.resolve(__dirname, "./src/styles")
    }
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Ensure no server-side API calls during build
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    },
    // Disable SSR completely
    ssr: false,
    // Client-side only build
    target: 'es2015',
    minify: 'esbuild'
  },
  // Prevent any server-side execution
  ssr: {
    noExternal: []
  }
})