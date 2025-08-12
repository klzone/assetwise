'use client'

import React from 'react';
import { Crown, Gem, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess } from '@/lib/hooks/use-feature-access';
import { useRouter } from 'next/navigation';
import type { FeatureLimits } from '@/lib/services/feature-access.service';

interface FeatureGateProps {
  feature: keyof FeatureLimits;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * 功能权限门控组件
 * 根据用户订阅状态控制功能访问
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { canUseFeature, getUpgradeMessage, subscriptionType } = useFeatureAccess();
  const router = useRouter();

  const hasAccess = canUseFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  // 默认升级提示
  return (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <CardTitle className="text-lg">功能需要升级</CardTitle>
        <CardDescription>
          {getUpgradeMessage(feature)}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={() => router.push('/upgrade')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Crown className="h-4 w-4 mr-2" />
          立即升级
        </Button>
      </CardContent>
    </Card>
  );
}

interface LimitCheckProps {
  feature: 'maxAccounts' | 'maxTransactions' | 'maxPlans';
  currentCount: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 数量限制检查组件
 */
export function LimitCheck({ 
  feature, 
  currentCount, 
  children, 
  fallback 
}: LimitCheckProps) {
  const { isWithinLimit, getFeatureLimits, getUpgradeMessage } = useFeatureAccess();
  const router = useRouter();

  const withinLimit = isWithinLimit(feature, currentCount);
  const limits = getFeatureLimits();
  const maxLimit = limits[feature] as number;

  if (withinLimit) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // 默认限制提示
  return (
    <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-amber-100">
            <Crown className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <CardTitle className="text-lg text-amber-800">
          已达到使用限制
        </CardTitle>
        <CardDescription className="text-amber-700">
          {maxLimit === -1 ? '无限制' : `当前限制: ${maxLimit}个`}
          <br />
          {getUpgradeMessage(feature)}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={() => router.push('/upgrade')}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
        >
          <Crown className="h-4 w-4 mr-2" />
          升级解锁
        </Button>
      </CardContent>
    </Card>
  );
}

interface FeatureBadgeProps {
  feature: keyof FeatureLimits;
  className?: string;
}

/**
 * 功能标识徽章
 * 显示功能需要的订阅级别
 */
export function FeatureBadge({ feature, className }: FeatureBadgeProps) {
  const { canUseFeature, subscriptionType } = useFeatureAccess();

  const hasAccess = canUseFeature(feature);

  if (hasAccess) {
    return null;
  }

  // 根据功能确定需要的订阅级别
  const getRequiredLevel = (feature: keyof FeatureLimits) => {
    const professionalFeatures: (keyof FeatureLimits)[] = [
      'cloudStorage', 'advancedAnalytics', 'batchImport', 
      'customTags', 'dataBackup', 'advancedReports'
    ];
    
    const flagshipFeatures: (keyof FeatureLimits)[] = [
      'aiFeatures', 'apiAccess', 'teamCollaboration'
    ];

    if (flagshipFeatures.includes(feature)) {
      return { level: 'flagship', text: '旗舰版', icon: Gem, color: 'bg-purple-500' };
    } else if (professionalFeatures.includes(feature)) {
      return { level: 'professional', text: '专业版', icon: Crown, color: 'bg-blue-500' };
    }
    
    return { level: 'professional', text: '专业版', icon: Crown, color: 'bg-blue-500' };
  };

  const required = getRequiredLevel(feature);
  const Icon = required.icon;

  return (
    <Badge 
      variant="secondary" 
      className={`${required.color} text-white text-xs ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {required.text}
    </Badge>
  );
}
