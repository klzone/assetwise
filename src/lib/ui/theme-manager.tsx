/**
 * 增强的主题管理系统
 * 支持自定义主题、动态主题切换、主题预设和用户偏好设置
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

// 主题配置接口
export interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  fonts: {
    sans: string[];
    mono: string[];
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  animations: {
    duration: string;
    easing: string;
  };
}

// 预设主题
export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'default',
    displayName: '默认科技蓝',
    description: '经典的科技蓝配色方案',
    colors: {
      primary: '217 91% 60%',
      secondary: '240 15% 95%',
      accent: '188 95% 46%',
      background: '250 250% 99%',
      foreground: '215 25% 15%',
      muted: '240 15% 95%',
      border: '240 15% 88%',
    },
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.75rem',
      lg: '1rem',
    },
    animations: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  {
    id: 'purple',
    name: 'purple',
    displayName: '紫色渐变',
    description: '优雅的紫色主题',
    colors: {
      primary: '262 83% 58%',
      secondary: '270 15% 95%',
      accent: '280 100% 70%',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      muted: '270 15% 95%',
      border: '270 15% 88%',
    },
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    borderRadius: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
    },
    animations: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  {
    id: 'green',
    name: 'green',
    displayName: '自然绿色',
    description: '清新的绿色主题',
    colors: {
      primary: '142 76% 36%',
      secondary: '120 15% 95%',
      accent: '120 100% 30%',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      muted: '120 15% 95%',
      border: '120 15% 88%',
    },
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
    },
    animations: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
];

// 主题上下文
interface ThemeManagerContextType {
  currentTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  setCustomTheme: (theme: ThemeConfig) => void;
  applyTheme: (themeId: string) => void;
  resetToDefault: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => boolean;
  isCustomTheme: boolean;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeManagerContext = createContext<ThemeManagerContextType | undefined>(undefined);

// 主题管理器提供者
export function ThemeManagerProvider({ children }: { children: React.ReactNode }) {
  const { theme: mode, setTheme: setMode } = useNextTheme();
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(PRESET_THEMES[0]);
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([]);
  const [isCustomTheme, setIsCustomTheme] = useState(false);

  // 加载保存的主题设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('assetwise-custom-theme');
      const savedCustomThemes = localStorage.getItem('assetwise-custom-themes');
      
      if (savedCustomThemes) {
        try {
          setCustomThemes(JSON.parse(savedCustomThemes));
        } catch (error) {
          console.warn('Failed to load custom themes:', error);
        }
      }
      
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme);
          setCurrentTheme(theme);
          setIsCustomTheme(!PRESET_THEMES.some(t => t.id === theme.id));
        } catch (error) {
          console.warn('Failed to load saved theme:', error);
        }
      }
    }
  }, []);

  // 应用主题到 CSS 变量
  const applyThemeVariables = useCallback((theme: ThemeConfig) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // 应用颜色变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // 应用字体变量
    root.style.setProperty('--font-sans', theme.fonts.sans.join(', '));
    root.style.setProperty('--font-mono', theme.fonts.mono.join(', '));
    
    // 应用圆角变量
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    // 应用动画变量
    root.style.setProperty('--animation-duration', theme.animations.duration);
    root.style.setProperty('--animation-easing', theme.animations.easing);
  }, []);

  // 应用主题
  const applyTheme = useCallback((themeId: string) => {
    const allThemes = [...PRESET_THEMES, ...customThemes];
    const theme = allThemes.find(t => t.id === themeId);
    
    if (theme) {
      setCurrentTheme(theme);
      setIsCustomTheme(!PRESET_THEMES.some(t => t.id === themeId));
      applyThemeVariables(theme);
      
      // 保存到本地存储
      localStorage.setItem('assetwise-custom-theme', JSON.stringify(theme));
    }
  }, [customThemes, applyThemeVariables]);

  // 设置自定义主题
  const setCustomTheme = useCallback((theme: ThemeConfig) => {
    setCurrentTheme(theme);
    setIsCustomTheme(true);
    applyThemeVariables(theme);
    
    // 保存到本地存储
    localStorage.setItem('assetwise-custom-theme', JSON.stringify(theme));
    
    // 如果是新的自定义主题，添加到自定义主题列表
    if (!customThemes.some(t => t.id === theme.id)) {
      const newCustomThemes = [...customThemes, theme];
      setCustomThemes(newCustomThemes);
      localStorage.setItem('assetwise-custom-themes', JSON.stringify(newCustomThemes));
    }
  }, [customThemes, applyThemeVariables]);

  // 重置到默认主题
  const resetToDefault = useCallback(() => {
    applyTheme('default');
  }, [applyTheme]);

  // 导出主题
  const exportTheme = useCallback(() => {
    return JSON.stringify(currentTheme, null, 2);
  }, [currentTheme]);

  // 导入主题
  const importTheme = useCallback((themeJson: string): boolean => {
    try {
      const theme = JSON.parse(themeJson) as ThemeConfig;
      
      // 验证主题格式
      if (!theme.id || !theme.name || !theme.colors || !theme.fonts) {
        throw new Error('Invalid theme format');
      }
      
      setCustomTheme(theme);
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }, [setCustomTheme]);

  // 初始应用主题
  useEffect(() => {
    applyThemeVariables(currentTheme);
  }, [currentTheme, applyThemeVariables]);

  const value: ThemeManagerContextType = {
    currentTheme,
    availableThemes: [...PRESET_THEMES, ...customThemes],
    setCustomTheme,
    applyTheme,
    resetToDefault,
    exportTheme,
    importTheme,
    isCustomTheme,
    themeMode: mode as 'light' | 'dark' | 'system',
    setThemeMode: setMode,
  };

  return (
    <ThemeManagerContext.Provider value={value}>
      {children}
    </ThemeManagerContext.Provider>
  );
}

// 主题管理器 Hook
export function useThemeManager() {
  const context = useContext(ThemeManagerContext);
  if (context === undefined) {
    throw new Error('useThemeManager must be used within a ThemeManagerProvider');
  }
  return context;
}

// 主题预览组件
export function ThemePreview({ theme, isActive, onSelect }: {
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`
        relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
        ${isActive 
          ? 'border-primary shadow-lg scale-105' 
          : 'border-border hover:border-primary/50 hover:shadow-md'
        }
      `}
      onClick={onSelect}
    >
      {/* 主题预览色板 */}
      <div className="mb-3 flex space-x-2">
        <div 
          className="h-6 w-6 rounded-full border border-border/50"
          style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
        />
        <div 
          className="h-6 w-6 rounded-full border border-border/50"
          style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
        />
        <div 
          className="h-6 w-6 rounded-full border border-border/50"
          style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
        />
      </div>
      
      {/* 主题信息 */}
      <div>
        <h3 className="font-medium text-foreground">{theme.displayName}</h3>
        <p className="text-sm text-muted-foreground">{theme.description}</p>
      </div>
      
      {/* 活跃状态指示器 */}
      {isActive && (
        <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
      )}
    </div>
  );
}

