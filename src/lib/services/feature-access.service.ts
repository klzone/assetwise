/**
 * 功能权限控制服务
 * 根据用户订阅类型控制功能访问权限
 */

export type SubscriptionType = 'free' | 'professional' | 'flagship';

export interface FeatureLimits {
  // 账户限制
  maxAccounts: number;
  // 交易记录限制（-1表示无限制）
  maxTransactions: number;
  // 投资计划限制
  maxPlans: number;
  // 资产分析功能
  assetAnalysis: boolean;
  // 软件诊断功能
  systemDiagnostics: boolean;
  // 云端存储
  cloudStorage: boolean;
  // 自动备份
  autoBackup: boolean;
  // 高级图表
  advancedCharts: boolean;
  // 数据导入导出
  dataImportExport: boolean;
  // 营销邮件控制
  noMarketingEmails: boolean;
  // AI功能
  aiFeatures: boolean;
  // PDF报告生成和分享
  pdfReports: boolean;
  // 优先客服支持
  prioritySupport: boolean;
  // API访问
  apiAccess: boolean;
}

class FeatureAccessService {
  private featureLimits: Record<SubscriptionType, FeatureLimits> = {
    free: {
      maxAccounts: 9,
      maxTransactions: 1000, // 限制1000条
      maxPlans: 10,
      assetAnalysis: false,
      systemDiagnostics: false,
      cloudStorage: false,
      autoBackup: false,
      advancedCharts: false,
      dataImportExport: true,
      noMarketingEmails: false,
      aiFeatures: false,
      pdfReports: false,
      prioritySupport: false,
      apiAccess: false,
    },
    professional: {
      maxAccounts: -1, // 无限制
      maxTransactions: -1, // 无限制
      maxPlans: -1, // 无限制
      assetAnalysis: true,
      systemDiagnostics: true,
      cloudStorage: true,
      autoBackup: true,
      advancedCharts: true,
      dataImportExport: true,
      noMarketingEmails: true,
      aiFeatures: false,
      pdfReports: false,
      prioritySupport: false,
      apiAccess: false,
    },
    flagship: {
      maxAccounts: -1, // 无限制
      maxTransactions: -1, // 无限制
      maxPlans: -1, // 无限制
      assetAnalysis: true,
      systemDiagnostics: true,
      cloudStorage: true,
      autoBackup: true,
      advancedCharts: true,
      dataImportExport: true,
      noMarketingEmails: true,
      aiFeatures: true,
      pdfReports: true,
      prioritySupport: true,
      apiAccess: true,
    },
  };

  /**
   * 获取用户的功能限制
   */
  getFeatureLimits(subscriptionType: SubscriptionType): FeatureLimits {
    return this.featureLimits[subscriptionType] || this.featureLimits.free;
  }

  /**
   * 检查用户是否可以使用特定功能
   */
  canUseFeature(subscriptionType: SubscriptionType, feature: keyof FeatureLimits): boolean {
    const limits = this.getFeatureLimits(subscriptionType);
    return limits[feature] as boolean;
  }

  /**
   * 检查用户是否达到数量限制
   */
  isWithinLimit(subscriptionType: SubscriptionType, feature: 'maxAccounts' | 'maxTransactions' | 'maxPlans', currentCount: number): boolean {
    const limits = this.getFeatureLimits(subscriptionType);
    const limit = limits[feature] as number;
    return limit === -1 || currentCount < limit;
  }

  /**
   * 获取功能的升级提示信息
   */
  getUpgradeMessage(feature: keyof FeatureLimits): string {
    const messages: Record<keyof FeatureLimits, string> = {
      maxAccounts: '升级到专业版以支持99个账户，旗舰版无限制',
      maxTransactions: '所有版本都支持无限制交易记录',
      maxPlans: '升级到专业版以创建无限制投资计划',
      assetAnalysis: '升级到专业版以使用资产分析功能',
      systemDiagnostics: '升级到专业版以使用软件诊断功能',
      cloudStorage: '升级到专业版以启用云端数据同步',
      autoBackup: '升级到专业版以启用自动备份',
      advancedCharts: '升级到专业版以使用高级图表功能',
      dataImportExport: '所有版本都支持数据导入导出',
      noMarketingEmails: '升级到专业版以禁止营销邮件',
      aiFeatures: '升级到旗舰版以使用AI智能功能',
      pdfReports: '升级到旗舰版以使用PDF报告功能',
      prioritySupport: '升级到旗舰版以获得优先客服支持',
      apiAccess: '升级到旗舰版以获得API访问权限',
    };
    return messages[feature] || '升级以解锁更多功能';
  }

  /**
   * 获取版本功能对比
   */
  getVersionComparison() {
    return {
      free: {
        name: '免费版',
        price: '免费',
        features: [
          '仪表盘（基础资产汇总）',
          '账户管理（最多9个账户）',
          '交易记录（最多1000条）',
          '基础复盘日志',
          '投资计划（最多10个）',
          '数据导入和导出功能',
          '本地数据存储'
        ],
        limitations: [
          '无资产分析功能',
          '无云端同步',
          '无软件诊断',
          '无高级图表'
        ]
      },
      professional: {
        name: '专业版',
        price: '¥9.9 买断',
        features: [
          '包含免费版所有功能',
          '无限制投资账户',
          '无限制交易记录',
          '资产分析功能',
          '软件诊断功能',
          '高级图表展示',
          '云端数据同步',
          '自动备份',
          '禁止营销邮件',
          '无限制投资计划'
        ]
      },
      flagship: {
        name: '旗舰版',
        price: '¥29.9/月',
        features: [
          '包含专业版所有功能',
          'AI投资建议',
          'AI复盘分析',
          '智能风险评估',
          'PDF报告生成和分享',
          '优先客服支持',
          'API接口访问',
          '实时操作建议'
        ]
      }
    };
  }
}

export const featureAccessService = new FeatureAccessService();
