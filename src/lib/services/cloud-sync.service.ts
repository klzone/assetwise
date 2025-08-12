import { localDataManagerService } from './local-data-manager.service';
import { supabaseDataService } from './supabase-data.service';
import { dataConflictResolverService } from './data-conflict-resolver.service';
import { useUserStore } from '@/store';

/**
 * 云端同步服务
 * 负责本地数据与Supabase云端的双向同步
 */
class CloudSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  // 同步状态
  public syncStatus: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
    lastSync: null,
    pendingChanges: 0,
    isAutoSyncEnabled: true,
    isSyncing: false,
    error: null
  };

  constructor() {
    // 只在客户端环境初始化
    if (typeof window !== 'undefined') {
      this.initializeSync();
      this.setupNetworkListeners();
    }
  }

  // 初始化同步服务
  private initializeSync() {
    this.lastSyncTime = localDataManagerService.getLastSyncTime();
    this.syncStatus.lastSync = this.lastSyncTime;
    this.updatePendingChanges();
    
    // 启动自动同步（如果启用）
    if (this.syncStatus.isAutoSyncEnabled) {
      this.startAutoSync();
    }
  }

  // 设置网络状态监听
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.notifyListeners();
      if (this.syncStatus.isAutoSyncEnabled) {
        this.performSync();
      }
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.notifyListeners();
    });
  }

  // 启动自动同步（每分钟检查一次）
  startAutoSync() {
    // 暂时禁用自动同步，避免外键约束错误
    console.warn('云端自动同步已暂时禁用，避免外键约束错误');
    return;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.isSyncing && this.syncStatus.pendingChanges > 0) {
        this.performSync();
      }
    }, 60000); // 1分钟

    this.syncStatus.isAutoSyncEnabled = true;
    this.notifyListeners();
  }

  // 停止自动同步
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.syncStatus.isAutoSyncEnabled = false;
    this.notifyListeners();
  }

  // 手动同步
  async manualSync(): Promise<{ success: boolean; error?: string }> {
    if (!this.syncStatus.isOnline) {
      return { success: false, error: '网络连接不可用' };
    }

    if (this.isSyncing) {
      return { success: false, error: '同步正在进行中' };
    }

    return await this.performSync();
  }

  // 推送本地数据到云端（别名方法）
  async pushToCloud(): Promise<{ success: boolean; error?: string }> {
    return await this.manualSync();
  }

  // 执行同步
  private async performSync(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) {
      return { success: false, error: '同步正在进行中' };
    }

    this.isSyncing = true;
    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;
    this.notifyListeners();

    try {
      console.log('开始云端同步...');
      
      // 获取同步队列（包括直接服务的队列）
      const mainSyncQueue = localDataManagerService.getSyncQueue();

      // 获取直接服务的同步队列
      const directSyncQueue = this.getDirectSyncQueue();

      // 合并两个队列
      const syncQueue = [...mainSyncQueue, ...directSyncQueue];
      console.log(`待同步项目: ${syncQueue.length} (主队列: ${mainSyncQueue.length}, 直接队列: ${directSyncQueue.length})`);

      if (syncQueue.length === 0) {
        console.log('没有待同步的数据');
        this.lastSyncTime = new Date().toISOString();
        localDataManagerService.setLastSyncTime(this.lastSyncTime);
        this.syncStatus.lastSync = this.lastSyncTime;
        return { success: true };
      }

      // 检查是否强制使用真实同步
      const forceRealSync = typeof window !== 'undefined' &&
                           (window as any).process?.env?.NEXT_PUBLIC_FORCE_REAL_SYNC === 'true' ||
                           process?.env?.NEXT_PUBLIC_FORCE_REAL_SYNC === 'true';

      console.log('🔍 同步模式检查:');
      console.log('- NEXT_PUBLIC_FORCE_REAL_SYNC:', process?.env?.NEXT_PUBLIC_FORCE_REAL_SYNC);
      console.log('- forceRealSync:', forceRealSync);

      if (forceRealSync) {
        console.log('✅ 强制使用真实同步模式 (NEXT_PUBLIC_FORCE_REAL_SYNC=true)');
      } else {
        // 检查是否为测试环境
        const isTestMode = typeof window !== 'undefined' &&
                          (window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1');

        console.log('🔍 环境检查:');
        console.log('- 主机名:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');
        console.log('- 是否测试环境:', isTestMode);

        if (isTestMode) {
          console.log('⚠️ 检测到测试环境，但FORCE_REAL_SYNC未设置，使用模拟同步');
          console.log('💡 要使用真实同步，请设置 NEXT_PUBLIC_FORCE_REAL_SYNC=true');
          return await this.performMockSync(syncQueue);
        }
      }

      // 获取云端数据服务并测试连接
      const cloudService = supabaseDataService;
      if (!cloudService) {
        throw new Error('云端服务不可用');
      }

      // 测试Supabase连接
      console.log('🔗 测试Supabase连接...');
      try {
        await this.testSupabaseConnection();
        console.log('✅ Supabase连接测试成功');
      } catch (error) {
        console.error('❌ Supabase连接测试失败:', error);
        throw new Error(`Supabase连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }

      let successCount = 0;
      let errorCount = 0;

      // 逐个处理同步队列中的操作
      const failedItems: any[] = [];

      for (const item of syncQueue) {
        try {
          console.log(`开始同步项目:`, item.operation, item.data?.name || item.data?.symbol || 'Unknown');
          await this.syncSingleItem(item, cloudService);
          successCount++;
          console.log(`✅ 同步成功: ${item.operation}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorDetails = {
            operation: item.operation,
            data: item.data,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
          };

          console.error(`❌ 同步项目失败:`, errorDetails);
          console.error(`❌ 错误详情 - ${item.operation}:`, errorMessage);
          errorCount++;

          // 增加重试次数
          item.retries = (item.retries || 0) + 1;
          item.lastError = error instanceof Error ? error.message : String(error);

          // 如果重试次数超过3次，标记为失败
          if (item.retries >= 3) {
            console.error(`🚫 项目同步失败次数过多，跳过:`, item);
            failedItems.push(item);
          } else {
            failedItems.push(item); // 保留失败项目用于重试
          }
        }
      }

      // 只清理成功同步的项目，保留失败的项目
      if (errorCount === 0) {
        // 全部成功，清理所有队列
        localDataManagerService.clearSyncQueue();
        this.clearDirectSyncQueue();
        console.log('🎉 所有项目同步成功，队列已清理');
      } else {
        // 有失败项目，只清理成功的，保留失败的用于下次重试
        console.log(`⚠️ 保留 ${failedItems.length} 个失败项目用于重试`);
        console.log('失败项目详情:', failedItems.map(item => ({
          operation: item.operation,
          retries: item.retries,
          lastError: item.lastError
        })));
      }

      this.lastSyncTime = new Date().toISOString();
      localDataManagerService.setLastSyncTime(this.lastSyncTime);
      this.syncStatus.lastSync = this.lastSyncTime;

      console.log(`📊 同步完成: 成功 ${successCount}, 失败 ${errorCount}`);

      if (errorCount === 0) {
        // 清除之前的错误状态
        this.syncStatus.error = null;
        return { success: true };
      } else {
        // 提供详细的错误信息
        const errorDetails = failedItems.map(item =>
          `${item.operation}: ${item.lastError || '未知错误'}`
        ).join('; ');

        return {
          success: false,
          error: `同步失败 ${errorCount} 项: ${errorDetails}`
        };
      }

    } catch (error) {
      console.error('同步过程出错:', error);
      this.syncStatus.error = error instanceof Error ? error.message : '同步失败';
      return { success: false, error: this.syncStatus.error };
    } finally {
      // 确保同步状态正确重置
      this.isSyncing = false;
      this.syncStatus.isSyncing = false;

      // 更新待同步项目数量
      this.updatePendingChanges();

      // 延迟通知，确保UI有时间显示最终状态
      setTimeout(() => {
        this.notifyListeners();
        console.log('🔄 同步状态已重置，通知UI更新');
      }, 100);
    }
  }

  // 同步单个项目
  private async syncSingleItem(item: any, cloudService: any) {
    console.log(`正在同步: ${item.operation}`, item.data?.name || item.data?.symbol || 'Unknown');
    console.log('同步项目详情:', item);

    // 添加超时保护 - 增加到60秒，并添加连接测试
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('同步操作超时 (60秒) - 请检查网络连接和Supabase配置')), 60000);
    });

    try {
      const syncPromise = this.executeSyncOperation(item, cloudService);
      const result = await Promise.race([syncPromise, timeoutPromise]);
      console.log(`同步成功: ${item.operation}`, result);
      return result;
    } catch (error) {
      console.error(`同步失败: ${item.operation}`, error);
      console.error('错误详情:', {
        operation: item.operation,
        data: item.data,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // 转换本地账户数据为Supabase格式
  // 转换账户更新数据
  private transformAccountUpdates(updates: any) {
    console.log('转换账户更新数据:', updates);

    // 处理账户状态
    const supportedStatuses = ['active', 'inactive', 'closed', 'frozen'];
    const transformedUpdates = { ...updates };

    // 如果更新包含status字段，确保它是有效的
    if (updates.status !== undefined) {
      transformedUpdates.status = supportedStatuses.includes(updates.status)
        ? updates.status
        : 'active';

      // 同步更新is_active字段
      transformedUpdates.is_active = transformedUpdates.status === 'active';
    }
    // 如果更新包含is_active字段但没有status字段
    else if (updates.is_active !== undefined && updates.status === undefined) {
      transformedUpdates.status = updates.is_active ? 'active' : 'inactive';
    }

    // 确保更新时间
    transformedUpdates.updated_at = new Date().toISOString();

    console.log('转换后的账户更新数据:', transformedUpdates);
    return transformedUpdates;
  }

  private transformAccountForSupabase(localAccount: any) {
    console.log('转换账户数据:', localAccount);

    // 获取当前认证用户ID
    const userStore = useUserStore.getState();
    const currentUser = userStore.user;
    if (!currentUser?.id) {
      throw new Error('用户未认证，无法同步数据');
    }

    // 支持的账户类型列表
    const supportedTypes = [
      'securities', 'stock', 'fund', 'cash', 'crypto', 'bank',
      'futures', 'forex', 'commodity', 'insurance', 'pension',
      'education', 'real_estate', 'p2p', 'bond', 'option'
    ];

    // 处理账户状态
    const supportedStatuses = ['active', 'inactive', 'closed', 'frozen'];
    let accountStatus = 'active'; // 默认状态

    if (localAccount.status && supportedStatuses.includes(localAccount.status)) {
      accountStatus = localAccount.status;
    } else if (localAccount.is_active === false) {
      accountStatus = 'inactive';
    }

    const transformedAccount = {
      user_id: currentUser.id, // 使用当前认证用户的ID
      name: localAccount.name,
      type: supportedTypes.includes(localAccount.type) ? localAccount.type : 'securities', // 直接使用类型，不支持的默认为securities
      broker: localAccount.broker || null,
      account_number: localAccount.account_number || null,
      currency: localAccount.currency || 'CNY',
      balance: Number(localAccount.balance) || 0,
      description: localAccount.description || null,
      is_active: accountStatus === 'active', // 保持向后兼容
      status: accountStatus, // 新的状态字段
      created_at: localAccount.created_at,
      updated_at: localAccount.updated_at || new Date().toISOString()
    };

    console.log('转换后的账户数据:', transformedAccount);
    console.log('使用的用户ID:', currentUser.id);
    return transformedAccount;
  }

  // 验证和修复UUID格式
  private validateAndFixUuid(id: any, entityType: string = 'unknown'): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 如果是有效的UUID，直接返回
    if (typeof id === 'string' && uuidRegex.test(id)) {
      return id;
    }

    // 如果不是有效的UUID，生成新的UUID
    const newUuid = crypto.randomUUID();
    console.warn(`⚠️ ${entityType} ID格式无效: ${id} (${typeof id}), 生成新UUID: ${newUuid}`);

    return newUuid;
  }

  // 转换本地交易数据为Supabase格式
  private async transformTransactionForSupabase(localTransaction: any) {
    console.log('转换交易数据:', localTransaction);

    // 获取当前认证用户ID
    const userStore = useUserStore.getState();
    const currentUser = userStore.user;
    if (!currentUser?.id) {
      throw new Error('用户未认证，无法同步交易数据');
    }

    // 支持的交易类型列表
    const supportedTypes = [
      'buy', 'sell', 'dividend', 'deposit', 'withdraw',
      'split', 'merge', 'bonus', 'rights'
    ];

    // 验证和修复交易ID
    const transactionId = this.validateAndFixUuid(localTransaction.id, 'transaction');

    // 处理account_id，确保引用存在的账户
    let accountId = localTransaction.account_id;

    console.log('🔍 原始account_id:', accountId, '类型:', typeof accountId);

    // 验证account_id格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!accountId || typeof accountId !== 'string' || !uuidRegex.test(accountId)) {
      console.warn('⚠️ account_id格式无效:', accountId, '类型:', typeof accountId);

      // 尝试从云端获取用户的账户列表
      try {
        const { supabaseDataService } = await import('./supabase-data.service');
        const userAccounts = await supabaseDataService.getAccounts(currentUser.id);
        console.log('📊 用户云端账户列表:', userAccounts);

        if (userAccounts.length > 0) {
          // 使用第一个可用账户
          accountId = userAccounts[0].id;
          console.log('✅ 使用第一个可用账户:', accountId);
        } else {
          console.warn('⚠️ 用户没有云端账户，将创建默认账户');
          accountId = await this.createDefaultAccount(currentUser.id);
        }
      } catch (error) {
        console.error('❌ 获取用户账户失败:', error);
        // 创建默认账户作为后备方案
        accountId = await this.createDefaultAccount(currentUser.id);
      }
    }

    // 如果仍然没有有效的account_id，创建默认账户
    if (!accountId) {
      console.warn('⚠️ 没有有效的account_id，创建默认账户...');
      accountId = await this.createDefaultAccount(currentUser.id);
    }

    // 最终验证：确保账户在云端存在
    if (accountId) {
      try {
        const { supabaseDataService } = await import('./supabase-data.service');
        const userAccounts = await supabaseDataService.getAccounts(currentUser.id);
        const accountExists = userAccounts.some(account => account.id === accountId);

        if (!accountExists) {
          console.warn('⚠️ 账户在云端不存在，创建默认账户...');
          accountId = await this.createDefaultAccount(currentUser.id);
        } else {
          console.log('✅ 账户在云端存在，验证通过');
        }
      } catch (error) {
        console.warn('⚠️ 验证账户存在性失败，使用现有ID:', error);
      }
    }

    console.log('🔍 最终使用的account_id:', accountId, '类型:', typeof accountId);

    const transformedTransaction = {
      id: transactionId, // 使用验证后的UUID
      user_id: currentUser.id, // 使用当前认证用户的ID
      account_id: accountId, // 确保是UUID格式或null
      type: supportedTypes.includes(localTransaction.type) ? localTransaction.type : 'buy', // 默认为买入
      symbol: localTransaction.symbol || null,
      name: localTransaction.name || null,
      quantity: localTransaction.quantity ? Number(localTransaction.quantity) : null,
      price: localTransaction.price ? Number(localTransaction.price) : null,
      amount: Number(localTransaction.amount) || 0,
      fee: Number(localTransaction.fee) || 0,
      tax: Number(localTransaction.tax) || 0,
      currency: localTransaction.currency || 'CNY',
      exchange: localTransaction.exchange || null,
      notes: localTransaction.notes || null,
      transaction_date: localTransaction.transaction_date || new Date().toISOString(),
      created_at: localTransaction.created_at,
      updated_at: localTransaction.updated_at || new Date().toISOString()
    };

    console.log('转换后的交易数据:', transformedTransaction);
    console.log('使用的用户ID:', currentUser.id);
    return transformedTransaction;
  }

  // 转换交易更新数据为Supabase格式
  private async transformTransactionUpdateForSupabase(updateData: any) {
    console.log('转换交易更新数据:', updateData);

    // 获取当前认证用户ID
    const userStore = useUserStore.getState();
    const currentUser = userStore.user;
    if (!currentUser?.id) {
      throw new Error('用户未认证，无法同步交易更新数据');
    }

    // 支持的交易类型列表
    const supportedTypes = [
      'buy', 'sell', 'dividend', 'deposit', 'withdraw',
      'split', 'merge', 'bonus', 'rights'
    ];

    // 构建更新数据对象，只包含有效字段
    const transformedUpdateData: any = {};

    // 处理各个字段
    if (updateData.symbol !== undefined) {
      transformedUpdateData.symbol = updateData.symbol || null;
    }

    if (updateData.name !== undefined) {
      transformedUpdateData.name = updateData.name || null;
    }

    if (updateData.type !== undefined) {
      transformedUpdateData.type = supportedTypes.includes(updateData.type) ? updateData.type : 'buy';
    }

    if (updateData.quantity !== undefined) {
      transformedUpdateData.quantity = updateData.quantity ? Number(updateData.quantity) : null;
    }

    if (updateData.price !== undefined) {
      transformedUpdateData.price = updateData.price ? Number(updateData.price) : null;
    }

    if (updateData.amount !== undefined) {
      transformedUpdateData.amount = Number(updateData.amount) || 0;
    }

    if (updateData.fee !== undefined) {
      transformedUpdateData.fee = Number(updateData.fee) || 0;
    }

    if (updateData.tax !== undefined) {
      transformedUpdateData.tax = Number(updateData.tax) || 0;
    }

    if (updateData.currency !== undefined) {
      transformedUpdateData.currency = updateData.currency || 'CNY';
    }

    if (updateData.exchange !== undefined) {
      transformedUpdateData.exchange = updateData.exchange || null;
    }

    if (updateData.notes !== undefined) {
      transformedUpdateData.notes = updateData.notes || null;
    }

    if (updateData.transaction_date !== undefined) {
      transformedUpdateData.transaction_date = updateData.transaction_date || new Date().toISOString();
    }

    // 处理account_id
    if (updateData.account_id !== undefined) {
      let accountId = updateData.account_id;

      // 验证account_id格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!accountId || typeof accountId !== 'string' || !uuidRegex.test(accountId)) {
        console.warn('⚠️ 更新数据中的account_id格式无效:', accountId);

        // 尝试从云端获取用户的账户列表
        try {
          const { supabaseDataService } = await import('./supabase-data.service');
          const userAccounts = await supabaseDataService.getAccounts(currentUser.id);

          if (userAccounts.length > 0) {
            accountId = userAccounts[0].id;
            console.log('✅ 使用第一个可用账户:', accountId);
          } else {
            console.warn('⚠️ 用户没有云端账户，将创建默认账户');
            accountId = await this.createDefaultAccount(currentUser.id);
          }
        } catch (error) {
          console.error('❌ 获取用户账户失败:', error);
          accountId = await this.createDefaultAccount(currentUser.id);
        }
      }

      transformedUpdateData.account_id = accountId;
    }

    // 总是更新 updated_at
    transformedUpdateData.updated_at = new Date().toISOString();

    console.log('转换后的更新数据:', transformedUpdateData);
    return transformedUpdateData;
  }

  // 创建默认账户
  private async createDefaultAccount(userId: string): Promise<string> {
    console.log('🏗️ 为用户创建默认账户:', userId);

    try {
      const { supabaseDataService } = await import('./supabase-data.service');

      const defaultAccount = {
        user_id: userId,
        name: '默认投资账户',
        type: 'securities' as const,
        broker: '默认券商',
        account_number: `DEFAULT_${Date.now()}`,
        currency: 'CNY',
        balance: 0,
        initial_balance: 0,
        description: '系统自动创建的默认账户',
        is_active: true,
        risk_level: 'medium' as const
      };

      const result = await supabaseDataService.createAccount(defaultAccount);

      if (result.success && result.data?.id) {
        console.log('✅ 默认账户创建成功:', result.data.id);
        return result.data.id;
      } else {
        console.error('❌ 默认账户创建失败:', result.error);
        throw new Error(`创建默认账户失败: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ 创建默认账户异常:', error);
      throw new Error(`创建默认账户异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 执行具体的同步操作
  private async executeSyncOperation(item: any, cloudService: any) {
    console.log(`执行同步操作: ${item.operation}`);

    try {
      let result;

      switch (item.operation) {
        case 'createAccount':
          console.log('创建账户:', item.data);
          const transformedAccount = this.transformAccountForSupabase(item.data);
          result = await cloudService.createAccount(transformedAccount);
          break;
        case 'updateAccount':
          console.log('更新账户:', item.data.id, item.data.updates);
          try {
            // 转换更新数据，确保包含status字段
            const updates = item.data.updates || item.data;
            const transformedUpdates = this.transformAccountUpdates(updates);
            console.log('转换后的更新数据:', transformedUpdates);
            result = await cloudService.updateAccount(item.data.id, transformedUpdates);
          } catch (updateError) {
            console.error('❌ 更新账户失败:', updateError);
            result = { success: false, error: `更新失败: ${updateError.message}` };
          }
          break;
        case 'deleteAccount':
          console.log('删除账户:', item.data.id);
          result = await cloudService.deleteAccount(item.data.id);
          break;
        case 'createTransaction':
          console.log('📝 开始创建交易:', item.data);
          try {
            const transformedTransaction = await this.transformTransactionForSupabase(item.data);
            console.log('🔄 转换后的交易数据:', transformedTransaction);
            result = await cloudService.createTransaction(transformedTransaction);
            console.log('📊 交易创建结果:', result);
          } catch (transformError) {
            console.error('❌ 交易数据转换失败:', transformError);
            result = { success: false, error: `数据转换失败: ${transformError.message}` };
          }
          break;
        case 'updateTransaction':
          console.log('更新交易:', item.data);
          try {
            // 验证ID格式
            const updateTransactionId = this.validateAndFixUuid(item.data.id, 'transaction');

            // 处理更新数据 - 支持两种格式
            let updateData;
            if (item.data.updates) {
              // 格式1: { id: xxx, updates: { field1: value1, ... } }
              updateData = item.data.updates;
            } else {
              // 格式2: 完整的交易对象 { id: xxx, field1: value1, ... }
              const { id, created_at, ...updates } = item.data;
              updateData = updates;
            }

            // 验证account_id格式
            if (updateData.account_id) {
              updateData.account_id = this.validateAndFixUuid(updateData.account_id, 'account');
            }

            // 转换数据格式以符合Supabase要求
            const transformedUpdateData = await this.transformTransactionUpdateForSupabase(updateData);

            console.log('🔄 转换后的更新数据:', transformedUpdateData);
            result = await cloudService.updateTransaction(updateTransactionId, transformedUpdateData);
            console.log('📊 交易更新结果:', result);
          } catch (transformError) {
            console.error('❌ 交易更新数据转换失败:', transformError);
            result = { success: false, error: `更新数据转换失败: ${transformError.message}` };
          }
          break;
        case 'deleteTransaction':
          console.log('删除交易:', item.data.id);
          // 验证ID格式
          const deleteTransactionId = this.validateAndFixUuid(item.data.id, 'transaction');
          result = await cloudService.deleteTransaction(deleteTransactionId);
          break;
        case 'createReview':
          console.log('创建复盘:', item.data);
          result = await cloudService.createReview(item.data);
          break;
        case 'updateReview':
          console.log('更新复盘:', item.data.id, item.data.updates);
          result = await cloudService.updateReview(item.data.id, item.data.updates || item.data);
          break;
        case 'deleteReview':
          console.log('删除复盘:', item.data.id);
          result = await cloudService.deleteReview(item.data.id);
          break;
        case 'createAsset':
          console.log('创建资产:', item.data);
          result = await cloudService.createAsset(item.data);
          break;
        case 'updateAsset':
          console.log('更新资产:', item.data.id, item.data.updates);
          result = await cloudService.updateAsset(item.data.id, item.data.updates || item.data);
          break;
        case 'deleteAsset':
          console.log('删除资产:', item.data.id);
          result = await cloudService.deleteAsset(item.data.id);
          break;
        case 'createInvestmentPlan':
          console.log('创建投资计划:', item.data);
          result = await cloudService.createInvestmentPlan(item.data);
          break;
        case 'updateInvestmentPlan':
          console.log('更新投资计划:', item.data.id, item.data.updates);
          result = await cloudService.updateInvestmentPlan(item.data.id, item.data.updates || item.data);
          break;
        case 'deleteInvestmentPlan':
          console.log('删除投资计划:', item.data.id);
          result = await cloudService.deleteInvestmentPlan(item.data.id);
          break;
        case 'createUser':
          console.log('⚠️ 用户创建通过Supabase Auth处理，跳过同步');
          result = { success: true, message: '用户创建通过Auth处理' };
          break;
        case 'updateUser':
          console.log('⚠️ 用户更新通过Supabase Auth处理，跳过同步');
          result = { success: true, message: '用户更新通过Auth处理' };
          break;
        case 'deleteUser':
          console.log('⚠️ 用户删除通过Supabase Auth处理，跳过同步');
          result = { success: true, message: '用户删除通过Auth处理' };
          break;
        // 向后兼容：处理旧的操作名称
        case 'create':
          console.log('⚠️ 检测到旧操作名称 "create"，尝试自动修复...');
          const createEntityType = item.entityType || 'transaction';
          const newCreateOperation = 'create' + createEntityType.charAt(0).toUpperCase() + createEntityType.slice(1);
          console.log(`自动转换: create -> ${newCreateOperation}`);
          // 递归调用修正后的操作
          return await this.executeSyncOperation({ ...item, operation: newCreateOperation }, cloudService);
        case 'update':
          console.log('⚠️ 检测到旧操作名称 "update"，尝试自动修复...');
          const updateEntityType = item.entityType || 'transaction';
          const newUpdateOperation = 'update' + updateEntityType.charAt(0).toUpperCase() + updateEntityType.slice(1);
          console.log(`自动转换: update -> ${newUpdateOperation}`);
          return await this.executeSyncOperation({ ...item, operation: newUpdateOperation }, cloudService);
        case 'delete':
          console.log('⚠️ 检测到旧操作名称 "delete"，尝试自动修复...');
          const deleteEntityType = item.entityType || 'transaction';
          const newDeleteOperation = 'delete' + deleteEntityType.charAt(0).toUpperCase() + deleteEntityType.slice(1);
          console.log(`自动转换: delete -> ${newDeleteOperation}`);
          return await this.executeSyncOperation({ ...item, operation: newDeleteOperation }, cloudService);
        default:
          console.warn('未知的同步操作:', item.operation);
          throw new Error(`未知的同步操作: ${item.operation}`);
      }

      console.log(`同步操作 ${item.operation} 结果:`, result);

      // 检查结果是否成功
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        throw new Error(result.error || `同步操作 ${item.operation} 失败`);
      }

      return result;

    } catch (error) {
      console.error(`同步操作 ${item.operation} 执行失败:`, error);
      throw error;
    }
  }

  // 模拟同步（测试环境使用）
  private async performMockSync(syncQueue: any[]): Promise<{ success: boolean; error?: string }> {
    console.log('开始模拟同步...');

    let successCount = 0;
    let errorCount = 0;

    // 模拟处理每个同步项目
    for (const item of syncQueue) {
      try {
        console.log(`模拟同步: ${item.operation}`, item.data?.name || item.data?.symbol || 'Unknown');

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100));

        // 模拟成功率（90%成功）
        if (Math.random() > 0.1) {
          successCount++;
          console.log(`模拟同步成功: ${item.operation}`);
        } else {
          throw new Error('模拟网络错误');
        }

      } catch (error) {
        console.error(`模拟同步失败:`, item, error);
        errorCount++;

        // 增加重试次数
        item.retries = (item.retries || 0) + 1;
      }
    }

    // 清理同步队列
    localDataManagerService.clearSyncQueue();
    this.clearDirectSyncQueue();

    this.lastSyncTime = new Date().toISOString();
    localDataManagerService.setLastSyncTime(this.lastSyncTime);
    this.syncStatus.lastSync = this.lastSyncTime;

    console.log(`模拟同步完成: 成功 ${successCount}, 失败 ${errorCount}`);

    return {
      success: errorCount === 0,
      error: errorCount > 0 ? `模拟同步部分失败: ${errorCount} 项` : undefined
    };
  }

  // 从云端拉取数据到本地
  async pullFromCloud(): Promise<{ success: boolean; error?: string }> {
    if (!this.syncStatus.isOnline) {
      return { success: false, error: '网络连接不可用' };
    }

    try {
      console.log('开始从云端拉取数据...');

      // 获取当前用户ID - 使用Supabase认证用户
      const userStore = useUserStore.getState();
      const currentUser = userStore.user;
      if (!currentUser?.id) {
        throw new Error('用户未登录或认证失效');
      }

      console.log('当前用户ID:', currentUser.id);
      console.log('用户ID类型:', typeof currentUser.id);
      console.log('用户对象:', currentUser);

      // 临时使用固定的UUID进行测试
      const testUserId = '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37';
      console.log('🧪 使用测试用户ID:', testUserId);
      console.log('🔍 用户ID匹配检查:', currentUser.id === testUserId ? '✅ 匹配' : '❌ 不匹配');

      // 检查是否为测试环境 - 但仍然使用真实的Supabase数据
      const isTestMode = typeof window !== 'undefined' &&
                        (window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1');

      if (isTestMode) {
        console.log('检测到测试环境，但仍使用真实Supabase数据');
      }

      // 获取云端数据服务
      const cloudService = supabaseDataService;
      if (!cloudService) {
        throw new Error('云端服务不可用');
      }

      // 获取云端数据 - 临时使用固定UUID进行测试
      const userId = '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37'; // 直接使用正确的UUID
      console.log('开始获取云端数据，用户ID:', userId);
      console.log('🔍 使用的用户ID类型:', typeof userId);
      console.log('🔍 用户ID长度:', userId.length);

      // 逐个获取数据，提供更好的错误处理
      let accounts = [];
      let transactions = [];
      let reviews = [];
      let assets = [];
      let plans = [];

      try {
        console.log('正在获取账户数据...');
        accounts = await cloudService.getAccounts(userId);
        console.log('✅ 账户数据获取成功:', accounts.length, '个');
      } catch (error) {
        console.error('❌ 获取账户数据失败:', error);
      }

      try {
        console.log('正在获取交易数据...');
        transactions = await cloudService.getTransactions(userId);
        console.log('✅ 交易数据获取成功:', transactions.length, '个');
      } catch (error) {
        console.error('❌ 获取交易数据失败:', error);
      }

      try {
        console.log('正在获取复盘日志...');
        reviews = await cloudService.getReviews(userId);
        console.log('✅ 复盘日志获取成功:', reviews.length, '个');
      } catch (error) {
        console.error('❌ 获取复盘日志失败:', error);
      }

      try {
        console.log('正在获取资产数据...');
        assets = await cloudService.getAssets(userId);
        console.log('✅ 资产数据获取成功:', assets.length, '个');
      } catch (error) {
        console.error('❌ 获取资产数据失败:', error);
      }

      try {
        console.log('正在获取投资计划...');
        plans = await cloudService.getInvestmentPlans(userId);
        console.log('✅ 投资计划获取成功:', plans.length, '个');
      } catch (error) {
        console.error('❌ 获取投资计划失败:', error);
      }

      // 将云端数据保存到本地
      await this.mergeCloudDataToLocal({
        accounts,
        transactions,
        reviews,
        assets,
        plans
      });

      console.log('从云端拉取数据完成');
      return { success: true };

    } catch (error) {
      console.error('从云端拉取数据失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '拉取数据失败' };
    }
  }

  // 模拟从云端拉取数据（测试环境使用）
  private async performMockPull(): Promise<{ success: boolean; error?: string }> {
    console.log('开始模拟数据拉取...');

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟云端数据（空数据，表示云端没有数据）
    const mockCloudData = {
      accounts: [],
      transactions: [],
      reviews: [],
      assets: [],
      plans: []
    };

    console.log('模拟数据拉取完成（云端无数据）');
    return { success: true };
  }

  // 将云端数据合并到本地（带冲突解决）
  private async mergeCloudDataToLocal(cloudData: any) {
    try {
      // 获取本地数据
      const currentUser = localDataManagerService.getCurrentUser();
      if (!currentUser) return;

      const localData = {
        accounts: localDataManagerService.getAccounts(currentUser.id),
        transactions: localDataManagerService.getTransactions(currentUser.id),
        reviews: localDataManagerService.getReviews(currentUser.id),
        assets: localDataManagerService.getAssets(currentUser.id),
        plans: localDataManagerService.getInvestmentPlans(currentUser.id)
      };

      // 检测并解决冲突
      const allConflicts = [
        ...dataConflictResolverService.detectConflicts(localData.accounts, cloudData.accounts || [], 'account'),
        ...dataConflictResolverService.detectConflicts(localData.transactions, cloudData.transactions || [], 'transaction'),
        ...dataConflictResolverService.detectConflicts(localData.reviews, cloudData.reviews || [], 'review'),
        ...dataConflictResolverService.detectConflicts(localData.assets, cloudData.assets || [], 'asset'),
        ...dataConflictResolverService.detectConflicts(localData.plans, cloudData.plans || [], 'plan')
      ];

      if (allConflicts.length > 0) {
        console.log(`检测到 ${allConflicts.length} 个数据冲突，正在自动解决...`);

        // 自动解决冲突
        const resolutions = dataConflictResolverService.autoResolveConflicts(allConflicts);
        const { localUpdates, cloudUpdates } = dataConflictResolverService.applyResolutions(allConflicts, resolutions);

        // 应用本地更新
        localUpdates.forEach(update => {
          this.applyLocalUpdate(update);
        });

        // 将云端更新添加到同步队列
        cloudUpdates.forEach(update => {
          localDataManagerService.addToSyncQueue(update);
        });

        console.log(`冲突解决完成: ${localUpdates.length} 个本地更新, ${cloudUpdates.length} 个云端更新`);
      }

      // 合并没有冲突的数据
      await this.mergeNonConflictingData(localData, cloudData, allConflicts);

    } catch (error) {
      console.error('数据合并失败:', error);
      throw error;
    }
  }

  // 应用本地更新
  private applyLocalUpdate(update: any) {
    switch (update.type) {
      case 'account':
        localDataManagerService.updateAccount(update.data.id, update.data);
        break;
      case 'transaction':
        localDataManagerService.updateTransaction(update.data.id, update.data);
        break;
      case 'review':
        localDataManagerService.updateReview(update.data.id, update.data);
        break;
      case 'asset':
        localDataManagerService.updateAsset(update.data.id, update.data);
        break;
      case 'plan':
        localDataManagerService.updateInvestmentPlan(update.data.id, update.data);
        break;
    }
  }

  // 合并没有冲突的数据
  private async mergeNonConflictingData(localData: any, cloudData: any, conflicts: any[]) {
    const conflictIds = new Set(conflicts.map(c => c.id));
    console.log('🔄 开始合并云端数据到本地...');
    console.log('📊 云端数据统计:', {
      accounts: cloudData.accounts?.length || 0,
      transactions: cloudData.transactions?.length || 0,
      reviews: cloudData.reviews?.length || 0,
      assets: cloudData.assets?.length || 0,
      plans: cloudData.plans?.length || 0
    });

    // 合并账户数据
    if (cloudData.accounts && cloudData.accounts.length > 0) {
      console.log('💳 开始合并账户数据...');
      let accountsAdded = 0;
      for (const account of cloudData.accounts) {
        if (!conflictIds.has(account.id)) {
          const existingLocal = localData.accounts.find((a: any) => a.id === account.id);
          if (!existingLocal) {
            try {
              // 同时保存到两个存储位置，确保兼容性
              await localDataManagerService.addAccount(account);

              // 也保存到direct服务使用的存储键
              const { directAccountService } = await import('./direct-local.service');
              directAccountService.createAccount(account);

              accountsAdded++;
              console.log('✅ 账户已添加:', account.name);
            } catch (error) {
              console.error('❌ 添加账户失败:', account.name, error);
            }
          }
        }
      }
      console.log(`💳 账户数据合并完成: ${accountsAdded} 个新账户`);
    }

    // 合并交易记录数据
    if (cloudData.transactions && cloudData.transactions.length > 0) {
      console.log('💰 开始合并交易记录...');
      let transactionsAdded = 0;
      for (const transaction of cloudData.transactions) {
        if (!conflictIds.has(transaction.id)) {
          const existingLocal = localData.transactions.find((t: any) => t.id === transaction.id);
          if (!existingLocal) {
            try {
              // 同时保存到两个存储位置，确保兼容性
              await localDataManagerService.addTransaction(transaction);

              // 也保存到direct服务使用的存储键
              const { directTransactionService } = await import('./direct-local.service');
              directTransactionService.createTransaction(transaction);

              transactionsAdded++;
              console.log('✅ 交易记录已添加:', transaction.description || transaction.type);
            } catch (error) {
              console.error('❌ 添加交易记录失败:', transaction.description || transaction.type, error);
            }
          }
        }
      }
      console.log(`💰 交易记录合并完成: ${transactionsAdded} 个新交易`);
    }

    // 合并复盘日志数据
    if (cloudData.reviews && cloudData.reviews.length > 0) {
      console.log('📝 开始合并复盘日志...');
      let reviewsAdded = 0;
      for (const review of cloudData.reviews) {
        if (!conflictIds.has(review.id)) {
          const existingLocal = localData.reviews.find((r: any) => r.id === review.id);
          if (!existingLocal) {
            try {
              // 同时保存到两个存储位置，确保兼容性
              await localDataManagerService.addReview(review);

              // 也保存到direct服务使用的存储键
              const { directReviewService } = await import('./direct-local.service');
              directReviewService.createReview(review);

              reviewsAdded++;
              console.log('✅ 复盘日志已添加:', review.title || review.content?.substring(0, 50));
            } catch (error) {
              console.error('❌ 添加复盘日志失败:', review.title, error);
            }
          }
        }
      }
      console.log(`📝 复盘日志合并完成: ${reviewsAdded} 个新日志`);
    }

    // 合并资产数据
    if (cloudData.assets && cloudData.assets.length > 0) {
      console.log('🏦 开始合并资产数据...');
      let assetsAdded = 0;
      for (const asset of cloudData.assets) {
        if (!conflictIds.has(asset.id)) {
          const existingLocal = localData.assets.find((a: any) => a.id === asset.id);
          if (!existingLocal) {
            try {
              await localDataManagerService.addAsset(asset);
              assetsAdded++;
              console.log('✅ 资产已添加:', asset.name || asset.symbol);
            } catch (error) {
              console.error('❌ 添加资产失败:', asset.name || asset.symbol, error);
            }
          }
        }
      }
      console.log(`🏦 资产数据合并完成: ${assetsAdded} 个新资产`);
    }

    // 合并投资计划数据
    if (cloudData.plans && cloudData.plans.length > 0) {
      console.log('📋 开始合并投资计划...');
      let plansAdded = 0;
      for (const plan of cloudData.plans) {
        if (!conflictIds.has(plan.id)) {
          const existingLocal = localData.plans.find((p: any) => p.id === plan.id);
          if (!existingLocal) {
            try {
              await localDataManagerService.addInvestmentPlan(plan);
              plansAdded++;
              console.log('✅ 投资计划已添加:', plan.name || plan.title);
            } catch (error) {
              console.error('❌ 添加投资计划失败:', plan.name || plan.title, error);
            }
          }
        }
      }
      console.log(`📋 投资计划合并完成: ${plansAdded} 个新计划`);
    }

    console.log('🎉 所有云端数据合并完成！');
  }

  // 更新待同步数量
  private updatePendingChanges() {
    const mainSyncQueue = localDataManagerService.getSyncQueue();
    const directSyncQueue = this.getDirectSyncQueue();
    const totalPending = mainSyncQueue.length + directSyncQueue.length;

    this.syncStatus.pendingChanges = totalPending;

    console.log(`📊 更新待同步数量: 主队列 ${mainSyncQueue.length}, 直接队列 ${directSyncQueue.length}, 总计 ${totalPending}`);
  }

  // 添加同步状态监听器
  addSyncListener(listener: (status: SyncStatus) => void) {
    this.syncListeners.push(listener);
  }

  // 移除同步状态监听器
  removeSyncListener(listener: (status: SyncStatus) => void) {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  private notifyListeners() {
    this.syncListeners.forEach(listener => {
      try {
        listener(this.syncStatus);
      } catch (error) {
        console.error('同步状态监听器错误:', error);
      }
    });
  }

  // 获取同步状态
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // 获取直接服务的同步队列
  private getDirectSyncQueue(): any[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      const queueData = localStorage.getItem('assetwise_sync_queue_direct');
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('获取直接同步队列失败:', error);
      return [];
    }
  }

  // 清空直接服务的同步队列
  private clearDirectSyncQueue(): void {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('assetwise_sync_queue_direct', JSON.stringify([]));
      }
    } catch (error) {
      console.error('清空直接同步队列失败:', error);
    }
  }

  // 添加项目到直接同步队列
  addToDirectSyncQueue(operation: string, data: any, entityType: string): void {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      const queue = this.getDirectSyncQueue();
      const syncItem = {
        id: `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        entityType,
        data,
        timestamp: new Date().toISOString(),
        retries: 0,
        lastError: null
      };

      queue.push(syncItem);
      localStorage.setItem('assetwise_sync_queue_direct', JSON.stringify(queue));

      console.log(`📝 添加到直接同步队列: ${operation} ${entityType}`, syncItem);

      // 更新同步状态 - 重新计算总的待同步数量
      this.updatePendingChanges();
      this.notifyListeners();
    } catch (error) {
      console.error('添加到直接同步队列失败:', error);
    }
  }

  // 测试Supabase连接
  private async testSupabaseConnection(): Promise<void> {
    try {
      // 获取当前用户认证状态
      const userStore = useUserStore.getState();
      const currentUser = userStore.user;

      if (!currentUser?.id) {
        throw new Error('用户未认证');
      }

      console.log('🔍 测试用户认证状态:', currentUser.id);

      // 尝试简单的数据库查询来测试连接
      const testResult = await supabaseDataService.getAccounts(currentUser.id);
      console.log('📊 连接测试结果 - 现有账户数量:', testResult.length);

      return; // 连接成功
    } catch (error) {
      console.error('🚫 Supabase连接测试详细错误:', error);
      throw error;
    }
  }

  // 清理资源
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncListeners = [];
  }
}

// 同步状态接口
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  isAutoSyncEnabled: boolean;
  isSyncing: boolean;
  error: string | null;
}

// 只在客户端环境创建实例
let cloudSyncServiceInstance: CloudSyncService | null = null;

export const cloudSyncService = (() => {
  if (typeof window === 'undefined') {
    // 服务端返回一个空的代理对象
    return {
      getSyncStatus: () => ({
        isOnline: false,
        lastSync: null,
        pendingChanges: 0,
        isAutoSyncEnabled: false,
        isSyncing: false,
        error: null
      }),
      addSyncListener: () => {},
      removeSyncListener: () => {},
      manualSync: async () => ({ success: false, error: 'Not available on server' }),
      pushToCloud: async () => ({ success: false, error: 'Not available on server' }),
      pullFromCloud: async () => ({ success: false, error: 'Not available on server' }),
      startAutoSync: () => {},
      stopAutoSync: () => {},
      destroy: () => {},
      addToDirectSyncQueue: () => {}
    } as any;
  }

  if (!cloudSyncServiceInstance) {
    cloudSyncServiceInstance = new CloudSyncService();
  }

  return cloudSyncServiceInstance;
})();
