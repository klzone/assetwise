/**
 * 自动同步服务 - 集成到各个页面中的数据同步功能
 * 基于成功的浏览器控制台脚本实现
 */

import { logger } from '@/lib/services/error-handler.service';
import { idMappingService } from '@/lib/services/id-mapping.service';

export interface SyncResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: string[];
  message: string;
}

export interface ChangedItem {
  type: 'account' | 'transaction' | 'asset' | 'investment_plan' | 'review_log' | 'profile';
  operation: 'upsert';
  data: any;
}

class AutoSyncService {
  private isSupabaseLoaded = false;
  private supabaseClient: any = null;
  private syncInProgress = false;
  private autoSyncTimer: NodeJS.Timeout | null = null;
  private readonly serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE2NTI2OCwiZXhwIjoyMDYzNzQxMjY4fQ.xFfLjnbxPAI_A3cBoG42VG09RjFaBYOPZMKZQH7nBCE';
  private readonly supabaseUrl = 'https://luhqkfsdffkmpwqyjjyh.supabase.co';
  private readonly userId = '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37';

  /**
   * 确保Supabase库已加载
   */
  private async ensureSupabaseLoaded(): Promise<boolean> {
    if (this.isSupabaseLoaded && this.supabaseClient) {
      return true;
    }

    logger.info('检查Supabase库...', 'auto-sync');

    try {
      // 尝试使用本地安装的Supabase库
      try {
        const { createClient } = await import('@supabase/supabase-js');
        logger.info('使用本地安装的Supabase库', 'auto-sync');
        this.supabaseClient = createClient(this.supabaseUrl, this.serviceKey);
        this.isSupabaseLoaded = true;
        logger.info('✅ Supabase客户端创建成功', 'auto-sync');
        return true;
      } catch (importError) {
        logger.warn('本地Supabase库不可用，尝试CDN加载', 'auto-sync', importError);
      }

      // 检查是否已经在window对象中
      if (typeof window !== 'undefined' && (window as any).supabase) {
        logger.info('Supabase库已存在', 'auto-sync');
        this.supabaseClient = (window as any).supabase.createClient(this.supabaseUrl, this.serviceKey);
        this.isSupabaseLoaded = true;
        return true;
      }

      logger.info('开始从CDN加载Supabase库...', 'auto-sync');

      // 动态加载Supabase库
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.type = 'text/javascript';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          logger.info('CDN Supabase库加载成功', 'auto-sync');
          resolve();
        };
        script.onerror = () => {
          logger.error('CDN Supabase库加载失败', 'auto-sync');
          reject(new Error('Failed to load Supabase from CDN'));
        };

        // 设置超时 - 减少到3秒
        setTimeout(() => {
          logger.error('Supabase库加载超时', 'auto-sync');
          reject(new Error('Supabase library load timeout'));
        }, 3000);

        document.head.appendChild(script);
      });

      // 等待库初始化
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (typeof window !== 'undefined' && (window as any).supabase) {
        this.supabaseClient = (window as any).supabase.createClient(this.supabaseUrl, this.serviceKey);
        this.isSupabaseLoaded = true;
        logger.info('✅ Supabase客户端创建成功', 'auto-sync');
        return true;
      } else {
        logger.error('Supabase库加载后仍不可用', 'auto-sync');
        return false;
      }
    } catch (error) {
      logger.error('Supabase库加载异常', 'auto-sync', error);
      return false;
    }
  }

  /**
   * 获取所有账户数据（支持多种存储键）
   */
  private getAllAccounts(): any[] {
    try {
      const standardAccounts = JSON.parse(localStorage.getItem('assetwise_accounts') || '[]');
      const directAccounts = JSON.parse(localStorage.getItem('assetwise_accounts_direct') || '[]');

      logger.info(`读取账户数据: 标准存储 ${standardAccounts.length} 个, 直接存储 ${directAccounts.length} 个`, 'auto-sync');

      // 合并并去重（以ID为准）
      const allAccounts = [...standardAccounts, ...directAccounts];
      const uniqueAccounts = allAccounts.filter((account, index, self) =>
        index === self.findIndex(a => a.id === account.id)
      );

      // 标准化用户ID和ID格式
      const normalizedAccounts = uniqueAccounts.map(account => ({
        ...account,
        id: String(account.id), // 确保ID是字符串格式
        user_id: this.userId // 统一使用目标用户ID
      }));

      logger.info(`合并后账户数据: ${normalizedAccounts.length} 个`, 'auto-sync');
      return normalizedAccounts;
    } catch (error) {
      logger.error('获取账户数据失败', 'auto-sync', error);
      return [];
    }
  }

  /**
   * 获取所有交易数据（支持多种存储键）
   */
  private getAllTransactions(): any[] {
    try {
      const standardTransactions = JSON.parse(localStorage.getItem('assetwise_transactions') || '[]');
      const directTransactions = JSON.parse(localStorage.getItem('assetwise_transactions_direct') || '[]');

      logger.info(`读取交易数据: 标准存储 ${standardTransactions.length} 个, 直接存储 ${directTransactions.length} 个`, 'auto-sync');

      // 合并并去重（以ID为准）
      const allTransactions = [...standardTransactions, ...directTransactions];
      const uniqueTransactions = allTransactions.filter((transaction, index, self) =>
        index === self.findIndex(t => t.id === transaction.id)
      );

      // 标准化用户ID和ID格式
      const normalizedTransactions = uniqueTransactions.map(transaction => ({
        ...transaction,
        id: String(transaction.id), // 确保ID是字符串格式
        account_id: String(transaction.account_id), // 确保account_id是字符串格式
        user_id: this.userId // 统一使用目标用户ID
      }));

      logger.info(`合并后交易数据: ${normalizedTransactions.length} 个`, 'auto-sync');
      return normalizedTransactions;
    } catch (error) {
      logger.error('获取交易数据失败', 'auto-sync', error);
      return [];
    }
  }

  /**
   * 获取所有资产数据
   */
  private getAllAssets(): any[] {
    try {
      const assets = JSON.parse(localStorage.getItem('assetwise_assets') || '[]');
      logger.info(`读取资产数据: ${assets.length} 个`, 'auto-sync');
      return assets;
    } catch (error) {
      logger.error('获取资产数据失败', 'auto-sync', error);
      return [];
    }
  }

  /**
   * 获取所有投资计划数据
   */
  private getAllInvestmentPlans(): any[] {
    try {
      const standardPlans = JSON.parse(localStorage.getItem('assetwise_investment_plans') || '[]');
      const directPlans = JSON.parse(localStorage.getItem('assetwise_plans_direct') || '[]');

      const allPlans = [...standardPlans, ...directPlans];
      logger.info(`读取投资计划数据: 标准存储 ${standardPlans.length} 个, 直接存储 ${directPlans.length} 个`, 'auto-sync');
      return allPlans;
    } catch (error) {
      logger.error('获取投资计划数据失败', 'auto-sync', error);
      return [];
    }
  }

  /**
   * 获取所有复盘日志数据
   */
  private getAllReviewLogs(): any[] {
    try {
      const standardReviews = JSON.parse(localStorage.getItem('assetwise_reviews') || '[]');
      const directReviews = JSON.parse(localStorage.getItem('assetwise_reviews_direct') || '[]');

      const allReviews = [...standardReviews, ...directReviews];
      logger.info(`读取复盘日志数据: 标准存储 ${standardReviews.length} 个, 直接存储 ${directReviews.length} 个`, 'auto-sync');
      return allReviews;
    } catch (error) {
      logger.error('获取复盘日志数据失败', 'auto-sync', error);
      return [];
    }
  }

  /**
   * 获取用户档案数据
   */
  private getUserProfile(): any | null {
    try {
      const profile = JSON.parse(localStorage.getItem('assetwise_current_user') || 'null');
      logger.info(`读取用户档案数据: ${profile ? '已找到' : '未找到'}`, 'auto-sync');
      return profile;
    } catch (error) {
      logger.error('获取用户档案数据失败', 'auto-sync', error);
      return null;
    }
  }

  /**
   * 检测数据变化
   */
  private detectDataChanges(): ChangedItem[] {
    logger.info('检测数据变化...', 'auto-sync');

    const currentAccounts = this.getAllAccounts();
    const currentTransactions = this.getAllTransactions();
    const currentAssets = this.getAllAssets();
    const currentInvestmentPlans = this.getAllInvestmentPlans();
    const currentReviewLogs = this.getAllReviewLogs();
    const currentProfile = this.getUserProfile();

    const lastSyncAccounts = JSON.parse(localStorage.getItem('assetwise_last_sync_accounts') || '[]');
    const lastSyncTransactions = JSON.parse(localStorage.getItem('assetwise_last_sync_transactions') || '[]');
    const lastSyncAssets = JSON.parse(localStorage.getItem('assetwise_last_sync_assets') || '[]');
    const lastSyncInvestmentPlans = JSON.parse(localStorage.getItem('assetwise_last_sync_investment_plans') || '[]');
    const lastSyncReviewLogs = JSON.parse(localStorage.getItem('assetwise_last_sync_review_logs') || '[]');
    const lastSyncProfile = JSON.parse(localStorage.getItem('assetwise_last_sync_profile') || 'null');

    const changedItems: ChangedItem[] = [];

    // 检测账户变化
    currentAccounts.forEach((account: any) => {
      const lastSyncAccount = lastSyncAccounts.find((a: any) => String(a.id) === String(account.id));

      if (!lastSyncAccount) {
        changedItems.push({ type: 'account', operation: 'upsert', data: account });
        logger.info(`发现新增账户: ${account.name} (ID: ${account.id})`, 'auto-sync');
      } else {
        const hasChanged = JSON.stringify(account) !== JSON.stringify(lastSyncAccount);
        if (hasChanged) {
          changedItems.push({ type: 'account', operation: 'upsert', data: account });
          logger.info(`发现变化账户: ${account.name} (ID: ${account.id})`, 'auto-sync');
        }
      }
    });

    // 检测交易变化
    currentTransactions.forEach((transaction: any) => {
      const lastSyncTransaction = lastSyncTransactions.find((t: any) => String(t.id) === String(transaction.id));

      if (!lastSyncTransaction) {
        changedItems.push({ type: 'transaction', operation: 'upsert', data: transaction });
        logger.info(`发现新增交易: ${transaction.symbol} (ID: ${transaction.id})`, 'auto-sync');
      } else {
        const hasChanged = JSON.stringify(transaction) !== JSON.stringify(lastSyncTransaction);
        if (hasChanged) {
          changedItems.push({ type: 'transaction', operation: 'upsert', data: transaction });
          logger.info(`发现变化交易: ${transaction.symbol} (ID: ${transaction.id})`, 'auto-sync');
        }
      }
    });

    // 检测资产变化
    currentAssets.forEach((asset: any) => {
      const lastSyncAsset = lastSyncAssets.find((a: any) => String(a.id) === String(asset.id));

      if (!lastSyncAsset) {
        changedItems.push({ type: 'asset', operation: 'upsert', data: asset });
        logger.info(`发现新增资产: ${asset.name} (ID: ${asset.id})`, 'auto-sync');
      } else {
        const hasChanged = JSON.stringify(asset) !== JSON.stringify(lastSyncAsset);
        if (hasChanged) {
          changedItems.push({ type: 'asset', operation: 'upsert', data: asset });
          logger.info(`发现变化资产: ${asset.name} (ID: ${asset.id})`, 'auto-sync');
        }
      }
    });

    // 检测投资计划变化
    currentInvestmentPlans.forEach((plan: any) => {
      const lastSyncPlan = lastSyncInvestmentPlans.find((p: any) => String(p.id) === String(plan.id));

      if (!lastSyncPlan) {
        changedItems.push({ type: 'investment_plan', operation: 'upsert', data: plan });
        logger.info(`发现新增投资计划: ${plan.title || plan.name} (ID: ${plan.id})`, 'auto-sync');
      } else {
        const hasChanged = JSON.stringify(plan) !== JSON.stringify(lastSyncPlan);
        if (hasChanged) {
          changedItems.push({ type: 'investment_plan', operation: 'upsert', data: plan });
          logger.info(`发现变化投资计划: ${plan.title || plan.name} (ID: ${plan.id})`, 'auto-sync');
        }
      }
    });

    // 检测复盘日志变化
    currentReviewLogs.forEach((review: any) => {
      const lastSyncReview = lastSyncReviewLogs.find((r: any) => String(r.id) === String(review.id));

      if (!lastSyncReview) {
        changedItems.push({ type: 'review_log', operation: 'upsert', data: review });
        logger.info(`发现新增复盘日志: ${review.title} (ID: ${review.id})`, 'auto-sync');
      } else {
        const hasChanged = JSON.stringify(review) !== JSON.stringify(lastSyncReview);
        if (hasChanged) {
          changedItems.push({ type: 'review_log', operation: 'upsert', data: review });
          logger.info(`发现变化复盘日志: ${review.title} (ID: ${review.id})`, 'auto-sync');
        }
      }
    });

    // 检测用户档案变化
    if (currentProfile) {
      if (!lastSyncProfile) {
        changedItems.push({ type: 'profile', operation: 'upsert', data: currentProfile });
        logger.info(`发现新增用户档案: ${currentProfile.username || currentProfile.email}`, 'auto-sync');
      } else {
        const hasChanged = JSON.stringify(currentProfile) !== JSON.stringify(lastSyncProfile);
        if (hasChanged) {
          changedItems.push({ type: 'profile', operation: 'upsert', data: currentProfile });
          logger.info(`发现变化用户档案: ${currentProfile.username || currentProfile.email}`, 'auto-sync');
        }
      }
    }

    logger.info(`总计发现 ${changedItems.length} 项变化`, 'auto-sync');
    return changedItems;
  }

  /**
   * 按照依赖关系排序同步项目
   * 确保账户在交易记录之前同步，避免外键约束错误
   */
  private sortItemsByDependency(items: ChangedItem[]): ChangedItem[] {
    const typeOrder = {
      'account': 1,      // 账户最先同步
      'asset': 2,        // 资产其次
      'transaction': 3,  // 交易记录依赖账户
      'investment_plan': 4, // 投资计划依赖账户
      'review': 5        // 复盘日志最后
    };

    return items.sort((a, b) => {
      const orderA = typeOrder[a.type as keyof typeof typeOrder] || 999;
      const orderB = typeOrder[b.type as keyof typeof typeOrder] || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // 同类型按时间戳排序
      return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
    });
  }

  /**
   * 使用服务密钥同步数据
   */
  private async syncWithServiceKey(changedItems: ChangedItem[]): Promise<SyncResult> {
    logger.info('使用服务密钥同步数据...', 'auto-sync');

    if (changedItems.length === 0) {
      logger.info('没有变化数据需要同步', 'auto-sync');
      return { success: true, successCount: 0, errorCount: 0, errors: [], message: '没有变化数据' };
    }

    try {
      if (!this.supabaseClient) {
        logger.error('Supabase客户端不可用', 'auto-sync');
        return { success: false, successCount: 0, errorCount: 0, errors: ['Supabase客户端不可用'], message: 'Supabase客户端不可用' };
      }

      logger.info('服务密钥客户端创建成功', 'auto-sync');
      logger.info(`使用用户ID: ${this.userId}`, 'auto-sync');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // 按照依赖关系排序：账户 -> 资产 -> 交易记录 -> 投资计划 -> 复盘日志
      const sortedItems = this.sortItemsByDependency(changedItems);
      logger.info(`排序后的同步顺序: ${sortedItems.map(item => `${item.type}(${item.data.name || item.data.symbol || item.data.id})`).join(' -> ')}`, 'auto-sync');

      // 处理每个变化项目
      for (const item of sortedItems) {
        try {
          logger.info(`同步 ${item.type}: ${item.data.name || item.data.symbol}`, 'auto-sync');

          if (item.type === 'account') {
            // 使用ID映射服务转换账户数据
            const accountData = idMappingService.mapAccountToCloud(item.data);

            logger.info(`准备同步账户: ${item.data.name}, 本地ID: ${item.data.id}, 云端ID: ${accountData.id}`, 'auto-sync');

            const { data, error } = await this.supabaseClient
              .from('accounts')
              .upsert([accountData])
              .select();

            if (error) {
              logger.error(`账户同步失败: ${error.message}`, 'auto-sync', error);
              errorCount++;
              errors.push(`account ${item.data.name}: ${error.message}`);
            } else {
              logger.info(`账户同步成功`, 'auto-sync', data);
              successCount++;
            }

          } else if (item.type === 'transaction') {
            // 使用ID映射服务转换交易数据
            const transactionData = idMappingService.mapTransactionToCloud(item.data);

            logger.info(`准备同步交易: ${item.data.symbol}, 本地ID: ${item.data.id}, 云端ID: ${transactionData.id}, 本地account_id: ${item.data.account_id}, 云端account_id: ${transactionData.account_id}`, 'auto-sync');

            // 验证账户是否存在
            if (transactionData.account_id) {
              const { data: accountExists } = await this.supabaseClient
                .from('accounts')
                .select('id')
                .eq('id', transactionData.account_id)
                .single();

              if (!accountExists) {
                logger.error(`交易同步失败: 引用的账户不存在 (account_id: ${transactionData.account_id})`, 'auto-sync');
                errorCount++;
                errors.push(`transaction ${item.data.symbol}: 引用的账户不存在`);
                continue; // 跳过这个交易记录
              }
            }

            const { data, error } = await this.supabaseClient
              .from('transactions')
              .upsert([transactionData])
              .select();

            if (error) {
              logger.error(`交易同步失败: ${error.message}`, 'auto-sync', error);
              errorCount++;
              errors.push(`transaction ${item.data.symbol}: ${error.message}`);
            } else {
              logger.info(`交易同步成功`, 'auto-sync', data);
              successCount++;
            }

          } else if (item.type === 'asset') {
            try {
              // 使用ID映射服务转换资产数据
              const assetData = idMappingService.mapAssetToCloud(item.data);

              logger.info(`准备同步资产: ${item.data.name}, 本地ID: ${item.data.id}, 云端ID: ${assetData.id}`, 'auto-sync');

              const { data, error } = await this.supabaseClient
                .from('assets')
                .upsert([assetData])
                .select();

              if (error) {
                logger.error(`资产同步失败: ${error.message}`, 'auto-sync', error);
                errorCount++;
                errors.push(`asset ${item.data.name}: ${error.message}`);
              } else {
                logger.info(`资产同步成功`, 'auto-sync', data);
                successCount++;
              }
            } catch (error) {
              logger.error(`asset 同步异常`, 'auto-sync', error);
              errorCount++;
              errors.push(`asset ${item.data.name || 'unknown'}: ${error.message}`);
            }

          } else if (item.type === 'investment_plan') {
            try {
              // 使用ID映射服务转换投资计划数据
              const planData = idMappingService.mapInvestmentPlanToCloud(item.data);

              logger.info(`准备同步投资计划: ${item.data.title || item.data.name}, 本地ID: ${item.data.id}, 云端ID: ${planData.id}`, 'auto-sync');

              const { data, error } = await this.supabaseClient
                .from('investment_plans')
                .upsert([planData])
                .select();

              if (error) {
                logger.error(`投资计划同步失败: ${error.message}`, 'auto-sync', error);
                errorCount++;
                errors.push(`investment_plan ${item.data.title || item.data.name}: ${error.message}`);
              } else {
                logger.info(`投资计划同步成功`, 'auto-sync', data);
                successCount++;
              }
            } catch (error) {
              logger.error(`investment_plan 同步异常`, 'auto-sync', error);
              errorCount++;
              errors.push(`investment_plan ${item.data.title || item.data.name || 'unknown'}: ${error.message}`);
            }

          } else if (item.type === 'review_log') {
            try {
              // 使用ID映射服务转换复盘日志数据
              const reviewData = idMappingService.mapReviewLogToCloud(item.data);

              logger.info(`准备同步复盘日志: ${item.data.title}, 本地ID: ${item.data.id}, 云端ID: ${reviewData.id}`, 'auto-sync');

              const { data, error } = await this.supabaseClient
                .from('reviews')
                .upsert([reviewData])
                .select();

              if (error) {
                logger.error(`复盘日志同步失败: ${error.message}`, 'auto-sync', error);
                errorCount++;
                errors.push(`review_log ${item.data.title}: ${error.message}`);
              } else {
                logger.info(`复盘日志同步成功`, 'auto-sync', data);
                successCount++;
              }
            } catch (error) {
              logger.error(`review_log 同步异常`, 'auto-sync', error);
              errorCount++;
              errors.push(`review_log ${item.data.title || 'unknown'}: ${error.message}`);
            }

          } else if (item.type === 'profile') {
            // 用户档案直接使用用户ID，不需要映射
            const profileData = {
              id: this.userId,
              email: item.data.email,
              username: item.data.username,
              full_name: item.data.full_name,
              avatar_url: item.data.avatar_url,
              phone: item.data.phone,
              location: item.data.location,
              bio: item.data.bio,
              subscription_type: item.data.subscription_type || 'free',
              subscription_expires_at: item.data.subscription_expires_at,
              updated_at: new Date().toISOString()
            };

            logger.info(`准备同步用户档案: ${item.data.username || item.data.email}`, 'auto-sync');

            const { data, error } = await this.supabaseClient
              .from('profiles')
              .upsert([profileData])
              .select();

            if (error) {
              logger.error(`用户档案同步失败: ${error.message}`, 'auto-sync', error);
              errorCount++;
              errors.push(`profile ${item.data.username || item.data.email}: ${error.message}`);
            } else {
              logger.info(`用户档案同步成功`, 'auto-sync', data);
              successCount++;
            }
          }

        } catch (error: any) {
          errorCount++;
          errors.push(`${item.type} ${item.data.name || item.data.symbol}: ${error.message}`);
          logger.error(`${item.type} 同步异常`, 'auto-sync', error);
        }
      }

      logger.info(`同步完成: 成功 ${successCount}, 失败 ${errorCount}`, 'auto-sync');

      if (errors.length > 0) {
        logger.error('同步错误详情', 'auto-sync', errors);
      }

      return {
        success: errorCount === 0,
        successCount,
        errorCount,
        errors,
        message: `成功 ${successCount}, 失败 ${errorCount}`
      };

    } catch (error: any) {
      logger.error('同步过程异常', 'auto-sync', error);
      return { success: false, successCount: 0, errorCount: 0, errors: [error.message], message: error.message };
    }
  }

  /**
   * 更新数据快照
   */
  private updateDataSnapshot(): void {
    logger.info('更新数据快照...', 'auto-sync');

    const currentAccounts = this.getAllAccounts();
    const currentTransactions = this.getAllTransactions();
    const currentAssets = this.getAllAssets();
    const currentInvestmentPlans = this.getAllInvestmentPlans();
    const currentReviewLogs = this.getAllReviewLogs();
    const currentProfile = this.getUserProfile();

    localStorage.setItem('assetwise_last_sync_accounts', JSON.stringify(currentAccounts));
    localStorage.setItem('assetwise_last_sync_transactions', JSON.stringify(currentTransactions));
    localStorage.setItem('assetwise_last_sync_assets', JSON.stringify(currentAssets));
    localStorage.setItem('assetwise_last_sync_investment_plans', JSON.stringify(currentInvestmentPlans));
    localStorage.setItem('assetwise_last_sync_review_logs', JSON.stringify(currentReviewLogs));
    localStorage.setItem('assetwise_last_sync_profile', JSON.stringify(currentProfile));

    logger.info('数据快照已更新', 'auto-sync');
  }

  /**
   * 执行完整同步流程
   */
  public async runSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      logger.warn('同步正在进行中，跳过此次同步', 'auto-sync');
      return { success: false, successCount: 0, errorCount: 0, errors: ['同步正在进行中'], message: '同步正在进行中' };
    }

    this.syncInProgress = true;
    logger.info('开始自动同步流程...', 'auto-sync');

    try {
      // 步骤1: 确保Supabase库已加载
      const supabaseReady = await this.ensureSupabaseLoaded();
      if (!supabaseReady) {
        logger.error('Supabase库加载失败', 'auto-sync');
        return { success: false, successCount: 0, errorCount: 0, errors: ['Supabase库加载失败'], message: 'Supabase库加载失败' };
      }

      // 步骤2: 检测数据变化
      const changedItems = this.detectDataChanges();

      // 步骤3: 同步变化数据
      const syncResult = await this.syncWithServiceKey(changedItems);

      // 步骤4: 如果同步成功，更新数据快照
      if (syncResult.success) {
        this.updateDataSnapshot();

        // 清空旧的同步队列
        localStorage.setItem('assetwise_sync_queue', JSON.stringify([]));
        localStorage.setItem('assetwise_sync_queue_direct', JSON.stringify([]));
        logger.info('已清空旧的同步队列', 'auto-sync');
      }

      logger.info(`同步总结: 检测到变化 ${changedItems.length} 项, 同步结果: ${syncResult.success ? '成功' : '失败'}, 详情: ${syncResult.message}`, 'auto-sync');

      return syncResult;
    } catch (error: any) {
      logger.error('同步流程异常', 'auto-sync', error);
      return { success: false, successCount: 0, errorCount: 0, errors: [error.message], message: error.message };
    } finally {
      // 确保在所有情况下都重置同步状态
      this.syncInProgress = false;
      logger.debug('同步状态已重置', 'auto-sync');
    }
  }

  /**
   * 启用自动同步（每3分钟检查一次）
   */
  public enableAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }

    // 改为3分钟间隔
    const threeMinutes = 3 * 60 * 1000; // 3分钟 = 180000ms
    this.autoSyncTimer = setInterval(async () => {
      logger.info('定时同步检查...', 'auto-sync');
      await this.runSync();
    }, threeMinutes);

    logger.info('自动同步已启用（每3分钟）', 'auto-sync');
  }

  /**
   * 禁用自动同步
   */
  public disableAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      logger.info('自动同步已禁用', 'auto-sync');
    }
  }

  /**
   * 手动触发同步（用于页面数据变化后立即同步）
   */
  public async triggerSync(): Promise<SyncResult> {
    logger.info('手动触发同步...', 'auto-sync');
    return await this.runSync();
  }

  /**
   * 检查是否有待同步的数据
   */
  public hasChangesToSync(): boolean {
    try {
      const changedItems = this.detectDataChanges();
      logger.info(`变化检测结果: ${changedItems.length} 项变化`, 'auto-sync');
      return changedItems.length > 0;
    } catch (error: any) {
      logger.error('检查数据变化时出错', 'auto-sync', error);
      return false;
    }
  }

  /**
   * 重置同步状态（用于故障恢复）
   */
  public resetSyncState(): void {
    this.syncInProgress = false;
    logger.info('同步状态已手动重置', 'auto-sync');
  }

  /**
   * 获取当前同步状态
   */
  public getSyncStatus(): { isInProgress: boolean; isSupabaseLoaded: boolean } {
    return {
      isInProgress: this.syncInProgress,
      isSupabaseLoaded: this.isSupabaseLoaded
    };
  }
}

// 导出单例实例
export const autoSyncService = new AutoSyncService();
