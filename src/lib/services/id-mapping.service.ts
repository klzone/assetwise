/**
 * ID映射服务
 * 解决本地数字ID与云端UUID之间的映射问题
 */

import { logger } from '@/lib/services/error-handler.service';

export interface IdMapping {
  accounts: Record<string, string>; // localId -> cloudUuid
  transactions: Record<string, string>; // localId -> cloudUuid
  assets: Record<string, string>; // localId -> cloudUuid
  investment_plans: Record<string, string>; // localId -> cloudUuid
  review_logs: Record<string, string>; // localId -> cloudUuid
  profiles: Record<string, string>; // localId -> cloudUuid
}

export interface MappedData {
  localId: string | number;
  cloudId: string;
  data: any;
}

class IdMappingService {
  private readonly MAPPING_KEY = 'assetwise_id_mapping';
  private readonly targetUserId = '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37';

  /**
   * 生成确定性UUID
   * 基于本地ID、用户ID和类型生成一致的UUID
   */
  private generateDeterministicUUID(localId: string, userId: string, type: string): string {
    const input = `${localId}-${userId}-${type}`;
    
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // 转换为正数并格式化为UUID
    const positiveHash = Math.abs(hash);
    const hex = positiveHash.toString(16).padStart(8, '0');
    
    // 生成UUID格式
    const uuid = [
      hex.substring(0, 8),
      hex.substring(0, 4),
      '4' + hex.substring(1, 4),
      '8' + hex.substring(1, 4),
      hex.repeat(3).substring(0, 12)
    ].join('-');
    
    return uuid;
  }

  /**
   * 获取ID映射表
   */
  public getIdMapping(): IdMapping {
    try {
      const mapping = localStorage.getItem(this.MAPPING_KEY);
      if (mapping) {
        return JSON.parse(mapping);
      }
    } catch (error) {
      logger.error('读取ID映射表失败', 'IdMappingService', error);
    }
    
    return {
      accounts: {},
      transactions: {},
      assets: {},
      investment_plans: {},
      review_logs: {},
      profiles: {}
    };
  }

  /**
   * 保存ID映射表
   */
  public saveIdMapping(mapping: IdMapping): void {
    try {
      localStorage.setItem(this.MAPPING_KEY, JSON.stringify(mapping));
      logger.info('ID映射表已保存', 'IdMappingService');
    } catch (error) {
      logger.error('保存ID映射表失败', 'IdMappingService', error);
    }
  }

  /**
   * 为本地ID生成或获取对应的云端UUID
   */
  public getOrCreateCloudId(localId: string | number, type: 'account' | 'transaction' | 'asset' | 'investment_plan' | 'review_log' | 'profile'): string {
    const localIdStr = String(localId);
    const mapping = this.getIdMapping();

    // 映射类型键名
    const typeKeyMap = {
      'account': 'accounts',
      'transaction': 'transactions',
      'asset': 'assets',
      'investment_plan': 'investment_plans',
      'review_log': 'review_logs',
      'profile': 'profiles'
    };

    const typeKey = typeKeyMap[type];
    if (!typeKey) {
      throw new Error(`不支持的数据类型: ${type}`);
    }

    // 确保映射对象存在
    if (!mapping[typeKey]) {
      mapping[typeKey] = {};
    }

    // 如果已存在映射，直接返回
    if (mapping[typeKey][localIdStr]) {
      return mapping[typeKey][localIdStr];
    }

    // 生成新的UUID
    const cloudId = this.generateDeterministicUUID(localIdStr, this.targetUserId, type);

    // 保存映射
    mapping[typeKey][localIdStr] = cloudId;
    this.saveIdMapping(mapping);

    logger.info(`创建ID映射: ${type} ${localIdStr} -> ${cloudId}`, 'IdMappingService');

    return cloudId;
  }

  /**
   * 根据云端UUID查找本地ID
   */
  public getLocalIdByCloudId(cloudId: string, type: 'account' | 'transaction' | 'asset' | 'investment_plan' | 'review_log' | 'profile'): string | null {
    const mapping = this.getIdMapping();

    // 映射类型键名
    const typeKeyMap = {
      'account': 'accounts',
      'transaction': 'transactions',
      'asset': 'assets',
      'investment_plan': 'investment_plans',
      'review_log': 'review_logs',
      'profile': 'profiles'
    };

    const typeKey = typeKeyMap[type];
    if (!typeKey) {
      return null;
    }

    // 确保映射对象存在
    if (!mapping[typeKey]) {
      return null;
    }

    for (const [localId, mappedCloudId] of Object.entries(mapping[typeKey])) {
      if (mappedCloudId === cloudId) {
        return localId;
      }
    }

    return null;
  }

