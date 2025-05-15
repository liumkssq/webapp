// vite.config.js
import vue from "file:///D:/campework/Webapp/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import AutoImport from "file:///D:/campework/Webapp/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/campework/Webapp/node_modules/unplugin-vue-components/dist/vite.js";
import { defineConfig } from "file:///D:/campework/Webapp/node_modules/vite/dist/node/index.js";
var __vite_injected_original_import_meta_url = "file:///D:/campework/Webapp/vite.config.js";
var BASE_URL = "/";
var vite_config_default = defineConfig({
  base: BASE_URL,
  plugins: [
    vue(),
    // 自动导入常用API
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts",
      dirs: ["src/composables", "src/stores"],
      vueTemplate: true
    }),
    // 自动导入组件
    Components({
      extensions: ["vue"],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: "src/components.d.ts",
      dirs: ["src/components"]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    host: true,
    port: 5175,
    open: true,
    cors: true,
    proxy: {
      // 可以配置后端接口代理
      "/api": {
        target: "http://localhost:8888",
        changeOrigin: true
        // rewrite: (path) => path.replace(/^\/api/, ''),
      }
      // // IM服务代理
      // '/v1': {
      //   target: 'http://localhost:8998',
      //   changeOrigin: true,
      // },
    }
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // 代码分割配置
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          vendor: ["axios"]
        }
      }
    },
    // 源码映射，便于调试
    sourcemap: process.env.NODE_ENV !== "production",
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 启用CSS压缩
    cssMinify: true,
    // 构建时移除console和debugger
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === "production",
        drop_debugger: process.env.NODE_ENV === "production"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxjYW1wZXdvcmtcXFxcV2ViYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxjYW1wZXdvcmtcXFxcV2ViYXBwXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9jYW1wZXdvcmsvV2ViYXBwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcblxuLy8gXHU3NTFGXHU0RUE3XHU3M0FGXHU1ODgzXHU1N0ZBXHU3ODQwXHU4REVGXHU1Rjg0XG5jb25zdCBCQVNFX1VSTCA9ICcvJ1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogQkFTRV9VUkwsXG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcbiAgICAvLyBcdTgxRUFcdTUyQThcdTVCRkNcdTUxNjVcdTVFMzhcdTc1MjhBUElcbiAgICBBdXRvSW1wb3J0KHtcbiAgICAgIGltcG9ydHM6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnXSxcbiAgICAgIGR0czogJ3NyYy9hdXRvLWltcG9ydHMuZC50cycsXG4gICAgICBkaXJzOiBbJ3NyYy9jb21wb3NhYmxlcycsICdzcmMvc3RvcmVzJ10sXG4gICAgICB2dWVUZW1wbGF0ZTogdHJ1ZSxcbiAgICB9KSxcbiAgICAvLyBcdTgxRUFcdTUyQThcdTVCRkNcdTUxNjVcdTdFQzRcdTRFRjZcbiAgICBDb21wb25lbnRzKHtcbiAgICAgIGV4dGVuc2lvbnM6IFsndnVlJ10sXG4gICAgICBpbmNsdWRlOiBbL1xcLnZ1ZSQvLCAvXFwudnVlXFw/dnVlL10sXG4gICAgICBkdHM6ICdzcmMvY29tcG9uZW50cy5kLnRzJyxcbiAgICAgIGRpcnM6IFsnc3JjL2NvbXBvbmVudHMnXSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHBvcnQ6IDUxNzUsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBjb3JzOiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAvLyBcdTUzRUZcdTRFRTVcdTkxNERcdTdGNkVcdTU0MEVcdTdBRUZcdTYzQTVcdTUzRTNcdTRFRTNcdTc0MDZcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0Ojg4ODgnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIC8vIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGkvLCAnJyksXG4gICAgICB9LFxuICAgICAgLy8gLy8gSU1cdTY3MERcdTUyQTFcdTRFRTNcdTc0MDZcbiAgICAgIC8vICcvdjEnOiB7XG4gICAgICAvLyAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODk5OCcsXG4gICAgICAvLyAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIC8vIH0sXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIC8vIFx1NEVFM1x1NzgwMVx1NTIwNlx1NTI3Mlx1OTE0RFx1N0Y2RVxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9qcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tleHRdL1tuYW1lXS1baGFzaF0uW2V4dF0nLFxuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2dWU6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnXSxcbiAgICAgICAgICB2ZW5kb3I6IFsnYXhpb3MnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBcdTZFOTBcdTc4MDFcdTY2MjBcdTVDMDRcdUZGMENcdTRGQkZcdTRFOEVcdThDMDNcdThCRDVcbiAgICBzb3VyY2VtYXA6IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicsXG4gICAgLy8gXHU1NDJGXHU3NTI4Q1NTXHU0RUUzXHU3ODAxXHU1MjA2XHU1MjcyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIC8vIFx1NTQyRlx1NzUyOENTU1x1NTM4Qlx1N0YyOVxuICAgIGNzc01pbmlmeTogdHJ1ZSxcbiAgICAvLyBcdTY3ODRcdTVFRkFcdTY1RjZcdTc5RkJcdTk2NjRjb25zb2xlXHU1NDhDZGVidWdnZXJcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpUCxPQUFPLFNBQVM7QUFDalEsU0FBUyxlQUFlLFdBQVc7QUFDbkMsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFKc0gsSUFBTSwyQ0FBMkM7QUFPcE0sSUFBTSxXQUFXO0FBR2pCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQTtBQUFBLElBRUosV0FBVztBQUFBLE1BQ1QsU0FBUyxDQUFDLE9BQU8sY0FBYyxPQUFPO0FBQUEsTUFDdEMsS0FBSztBQUFBLE1BQ0wsTUFBTSxDQUFDLG1CQUFtQixZQUFZO0FBQUEsTUFDdEMsYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBO0FBQUEsSUFFRCxXQUFXO0FBQUEsTUFDVCxZQUFZLENBQUMsS0FBSztBQUFBLE1BQ2xCLFNBQVMsQ0FBQyxVQUFVLFlBQVk7QUFBQSxNQUNoQyxLQUFLO0FBQUEsTUFDTCxNQUFNLENBQUMsZ0JBQWdCO0FBQUEsSUFDekIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxNQUVMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBLE1BRWhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTUY7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUE7QUFBQSxJQUVYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGNBQWM7QUFBQSxVQUNaLEtBQUssQ0FBQyxPQUFPLGNBQWMsT0FBTztBQUFBLFVBQ2xDLFFBQVEsQ0FBQyxPQUFPO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBQUE7QUFBQSxJQUVwQyxjQUFjO0FBQUE7QUFBQSxJQUVkLFdBQVc7QUFBQTtBQUFBLElBRVgsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYyxRQUFRLElBQUksYUFBYTtBQUFBLFFBQ3ZDLGVBQWUsUUFBUSxJQUFJLGFBQWE7QUFBQSxNQUMxQztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
