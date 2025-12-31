/**
 * 基于官方 Workbox 的 Service Worker
 * 最小可行性 Demo - 可直接迁移使用
 */

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, Route } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { RangeRequestsPlugin } from 'workbox-range-requests';

declare let self: ServiceWorkerGlobalScope;

// ============================================================
// 1. SW 生命周期控制
// ============================================================

// 禁用开发日志
self.__WB_DISABLE_DEV_LOGS = true;

// 跳过等待，新 SW 立即激活
self.skipWaiting();

// 激活后立即接管所有页面
clientsClaim();

// 清理旧版本的预缓存
cleanupOutdatedCaches();

// ============================================================
// 2. 预缓存配置
// ============================================================

// __WB_MANIFEST 由构建工具（vite-plugin-pwa）在构建时注入
// 包含需要预缓存的资源清单 [{url, revision}, ...]
precacheAndRoute(self.__WB_MANIFEST, {
  // 匹配缓存时忽略所有 URL 参数
  ignoreURLParametersMatching: [/.*/],
});

// ============================================================
// 3. 运行时缓存路由
// ============================================================

/**
 * 判断是否为允许缓存的 CDN 域名
 */
function isAllowedCacheOrigin(url: URL): boolean {
  const allowedOrigins = [
    'https://cdnetworks.voya.world',
    'https://assets.voya.world',
    // 添加其他 CDN 域名...
  ];
  return allowedOrigins.includes(url.origin);
}

/**
 * 路由 1: JS/CSS 静态资源
 * 策略: CacheFirst
 */
const assetRoute = new Route(
  ({ request, sameOrigin, url }) => {
    const isAsset =
      request.destination === 'script' ||
      request.destination === 'style' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css');
    return sameOrigin && isAsset;
  },
  new CacheFirst({
    cacheName: 'asset-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
      }),
    ],
  })
);

/**
 * 路由 2: 图片资源
 * 策略: CacheFirst，24小时过期
 */
const imageRoute = new Route(
  ({ request, sameOrigin, url }) => {
    const isImage = request.destination === 'image';
    const isAllowedOrigin = sameOrigin || isAllowedCacheOrigin(url);
    return isImage && isAllowedOrigin;
  },
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 小时
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

/**
 * 路由 3: 视频/音频/大文件
 * 策略: CacheFirst，支持 Range 请求（视频拖拽）
 * 通过 URL 参数标记是否缓存：?video_cache=1
 */
const mediaRoute = new Route(
  ({ sameOrigin, url }) => {
    const isAllowedOrigin = sameOrigin || isAllowedCacheOrigin(url);
    const shouldCache =
      url.searchParams.has('video_cache') ||
      url.searchParams.has('audio_cache') ||
      url.searchParams.has('json_cache') ||
      url.searchParams.has('zip_cache');
    return isAllowedOrigin && shouldCache;
  },
  new CacheFirst({
    cacheName: 'media-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      // 支持 Range 请求，视频拖拽进度条时需要
      new RangeRequestsPlugin(),
    ],
  })
);

/**
 * 路由 4: 字体和 SVGA 动画
 * 策略: CacheFirst
 */
const fontRoute = new Route(
  ({ request, sameOrigin, url }) => {
    const isFont = request.destination === 'font' || url.pathname.endsWith('.svga');
    const isAllowedOrigin = sameOrigin || isAllowedCacheOrigin(url);
    return isFont && isAllowedOrigin;
  },
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// ============================================================
// 4. 注册所有路由
// ============================================================

registerRoute(assetRoute);
registerRoute(imageRoute);
registerRoute(mediaRoute);
registerRoute(fontRoute);
