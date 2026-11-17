import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    basicSsl(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router'],
      dts: 'src/auto-imports.d.ts'
    }),
    
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: true,
    proxy: {
      '/api/sports': {
        target: process.env.VITE_SPORTS_API || 'https://hailin.dazstech.com',
        changeOrigin: true
      },
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/organization_management_cloud': {
        target: 'https://daweiai.net',
        changeOrigin: true,
        onProxyReq: (proxyReq, req) => {
          // 强制重写Referer和Origin，绕过图片服务器的防盗链检查
          proxyReq.setHeader('Referer', 'https://daweiai.net/')
          proxyReq.setHeader('Origin', 'https://daweiai.net')
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['pinia', 'axios', 'gsap']
        }
      }
    },
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1500
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus', 'echarts', 'xlsx']
  }
})