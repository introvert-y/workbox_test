# Workbox PWA Demo

基于官方 Workbox 的最小可行性 PWA Demo，可直接迁移使用。通过 npm run build && npm run preview
查看效果

**在线演示**: [https://introvert-y.github.io/workbox_test/](https://introvert-y.github.io/workbox_test/)

## 快速开始

```bash
# 安装依赖
npm install

# 构建 + 预览构建结果
npm run build && npm run preview

```

## 文件结构

```
preload-demo/
├── sw.ts           # Service Worker 主逻辑
├── registerSW.ts   # SW 注册工具函数
├── index.html      # Demo 页面
├── vite.config.ts  # Vite + PWA 配置
├── package.json    # 依赖配置
└── README.md       # 说明文档
```

## 核心功能

### 1. 预缓存 (Precaching)

构建时自动生成资源清单，SW 安装时预缓存：

```typescript
// sw.ts
precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/.*/],
});
```

配置预缓存文件：

```typescript
// vite.config.ts
injectManifest: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
}
```

### 2. 运行时缓存 (Runtime Caching)

| 缓存名 | 资源类型 | 策略 | 配置 |
|--------|----------|------|------|
| `asset-cache` | JS, CSS | CacheFirst | maxEntries: 500 |
| `image-cache` | 图片 | CacheFirst | maxEntries: 50, 24h 过期 |
| `media-cache` | 视频/音频 | CacheFirst | Range 请求支持 |
| `font-cache` | 字体, SVGA | CacheFirst | maxEntries: 50 |

### 3. 缓存策略

**CacheFirst (缓存优先)**：
```
请求 → 检查缓存 → 命中返回 / 未命中请求网络并缓存
```

其他可用策略：
- `NetworkFirst` - 网络优先
- `StaleWhileRevalidate` - 先返回缓存，后台更新
- `NetworkOnly` - 仅网络
- `CacheOnly` - 仅缓存

### 4. 插件

| 插件 | 作用 |
|------|------|
| `ExpirationPlugin` | 限制缓存条目数和过期时间 |
| `CacheableResponsePlugin` | 只缓存特定状态码的响应 |
| `RangeRequestsPlugin` | 支持视频 Range 请求 |


### 自定义预缓存列表

```typescript
// vite.config.ts
injectManifest: {
  globPatterns: [
    // 预缓存特定页面
    'activity/html/recharge/*.html',
    'interactive/**/*.{html,js,css}',
  ],
}
```

### 添加新的缓存路由

```typescript
// sw.ts
const apiRoute = new Route(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100 }),
    ],
  })
);
registerRoute(apiRoute);
```

## 与原项目的差异

| 功能 | 原项目 | 本 Demo |
|------|--------|---------|
| workbox-precaching | 自定义 fork | 官方版本 |
| beforeInstall 钩子 | 有（未使用） | 无 |
| removeOldVersionHTML | 有（未调用） | 无 |
| HTML revision 处理 | 自定义逻辑 | 官方默认 |

## 调试

1. **Chrome DevTools**
   - Application → Service Workers 查看 SW 状态
   - Application → Cache Storage 查看缓存内容

2. **清除 SW**
   ```javascript
   // 控制台执行
   navigator.serviceWorker.getRegistrations().then(regs =>
     regs.forEach(reg => reg.unregister())
   );
   caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
   ```

3. **URL 参数清除**
   ```
   https://your-site.com/?unregister=true
   ```

## 参考链接

- [Workbox 官方文档](https://developer.chrome.com/docs/workbox/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