// 主题定制器组件
export function ThemeCustomizer() {
  const { currentTheme, setCustomTheme } = useThemeManager();
  const [editingTheme, setEditingTheme] = useState<ThemeConfig>(currentTheme);

  const updateThemeColor = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    setEditingTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const updateThemeProperty = (section: keyof ThemeConfig, key: string, value: any) => {
    setEditingTheme(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as any,
        [key]: value,
      },
    }));
  };

  const applyChanges = () => {
    setCustomTheme(editingTheme);
  };

  const resetChanges = () => {
    setEditingTheme(currentTheme);
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基本信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">主题名称</label>
            <input
              type="text"
              value={editingTheme.displayName}
              onChange={(e) => updateThemeProperty('displayName', '', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">主题ID</label>
            <input
              type="text"
              value={editingTheme.id}
              onChange={(e) => updateThemeProperty('id', '', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">描述</label>
          <textarea
            value={editingTheme.description}
            onChange={(e) => updateThemeProperty('description', '', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary"
            rows={3}
          />
        </div>
      </div>

      {/* 颜色配置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">颜色配置</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(editingTheme.colors).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateThemeColor(key as keyof ThemeConfig['colors'], e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder="例: 217 91% 60%"
                />
                <div
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: `hsl(${value})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-4">
        <button
          onClick={applyChanges}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          应用更改
        </button>
        <button
          onClick={resetChanges}
          className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          重置更改
        </button>
      </div>
    </div>
  );
}