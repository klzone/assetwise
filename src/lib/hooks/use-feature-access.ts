import { useUserStore } from '@/store';
import { featureAccessService, type FeatureLimits, type SubscriptionType } from '@/lib/services/feature-access.service';

/**
 * 功能权限检查Hook
 */
export function useFeatureAccess() {
  const { user } = useUserStore();
  const subscriptionType = (user?.subscription_type || 'free') as SubscriptionType;

  /**
   * 检查是否可以使用特定功能
   */
  const canUseFeature = (feature: keyof FeatureLimits): boolean => {
    return featureAccessService.canUseFeature(subscriptionType, feature);
  };

  /**
   * 检查是否在数量限制内
   */
  const isWithinLimit = (feature: 'maxAccounts' | 'maxTransactions' | 'maxPlans', currentCount: number): boolean => {
    return featureAccessService.isWithinLimit(subscriptionType, feature, currentCount);
  };

  /**
   * 获取功能限制信息
   */
  const getFeatureLimits = (): FeatureLimits => {
    return featureAccessService.getFeatureLimits(subscriptionType);
  };

  /**
   * 获取升级提示信息
   */
  const getUpgradeMessage = (feature: keyof FeatureLimits): string => {
    return featureAccessService.getUpgradeMessage(feature);
  };

  /**
   * 检查是否为付费用户
   */
  const isPaidUser = (): boolean => {
    return subscriptionType !== 'free';
  };

  /**
   * 检查是否为专业版用户
   */
  const isProfessionalUser = (): boolean => {
    return subscriptionType === 'professional' || subscriptionType === 'flagship';
  };

  /**
   * 检查是否为旗舰版用户
   */
  const isFlagshipUser = (): boolean => {
    return subscriptionType === 'flagship';
  };

  return {
    subscriptionType,
    canUseFeature,
    isWithinLimit,
    getFeatureLimits,
    getUpgradeMessage,
    isPaidUser,
    isProfessionalUser,
    isFlagshipUser,
  };
}
