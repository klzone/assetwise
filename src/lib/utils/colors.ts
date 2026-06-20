import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { getStoredSettings, type ColorConvention } from '@/lib/mvp-store';

// 盈亏颜色配置
export const PROFIT_LOSS_COLORS = {
  zh: {
    // 中文：红涨绿跌
    profit: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      darkText: 'dark:text-red-300',
      darkBg: 'dark:bg-red-900/30',
      darkBorder: 'dark:border-red-600/50',
    },
    loss: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      darkText: 'dark:text-green-300',
      darkBg: 'dark:bg-green-900/30',
      darkBorder: 'dark:border-green-600/50',
    }
  },
  en: {
    // 英文：绿涨红跌
    profit: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      darkText: 'dark:text-green-300',
      darkBg: 'dark:bg-green-900/30',
      darkBorder: 'dark:border-green-600/50',
    },
    loss: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      darkText: 'dark:text-red-300',
      darkBg: 'dark:bg-red-900/30',
      darkBorder: 'dark:border-red-600/50',
    }
  }
} as const;

// 获取盈亏颜色的Hook
export function useProfitLossColors() {
  const { language } = useAppStore();
  const fallbackConvention: ColorConvention = language === 'zh' ? 'chinese' : 'western';
  const [colorConvention, setColorConvention] = useState<ColorConvention>(fallbackConvention);

  useEffect(() => {
    const loadSettings = () => setColorConvention(getStoredSettings().colorConvention);

    loadSettings();
    window.addEventListener('assetwise-settings-updated', loadSettings);
    window.addEventListener('focus', loadSettings);

    return () => {
      window.removeEventListener('assetwise-settings-updated', loadSettings);
      window.removeEventListener('focus', loadSettings);
    };
  }, []);

  const colorScheme = colorConvention === 'chinese' ? PROFIT_LOSS_COLORS.zh : PROFIT_LOSS_COLORS.en;
  
  const getProfitLossColors = (value: number, includeNeutral: boolean = true) => {
    if (value > 0) {
      return colorScheme.profit;
    } else if (value < 0) {
      return colorScheme.loss;
    } else if (includeNeutral) {
      // 中性颜色（零值）
      return {
        text: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        darkText: 'dark:text-gray-400',
        darkBg: 'dark:bg-gray-950/20',
        darkBorder: 'dark:border-gray-800',
      };
    } else {
      return colorScheme.profit; // 默认返回盈利颜色
    }
  };

  const getProfitLossColorClasses = (value: number, type: 'text' | 'bg' | 'border' | 'all' = 'text') => {
    const colors = getProfitLossColors(value);
    
    switch (type) {
      case 'text':
        return `${colors.text} ${colors.darkText}`;
      case 'bg':
        return `${colors.bg} ${colors.darkBg}`;
      case 'border':
        return `${colors.border} ${colors.darkBorder}`;
      case 'all':
        return `${colors.text} ${colors.bg} ${colors.border} ${colors.darkText} ${colors.darkBg} ${colors.darkBorder}`;
      default:
        return `${colors.text} ${colors.darkText}`;
    }
  };

  return {
    getProfitLossColors,
    getProfitLossColorClasses,
    colorScheme
  };
}

// 格式化数值并应用颜色
export function formatProfitLoss(value: number, currency: string = '¥', showSign: boolean = true) {
  const sign = value > 0 ? '+' : '';
  const formattedValue = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (showSign) {
    return `${sign}${currency}${formattedValue}`;
  } else {
    return `${currency}${formattedValue}`;
  }
}

// 格式化百分比并应用颜色
export function formatProfitLossPercentage(value: number, showSign: boolean = true) {
  const sign = value > 0 ? '+' : '';
  const formattedValue = Math.abs(value).toFixed(2);
  
  if (showSign) {
    return `${sign}${formattedValue}%`;
  } else {
    return `${formattedValue}%`;
  }
}