  /**
   * 将本地账户数据转换为云端格式
   */
  public mapAccountToCloud(localAccount: any): any {
    const cloudId = this.getOrCreateCloudId(localAccount.id, 'account');
    
    return {
      id: cloudId,
      user_id: this.targetUserId,
      name: localAccount.name || '',
      type: localAccount.type || 'securities',
      currency: localAccount.currency || 'CNY',
      balance: Number(localAccount.balance) || 0,
      description: localAccount.description || '',
      created_at: localAccount.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 将本地交易数据转换为云端格式
   */
  public mapTransactionToCloud(localTransaction: any): any {
    const cloudId = this.getOrCreateCloudId(localTransaction.id, 'transaction');
    const cloudAccountId = this.getOrCreateCloudId(localTransaction.account_id, 'account');

    // 映射交易类型到数据库支持的枚举值
    const typeMapping: Record<string, string> = {
      'buy': 'buy',
      'sell': 'sell',
      'dividend': 'dividend',
      'transfer_in': 'buy',  // 转入映射为买入
      'transfer_out': 'sell', // 转出映射为卖出
      'deposit': 'buy',      // 存款映射为买入
      'withdrawal': 'sell'   // 取款映射为卖出
    };

    const mappedType = typeMapping[localTransaction.type] || 'buy';

    return {
      id: cloudId,
      user_id: this.targetUserId,
      account_id: cloudAccountId,
      symbol: localTransaction.symbol || '',
      name: localTransaction.name || '',
      type: mappedType,
      quantity: Number(localTransaction.quantity) || 0,
      price: Number(localTransaction.price) || 0,
      amount: Number(localTransaction.amount) || 0,
      fee: Number(localTransaction.fee) || 0,
      tax: Number(localTransaction.tax) || 0,
      currency: localTransaction.currency || 'CNY',
      exchange: localTransaction.exchange || '',
      notes: localTransaction.notes || '',
      transaction_date: localTransaction.transaction_date || new Date().toISOString(),
      created_at: localTransaction.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 将云端账户数据转换为本地格式
   */
  public mapAccountToLocal(cloudAccount: any): any {
    const localId = this.getLocalIdByCloudId(cloudAccount.id, 'account');
    
    return {
      id: localId ? Number(localId) : Date.now(), // 如果没有映射，生成新的本地ID
      user_id: this.targetUserId,
      name: cloudAccount.name,
      type: cloudAccount.type,
      currency: cloudAccount.currency,
      balance: Number(cloudAccount.balance),
      description: cloudAccount.description,
      created_at: cloudAccount.created_at,
      updated_at: cloudAccount.updated_at
    };
  }

  /**
   * 将云端交易数据转换为本地格式
   */
  public mapTransactionToLocal(cloudTransaction: any): any {
    const localId = this.getLocalIdByCloudId(cloudTransaction.id, 'transaction');
    const localAccountId = this.getLocalIdByCloudId(cloudTransaction.account_id, 'account');
    
    return {
      id: localId ? Number(localId) : Date.now(), // 如果没有映射，生成新的本地ID
      user_id: this.targetUserId,
      account_id: localAccountId ? Number(localAccountId) : null,
      symbol: cloudTransaction.symbol,
      name: cloudTransaction.name,
      type: cloudTransaction.type,
      quantity: Number(cloudTransaction.quantity),
      price: Number(cloudTransaction.price),
      amount: Number(cloudTransaction.amount),
      fee: Number(cloudTransaction.fee),
      tax: Number(cloudTransaction.tax),
      currency: cloudTransaction.currency,
      exchange: cloudTransaction.exchange,
      notes: cloudTransaction.notes,
      transaction_date: cloudTransaction.transaction_date,
      created_at: cloudTransaction.created_at,
      updated_at: cloudTransaction.updated_at
    };
  }

  /**
   * 批量映射账户数据到云端格式
   */
  public mapAccountsToCloud(localAccounts: any[]): any[] {
    return localAccounts.map(account => this.mapAccountToCloud(account));
  }

  /**
   * 批量映射交易数据到云端格式
   */
  public mapTransactionsToCloud(localTransactions: any[]): any[] {
    return localTransactions.map(transaction => this.mapTransactionToCloud(transaction));
  }

  /**
   * 清空ID映射表（用于重置）
   */
  public clearIdMapping(): void {
    localStorage.removeItem(this.MAPPING_KEY);
    logger.info('ID映射表已清空', 'IdMappingService');
  }

  /**
   * 将本地资产数据转换为云端格式
   */
  public mapAssetToCloud(localAsset: any): any {
    const cloudId = this.getOrCreateCloudId(localAsset.id, 'asset');
    const cloudAccountId = localAsset.account_id ? this.getOrCreateCloudId(localAsset.account_id, 'account') : null;

    return {
      id: cloudId,
      user_id: this.targetUserId,
      account_id: cloudAccountId,
      symbol: localAsset.symbol,
      name: localAsset.name,
      type: localAsset.type,
      current_price: Number(localAsset.current_price || localAsset.average_price || 0),
      quantity: Number(localAsset.quantity || 0),
      average_cost: Number(localAsset.average_cost || localAsset.average_price || 0),
      market_value: Number(localAsset.market_value || localAsset.total_value || 0),
      profit_loss: Number(localAsset.profit_loss || localAsset.profit || 0),
      profit_loss_percentage: Number(localAsset.profit_loss_percentage || localAsset.profit_percentage || 0),
      day_change: Number(localAsset.day_change || 0),
      day_change_rate: Number(localAsset.day_change_rate || 0),
      weight: Number(localAsset.weight || 0),
      volatility: localAsset.volatility ? Number(localAsset.volatility) : null,
      beta: localAsset.beta ? Number(localAsset.beta) : null,
      sharpe_ratio: localAsset.sharpe_ratio ? Number(localAsset.sharpe_ratio) : null,
      max_drawdown: localAsset.max_drawdown ? Number(localAsset.max_drawdown) : null,
      last_updated: localAsset.last_updated || new Date().toISOString(),
      created_at: localAsset.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 将本地投资计划数据转换为云端格式
   */
  public mapInvestmentPlanToCloud(localPlan: any): any {
    const cloudId = this.getOrCreateCloudId(localPlan.id, 'investment_plan');

    return {
      id: cloudId,
      user_id: this.targetUserId,
      name: localPlan.title || localPlan.name,
      title: localPlan.title || localPlan.name,
      description: localPlan.description,
      target_amount: Number(localPlan.target_amount || 0),
      current_amount: Number(localPlan.current_amount || 0),
      target_date: localPlan.target_date,
      status: localPlan.status || 'active',
      risk_level: localPlan.risk_level || 'medium',
      category: localPlan.category || 'stock',
      expected_return: Number(localPlan.expected_return || 0),
      actual_return: Number(localPlan.actual_return || 0),
      created_at: localPlan.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 将本地复盘日志数据转换为云端格式
   */
  public mapReviewLogToCloud(localReview: any): any {
    const cloudId = this.getOrCreateCloudId(localReview.id, 'review_log');

    return {
      id: cloudId,
      user_id: this.targetUserId,
      title: localReview.title,
      content: localReview.content,
      emotion_score: localReview.emotion_score ? Number(localReview.emotion_score) : null,
      tags: Array.isArray(localReview.tags) ? localReview.tags : [],
      related_transactions: Array.isArray(localReview.related_transactions) ? localReview.related_transactions : [],
      review_date: localReview.review_date || new Date().toISOString(),
      created_at: localReview.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 获取映射统计信息
   */
  public getMappingStats(): {
    accountMappings: number;
    transactionMappings: number;
    assetMappings: number;
    investmentPlanMappings: number;
    reviewLogMappings: number;
    profileMappings: number;
    totalMappings: number;
  } {
    const mapping = this.getIdMapping();

    const accountMappings = Object.keys(mapping.accounts).length;
    const transactionMappings = Object.keys(mapping.transactions).length;
    const assetMappings = Object.keys(mapping.assets).length;
    const investmentPlanMappings = Object.keys(mapping.investment_plans).length;
    const reviewLogMappings = Object.keys(mapping.review_logs).length;
    const profileMappings = Object.keys(mapping.profiles).length;

    return {
      accountMappings,
      transactionMappings,
      assetMappings,
      investmentPlanMappings,
      reviewLogMappings,
      profileMappings,
      totalMappings: accountMappings + transactionMappings + assetMappings + investmentPlanMappings + reviewLogMappings + profileMappings
    };
  }
}

export const idMappingService = new IdMappingService();
