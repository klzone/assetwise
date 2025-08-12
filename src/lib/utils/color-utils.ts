import { useAppStore } from '@/store';

/**
 * 根据语言设置获取盈亏颜色类名
 * 中文：红涨绿跌
 * 英文：绿涨红跌
 */
export function useProfitLossColors() {
  const { language } = useAppStore();
  
  if (language === 'zh') {
    // 中文：红涨绿跌
    return {
      profit: 'text-red-600',
      loss: 'text-green-600',
      profitBg: 'bg-red-50 text-red-700',
      lossBg: 'bg-green-50 text-green-700',
      profitBorder: 'border-red-200',
      lossBorder: 'border-green-200'
    };
  } else {
    // 英文：绿涨红跌
    return {
      profit: 'text-green-600',
      loss: 'text-red-600',
      profitBg: 'bg-green-50 text-green-700',
      lossBg: 'bg-red-50 text-red-700',
      profitBorder: 'border-green-200',
      lossBorder: 'border-red-200'
    };
  }
}

/**
 * 获取盈亏颜色类名（非Hook版本，用于非组件环境）
 */
export function getProfitLossColors(language: 'zh' | 'en') {
  if (language === 'zh') {
    // 中文：红涨绿跌
    return {
      profit: 'text-red-600',
      loss: 'text-green-600',
      profitBg: 'bg-red-50 text-red-700',
      lossBg: 'bg-green-50 text-green-700',
      profitBorder: 'border-red-200',
      lossBorder: 'border-green-200'
    };
  } else {
    // 英文：绿涨红跌
    return {
      profit: 'text-green-600',
      loss: 'text-red-600',
      profitBg: 'bg-green-50 text-green-700',
      lossBg: 'bg-red-50 text-red-700',
      profitBorder: 'border-green-200',
      lossBorder: 'border-red-200'
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
