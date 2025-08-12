"use client"

import React from 'react';
import { Crown, Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VipBadgeProps {
  subscriptionType: 'free' | 'professional' | 'flagship';
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function VipBadge({ subscriptionType, variant = 'default', className }: VipBadgeProps) {
  if (subscriptionType === 'free') {
    return null;
  }

  const getIcon = () => {
    switch (subscriptionType) {
      case 'professional':
        return <Crown className="h-3 w-3" />;
      case 'flagship':
        return <Gem className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getText = () => {
    switch (subscriptionType) {
      case 'professional':
        return '专业版';
      case 'flagship':
        return '旗舰版';
      default:
        return '';
    }
  };

  const getVariantStyles = () => {
    switch (subscriptionType) {
      case 'professional':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400';
      case 'flagship':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400';
      default:
        return '';
    }
  };

  if (variant === 'icon-only') {
    return (
      <div className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-full',
        getVariantStyles(),
        className
      )}>
        {getIcon()}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Badge 
        className={cn(
          'text-xs font-medium px-2 py-0.5 gap-1',
          getVariantStyles(),
          className
        )}
      >
        {getIcon()}
        {getText()}
      </Badge>
    );
  }

  return (
    <Badge 
      className={cn(
        'text-sm font-medium px-3 py-1 gap-1.5',
        getVariantStyles(),
        className
      )}
    >
      {getIcon()}
      {getText()}
    </Badge>
  );
}

// VIP功能标识组件
interface VipFeatureBadgeProps {
  className?: string;
}

export function VipFeatureBadge({ className }: VipFeatureBadgeProps) {
  return (
    <Badge 
      className={cn(
        'text-xs font-medium px-2 py-0.5 gap-1',
        'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-400',
        className
      )}
    >
      <Crown className="h-3 w-3" />
      专业版
    </Badge>
  );
}

// VIP用户欢迎组件
interface VipWelcomeProps {
  username: string;
  subscriptionType: 'pro' | 'premium';
  className?: string;
}

export function VipWelcome({ username, subscriptionType, className }: VipWelcomeProps) {
  const getWelcomeMessage = () => {
    switch (subscriptionType) {
      case 'pro':
        return `欢迎回来，${username}！感谢您对AssetWise专业版的支持 ✨`;
      case 'premium':
        return `欢迎回来，${username}！尊享AssetWise旗舰版专属体验 💎`;
      default:
        return `欢迎回来，${username}！`;
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 border-dashed',
      subscriptionType === 'pro' && 'border-amber-300 bg-amber-50 dark:bg-amber-950/20',
      subscriptionType === 'premium' && 'border-purple-300 bg-purple-50 dark:bg-purple-950/20',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <VipBadge subscriptionType={subscriptionType} variant="compact" />
        <span className="text-sm font-medium text-muted-foreground">VIP用户</span>
      </div>
      <p className="text-sm text-foreground">
        {getWelcomeMessage()}
      </p>
    </div>
  );
}
