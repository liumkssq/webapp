import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

// 生产环境基础路径
const BASE_URL = '/'

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE_URL,
  plugins: [
    vue(),
    // 自动导入常用API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true,
    }),
    // 自动导入组件
    Components({
      extensions: ['vue'],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: 'src/components.d.ts',
      dirs: ['src/components'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    open: true,
    cors: true,
    proxy: {
      // 可以配置后端接口代理
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // // IM服务代理
      // '/v1': {
      //   target: 'http://localhost:8998',
      //   changeOrigin: true,
      // },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 代码分割配置
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          vendor: ['axios'],
        },
      },
    },
    // 源码映射，便于调试
    sourcemap: process.env.NODE_ENV !== 'production',
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 启用CSS压缩
    cssMinify: true,
    // 构建时移除console和debugger
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
  },
})