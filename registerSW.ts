/**
 * Service Worker 注册逻辑
 * 最小可行性 Demo
 */

// ============================================================
// 配置
// ============================================================

interface RegisterSWOptions {
  /** SW 文件路径 */
  swPath?: string;
  /** SW 作用域 */
  scope?: string;
  /** 注册成功回调 */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  /** SW 激活回调 */
  onActivated?: (registration: ServiceWorkerRegistration) => void;
  /** 注册失败回调 */
  onError?: (error: Error) => void;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 检测是否支持 Service Worker
 */
function isSWSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * 检测是否为 iOS 设备（iOS 对 SW 支持有限）
 */
function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * 清除所有 SW 注册和缓存
 */
export async function clearAllSWAndCaches(): Promise<void> {
  if (!isSWSupported()) return;

  // 注销所有 SW
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((reg) => reg.unregister()));

  // 清除所有缓存
  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));

  console.log('[SW] All service workers and caches cleared');
}

// ============================================================
// 注册 Service Worker
// ============================================================

/**
 * 注册 Service Worker
 */
export async function registerSW(options: RegisterSWOptions = {}): Promise<ServiceWorkerRegistration | null> {
  const {
    swPath = '/sw.js',
    scope = '/',
    onSuccess,
    onActivated,
    onError,
  } = options;

  // 检查支持性
  if (!isSWSupported()) {
    console.warn('[SW] Service Worker is not supported in this browser');
    return null;
  }

  // iOS 设备跳过 SW（可选，根据业务需求决定）
  if (isIOS()) {
    console.warn('[SW] Skipping SW registration on iOS');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, { scope });
    console.log('[SW] Service Worker registered:', registration.scope);

    // 获取当前的 worker
    const worker = registration.installing || registration.waiting || registration.active;

    if (worker) {
      // 监听状态变化
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') {
          console.log('[SW] Service Worker activated');
          onActivated?.(registration);
        }
      });

      // 如果已经激活，直接回调
      if (worker.state === 'activated') {
        onActivated?.(registration);
      }
    }

    onSuccess?.(registration);
    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
    onError?.(error as Error);
    return null;
  }
}

// ============================================================
// 自动注册（可选）
// ============================================================

/**
 * 页面加载完成后自动注册 SW
 */
export function autoRegisterSW(options: RegisterSWOptions = {}): void {
  if (document.readyState === 'complete') {
    registerSW(options);
  } else {
    window.addEventListener('load', () => registerSW(options));
  }
}
