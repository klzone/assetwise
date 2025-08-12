'use client';

import { useProfitLossColors, formatProfitLoss, formatProfitLossPercentage } from '@/lib/utils/colors';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface ProfitLossDisplayProps {
  value: number;
  percentage?: number;
  currency?: string;
  showSign?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'badge' | 'card';
  className?: string;
}

export function ProfitLossDisplay({
  value,
  percentage,
  currency = '¥',
  showSign = true,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  className
}: ProfitLossDisplayProps) {
  const { getProfitLossColorClasses } = useProfitLossColors();
  const { currency: globalCurrency } = useAppStore();
  
  const actualCurrency = currency === '¥' ? (globalCurrency === 'USD' ? '$' : globalCurrency === 'EUR' ? '€' : '¥') : currency;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };
  
  const variantClasses = {
    default: '',
    badge: 'px-2 py-1 rounded-full text-xs font-medium',
    card: 'px-3 py-2 rounded-lg border'
  };
  
  const colorClasses = getProfitLossColorClasses(value, variant === 'card' ? 'all' : 'text');
  
  const formattedValue = formatProfitLoss(value, actualCurrency, showSign);
  const formattedPercentage = percentage !== undefined ? formatProfitLossPercentage(percentage, showSign) : null;
  
  return (
    <span
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        colorClasses,
        className
      )}
    >
      {formattedValue}
      {showPercentage && formattedPercentage && (
        <span className="ml-1">({formattedPercentage})</span>
      )}
    </span>
  );
}

// 简化的盈亏文本组件
export function ProfitLossText({
  value,
  currency = '¥',
  showSign = true,
  className
}: {
  value: number;
  currency?: string;
  showSign?: boolean;
  className?: string;
}) {
  return (
    <ProfitLossDisplay
      value={value}
      currency={currency}
      showSign={showSign}
      variant="default"
      className={className}
    />
  );
}

// 盈亏徽章组件
export function ProfitLossBadge({
  value,
  percentage,
  currency = '¥',
  showPercentage = true,
  className
}: {
  value: number;
  percentage?: number;
  currency?: string;
  showPercentage?: boolean;
  className?: string;
}) {
  return (
    <ProfitLossDisplay
      value={value}
      percentage={percentage}
      currency={currency}
      showPercentage={showPercentage}
      variant="badge"
      size="sm"
      className={className}
    />
  );
}

// 盈亏卡片组件
export function ProfitLossCard({
  value,
  percentage,
  currency = '¥',
  showPercentage = true,
  size = 'md',
  className
}: {
  value: number;
  percentage?: number;
  currency?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <ProfitLossDisplay
      value={value}
      percentage={percentage}
      currency={currency}
      showPercentage={showPercentage}
      variant="card"
      size={size}
      className={className}
    />
  );
}
