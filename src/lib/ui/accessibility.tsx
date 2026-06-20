/**
 * 无障碍访问性系统
 * 提供键盘导航、屏幕阅读器支持、焦点管理和可访问性工具
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useState,
  useCallback,
  KeyboardEvent,
  FocusEvent,
} from 'react';

// 无障碍配置
interface AccessibilityConfig {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  focusVisible: boolean;
  announcements: boolean;
  keyboardNavigation: boolean;
}

// 无障碍上下文
interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  focusNext: () => void;
  focusPrevious: () => void;
  skipToContent: () => void;
  isKeyboardUser: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// 默认配置
const DEFAULT_CONFIG: AccessibilityConfig = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  focusVisible: true,
  announcements: true,
  keyboardNavigation: true,
};

// 无障碍提供者
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AccessibilityConfig>(DEFAULT_CONFIG);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // 检测用户偏好设置
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 检测系统偏好
    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updateFromMediaQuery = () => {
      setConfig(prev => ({
        ...prev,
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
      }));
    };

    // 初始检测
    updateFromMediaQuery();

    // 监听变化
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateFromMediaQuery);
    });

    // 加载保存的配置
    const savedConfig = localStorage.getItem('assetwise-accessibility-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to load accessibility config:', error);
      }
    }

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateFromMediaQuery);
      });
    };
  }, []);

  // 检测键盘用户
  useEffect(() => {
    const handleKeyDown = () => setIsKeyboardUser(true);
    const handleMouseDown = () => setIsKeyboardUser(false);
    const handleTouch = () => setIsKeyboardUser(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouch);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, []);

  // 应用配置到 DOM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // 减少动画
    if (config.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // 高对比度
    if (config.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // 大字体
    if (config.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // 焦点可见性
    if (config.focusVisible && isKeyboardUser) {
      root.classList.add('keyboard-user');
    } else {
      root.classList.remove('keyboard-user');
    }
  }, [config, isKeyboardUser]);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem('assetwise-accessibility-config', JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);

  // 公告消息
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!config.announcements || !announcementRef.current) return;

    announcementRef.current.setAttribute('aria-live', priority);
    announcementRef.current.textContent = message;
    
    // 清除消息以准备下一次公告
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    }, 1000);
  }, [config.announcements]);

  // 焦点导航
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }, []);

  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex]?.focus();
  }, []);

  // 跳转到主内容
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const value: AccessibilityContextType = {
    config,
    updateConfig,
    announce,
    focusNext,
    focusPrevious,
    skipToContent,
    isKeyboardUser,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* 屏幕阅读器公告区域 */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  );
}

// 无障碍 Hook
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// 获取可焦点元素
function getFocusableElements(): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
}

// 跳转链接组件
export function SkipLink({ href = '#main-content', children = '跳转到主内容' }: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}

// 焦点陷阱组件
export function FocusTrap({
  children,
  active = true,
  restoreFocus = true,
}: {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // 保存当前焦点
    lastFocusedElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // 焦点到第一个元素
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown as any);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as any);
      
      // 恢复焦点
      if (restoreFocus && lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}

// 可访问性设置面板
export function AccessibilitySettings() {
  const { config, updateConfig } = useAccessibility();

  const settings = [
    {
      key: 'reduceMotion' as keyof AccessibilityConfig,
      label: '减少动画效果',
      description: '减少页面中的动画和过渡效果',
    },
    {
      key: 'highContrast' as keyof AccessibilityConfig,
      label: '高对比度',
      description: '增强文字和背景的对比度',
    },
    {
      key: 'largeText' as keyof AccessibilityConfig,
      label: '大字体',
      description: '增大文字大小以提高可读性',
    },
    {
      key: 'focusVisible' as keyof AccessibilityConfig,
      label: '焦点指示器',
      description: '显示键盘焦点的可视指示器',
    },
    {
      key: 'announcements' as keyof AccessibilityConfig,
      label: '屏幕阅读器公告',
      description: '启用屏幕阅读器消息公告',
    },
    {
      key: 'keyboardNavigation' as keyof AccessibilityConfig,
      label: '键盘导航',
      description: '启用完整的键盘导航支持',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">无障碍设置</h2>
        <p className="text-sm text-muted-foreground">
          配置无障碍功能以改善您的使用体验
        </p>
      </div>

      <div className="space-y-4">
        {settings.map(setting => (
          <div key={setting.key} className="flex items-start space-x-3">
            <label className="flex items-center space-x-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={config[setting.key] as boolean}
                onChange={(e) => updateConfig({ [setting.key]: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <div>
                <div className="font-medium">{setting.label}</div>
                <div className="text-sm text-muted-foreground">
                  {setting.description}
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ARIA 实时区域组件
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  className = '',
}: {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-live={priority}
      aria-atomic={atomic}
    >
      {children}
    </div>
  );
}

// 键盘导航助手
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    wrap?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
) {
  const { wrap = true, orientation = 'both' } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          nextIndex = wrap 
            ? (currentIndex + 1) % focusableElements.length
            : Math.min(currentIndex + 1, focusableElements.length - 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          nextIndex = wrap
            ? currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
            : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          nextIndex = wrap
            ? (currentIndex + 1) % focusableElements.length
            : Math.min(currentIndex + 1, focusableElements.length - 1);
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          nextIndex = wrap
            ? currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
            : Math.max(currentIndex - 1, 0);
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = focusableElements.length - 1;
        break;
    }

    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
    }
  }, [containerRef, wrap, orientation]);

  return { handleKeyDown };
}

// 屏幕阅读器专用文本
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// 可访问性验证工具
export function useAccessibilityValidator() {
  const [issues, setIssues] = useState<Array<{
    type: string;
    message: string;
    element?: Element;
  }>>([]);

  const validatePage = useCallback(() => {
    const newIssues: typeof issues = [];

    // 检查缺失的 alt 属性
    document.querySelectorAll('img:not([alt])').forEach(img => {
      newIssues.push({
        type: 'missing-alt',
        message: '图片缺少 alt 属性',
        element: img,
      });
    });

    // 检查空的 alt 属性（装饰性图片除外）
    document.querySelectorAll('img[alt=""]').forEach(img => {
      if (!img.hasAttribute('role') || img.getAttribute('role') !== 'presentation') {
        newIssues.push({
          type: 'empty-alt',
          message: '图片 alt 属性为空，考虑添加描述性文本或设置 role="presentation"',
          element: img,
        });
      }
    });

    // 检查缺失的标签
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
      const labels = document.querySelectorAll(`label[for="${input.id}"]`);
      if (labels.length === 0 && !input.closest('label')) {
        newIssues.push({
          type: 'missing-label',
          message: '表单控件缺少标签',
          element: input,
        });
      }
    });

    // 检查颜色对比度（简化版）
    document.querySelectorAll('*').forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // 这里可以添加更复杂的对比度计算
        // 简化实现：仅检查明显的低对比度情况
      }
    });

    setIssues(newIssues);
  }, []);

  return { issues, validatePage };
}