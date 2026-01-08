/**
 * Vite 配置 - Workbox PWA Demo
 */

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages 部署配置
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',

  plugins: [
    VitePWA({
      // 使用 injectManifest 模式，允许自定义 SW 逻辑
      strategies: 'injectManifest',

      // SW 源文件路径
      srcDir: '.',
      filename: 'sw.ts',

      // 不自动注册，由 registerSW.ts 手动控制
      injectRegister: null,

      // 开发模式配置
      devOptions: {
        enabled: true,
        type: 'module',
      },

      // injectManifest 配置
      injectManifest: {
        // 需要预缓存的文件模式
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2}',
        ],
        // 最大缓存文件大小 (10MB)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },

      // PWA manifest 配置（可选）
      manifest: {
        name: 'Workbox PWA Demo',
        short_name: 'PWA Demo',
        theme_color: '#007bff',
        icons: [],
      },
    }),
  ],

  build: {
    // 构建输出目录
    outDir: 'dist',
    // 生成 sourcemap 方便调试
    sourcemap: true,
  },
});
