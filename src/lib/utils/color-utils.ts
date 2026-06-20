import { useAppStore } from '@/store';
import { getStoredSettings, type ColorConvention } from '@/lib/mvp-store';

function resolveColorConvention(language: 'zh' | 'en'): ColorConvention {
  if (typeof window === 'undefined') return language === 'zh' ? 'chinese' : 'western';

  return getStoredSettings().colorConvention;
}

/**
 * 根据语言设置获取盈亏颜色类名
 * 中文：红涨绿跌
 * 英文：绿涨红跌
 */
export function useProfitLossColors() {
  const { language } = useAppStore();
  const colorConvention = resolveColorConvention(language);
  
  if (colorConvention === 'chinese') {
    // 中文：红涨绿跌
    return {
      profit: 'text-destructive',
      loss: 'text-success',
      profitBg: 'bg-destructive-light text-destructive',
      lossBg: 'bg-success-light text-success',
      profitBorder: 'border-destructive/30',
      lossBorder: 'border-success/30'
    };
  } else {
    // 英文：绿涨红跌
    return {
      profit: 'text-success',
      loss: 'text-destructive',
      profitBg: 'bg-success-light text-success',
      lossBg: 'bg-destructive-light text-destructive',
      profitBorder: 'border-success/30',
      lossBorder: 'border-destructive/30'
    };
  }
}

/**
 * 获取盈亏颜色类名（非Hook版本，用于非组件环境）
 */
export function getProfitLossColors(language: 'zh' | 'en') {
  const colorConvention = resolveColorConvention(language);

  if (colorConvention === 'chinese') {
    // 中文：红涨绿跌
    return {
      profit: 'text-destructive',
      loss: 'text-success',
      profitBg: 'bg-destructive-light text-destructive',
      lossBg: 'bg-success-light text-success',
      profitBorder: 'border-destructive/30',
      lossBorder: 'border-success/30'
    };
  } else {
    // 英文：绿涨红跌
    return {
      profit: 'text-success',
      loss: 'text-destructive',
      profitBg: 'bg-success-light text-success',
      lossBg: 'bg-destructive-light text-destructive',
      profitBorder: 'border-success/30',
      lossBorder: 'border-destructive/30'
    };
  }
}

/**
 * 根据数值获取对应的颜色类名
 */
export function getValueColor(value: number, language: 'zh' | 'en' = 'zh') {
  const colors = getProfitLossColors(language);
  return value >= 0 ? colors.profit : colors.loss;
}

/**
 * 根据数值获取对应的背景颜色类名
 */
export function getValueBgColor(value: number, language: 'zh' | 'en' = 'zh') {
  const colors = getProfitLossColors(language);
  return value >= 0 ? colors.profitBg : colors.lossBg;
}
