/**
 * 响应式设计工具
 * 提供移动端优化的工具函数和Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// 断点定义
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 屏幕方向
export type Orientation = 'portrait' | 'landscape';

// 响应式值类型
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

// 媒体查询Hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

// 断点Hook
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('sm');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// 设备类型检测Hook
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.md) {
        setDeviceType('mobile');
      } else if (width < BREAKPOINTS.lg) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return deviceType;
}

// 屏幕方向检测Hook
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// 视口尺寸Hook
export function useViewportSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

// 响应式值解析函数
export function resolveResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // 查找当前断点或最接近的断点值
    const breakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpoints.indexOf(breakpoint);
    
    // 从当前断点开始向下查找
    for (let i = currentIndex; i < breakpoints.length; i++) {
      const bp = breakpoints[i];
      if (value[bp] !== undefined) {
        return value[bp] as T;
      }
    }
    
    // 如果没找到，向上查找
    for (let i = currentIndex - 1; i >= 0; i--) {
      const bp = breakpoints[i];
      if (value[bp] !== undefined) {
        return value[bp] as T;
      }
    }
    
    // 如果都没找到，返回默认值（第一个找到的值）
    for (const bp of breakpoints) {
      if (value[bp] !== undefined) {
        return value[bp] as T;
      }
    }
  }
  
  return value as T;
}

// 响应式值Hook
export function useResponsiveValue<T>(value: ResponsiveValue<T>): T {
  const breakpoint = useBreakpoint();
  return useMemo(() => resolveResponsiveValue(value, breakpoint), [value, breakpoint]);
}

// 触摸设备检测
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

// 安全区域检测Hook
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0,
        right: parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0,
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
        left: parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0,
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
}

// 滚动锁定Hook（用于模态框等）
export function useScrollLock() {
  const [isLocked, setIsLocked] = useState(false);

  const lockScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;
    setIsLocked(true);
  }, []);

  const unlockScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    setIsLocked(false);
  }, []);

  useEffect(() => {
    return () => {
      if (isLocked) {
        unlockScroll();
      }
    };
  }, [isLocked, unlockScroll]);

  return { isLocked, lockScroll, unlockScroll };
}

// PWA安装检测Hook
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 检查是否已安装
    const checkInstalled = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    };

    checkInstalled();

    // 监听安装提示
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // 监听安装完成
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    setInstallPrompt(null);
    setIsInstallable(false);
    
    return result.outcome === 'accepted';
  }, [installPrompt]);

  return {
    isInstallable,
    isInstalled,
    install,
  };
}

// 网络状态检测Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    updateOnlineStatus();
    updateConnectionType();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
}

// 响应式工具类
export class ResponsiveUtils {
  /**
   * 生成响应式类名
   */
  static generateResponsiveClasses(
    baseClass: string,
    values: Partial<Record<Breakpoint, string>>
  ): string {
    const classes = [baseClass];
    
    Object.entries(values).forEach(([breakpoint, value]) => {
      if (value) {
        const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
        classes.push(`${prefix}${value}`);
      }
    });
    
    return classes.join(' ');
  }

  /**
   * 检查是否为移动设备
   */
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < BREAKPOINTS.md;
  }

  /**
   * 检查是否为平板设备
   */
  static isTablet(): boolean {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  }

  /**
   * 检查是否为桌面设备
   */
  static isDesktop(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS.lg;
  }

  /**
   * 获取最佳图片尺寸
   */
  static getOptimalImageSize(containerWidth: number, devicePixelRatio = 1): number {
    return Math.ceil(containerWidth * devicePixelRatio);
  }

  /**
   * 生成srcSet字符串
   */
  static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  }
}