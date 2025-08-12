import {
  User,
  Account,
  Asset,
  Transaction,
  ReviewLog,
  DashboardData
} from '@/lib/types/data.types';

/**
 * 完整的本地数据管理器
 * 支持离线优先的数据操作，包含完整的CRUD功能
 */
class LocalDataManagerService {
  private readonly STORAGE_KEYS = {
    USERS: 'assetwise_users',
    ACCOUNTS: 'assetwise_accounts',
    TRANSACTIONS: 'assetwise_transactions',
    REVIEWS: 'assetwise_reviews',
    INVESTMENT_PLANS: 'assetwise_investment_plans',
    SYNC_QUEUE: 'assetwise_sync_queue',
    LAST_SYNC: 'assetwise_last_sync'
  };

  // 生成唯一ID（数字类型，兼容现有类型定义）
  private idCounter = 0;
  private generateId(): number {
    // 使用时间戳+计数器确保唯一性
    const timestamp = Date.now();
    this.idCounter++;
    return timestamp * 1000 + this.idCounter % 1000;
  }

  // 生成UUID字符串（用于新的数据类型）
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 安全的JSON操作
  private safeGetItem<T>(key: string, defaultValue: T): T {
    try {
      // 检查是否在客户端环境
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return defaultValue;
      }
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private safeSetItem(key: string, value: any): boolean {
    try {
      // 检查是否在客户端环境
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.warn('localStorage not available, skipping save');
        return false;
      }
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      return false;
    }
  }

  // 添加到同步队列
  addToSyncQueue(operation: string, data: any): void {
    const queue = this.safeGetItem(this.STORAGE_KEYS.SYNC_QUEUE, []);
    queue.push({
      id: this.generateId(),
      operation,
      data,
      timestamp: new Date().toISOString(),
      retries: 0
    });
    this.safeSetItem(this.STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  // 用户管理
  async getUsers(): Promise<User[]> {
    return this.safeGetItem(this.STORAGE_KEYS.USERS, []);
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: User }> {
    try {
      const users = await this.getUsers();
      
      // 检查用户是否已存在
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, error: '用户已存在' };
      }

      const newUser: User = {
        ...userData,
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newUser);
      
      if (this.safeSetItem(this.STORAGE_KEYS.USERS, users)) {
        this.addToSyncQueue('createUser', newUser);
        return { success: true, data: newUser };
      } else {
        return { success: false, error: '保存用户失败' };
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      return { success: false, error: '创建用户失败' };
    }
  }

  // 账户管理
  getAccounts(userId: string | number): Account[] {
    const accounts = this.safeGetItem(this.STORAGE_KEYS.ACCOUNTS, []);
    console.log('🔍 getAccounts - 所有账户:', accounts);
    console.log('🔍 getAccounts - 查找用户ID:', userId, '类型:', typeof userId);

    // 支持字符串和数字类型的用户ID比较
    const filteredAccounts = accounts.filter((account: Account) => {
      const accountUserId = account.user_id;
      console.log('🔍 比较账户用户ID:', accountUserId, '类型:', typeof accountUserId, '与查找ID:', userId);

      // 直接比较，支持字符串和数字
      return String(accountUserId) === String(userId);
    });

    console.log('🔍 getAccounts - 过滤后的账户:', filteredAccounts);
    return filteredAccounts;
  }

  async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: Account }> {
    try {
      const accounts = this.safeGetItem(this.STORAGE_KEYS.ACCOUNTS, []);
      console.log('🏗️ createAccount - 输入数据:', accountData);
      console.log('🏗️ createAccount - 现有账户:', accounts);

      const newAccount: Account = {
        ...accountData,
        user_id: accountData.user_id, // 保持原始类型，不强制转换
        id: this.generateUUID(), // 使用UUID而不是数字ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🏗️ createAccount - 新账户:', newAccount);
      accounts.push(newAccount);
      console.log('🏗️ createAccount - 更新后的账户列表:', accounts);

      if (this.safeSetItem(this.STORAGE_KEYS.ACCOUNTS, accounts)) {
        console.log('✅ createAccount - 保存成功，添加到同步队列');
        this.addToSyncQueue('createAccount', newAccount);
        return { success: true, data: newAccount };
      } else {
        console.error('❌ createAccount - 保存到本地存储失败');
        return { success: false, error: '保存账户到本地存储失败' };
      }
    } catch (error) {
      console.error('❌ createAccount - 创建账户失败:', error);
      return { success: false, error: '创建账户失败' };
    }
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<{ success: boolean; error?: string; data?: Account }> {
    try {
      const accounts = this.safeGetItem(this.STORAGE_KEYS.ACCOUNTS, []);
      const index = accounts.findIndex((account: Account) => account.id === accountId);
      
      if (index === -1) {
        return { success: false, error: '账户不存在' };
      }

      accounts[index] = {
        ...accounts[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      if (this.safeSetItem(this.STORAGE_KEYS.ACCOUNTS, accounts)) {
        this.addToSyncQueue('updateAccount', { id: accountId, updates });
        return { success: true, data: accounts[index] };
      } else {
        return { success: false, error: '更新账户失败' };
      }
    } catch (error) {
      console.error('更新账户失败:', error);
      return { success: false, error: '更新账户失败' };
    }
  }

  async deleteAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const accounts = this.safeGetItem(this.STORAGE_KEYS.ACCOUNTS, []);
      const filteredAccounts = accounts.filter((account: Account) => account.id !== accountId);
      
      if (this.safeSetItem(this.STORAGE_KEYS.ACCOUNTS, filteredAccounts)) {
        this.addToSyncQueue('deleteAccount', { id: accountId });
        return { success: true };
      } else {
        return { success: false, error: '删除账户失败' };
      }
    } catch (error) {
      console.error('删除账户失败:', error);
      return { success: false, error: '删除账户失败' };
    }
  }

  // 交易记录管理
  getTransactions(userId: string | number): Transaction[] {
    const transactions = this.safeGetItem(this.STORAGE_KEYS.TRANSACTIONS, []);
    console.log('🔍 getTransactions - 所有交易:', transactions);
    console.log('🔍 getTransactions - 查找用户ID:', userId, '类型:', typeof userId);

    // 支持字符串和数字类型的用户ID比较
    const filteredTransactions = transactions.filter((transaction: Transaction) => {
      const transactionUserId = transaction.user_id;
      console.log('🔍 比较交易用户ID:', transactionUserId, '类型:', typeof transactionUserId, '与查找ID:', userId);

      // 直接比较，支持字符串和数字
      return String(transactionUserId) === String(userId);
    });

    console.log('🔍 getTransactions - 过滤后的交易:', filteredTransactions);
    return filteredTransactions;
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: Transaction }> {
    try {
      const transactions = this.safeGetItem(this.STORAGE_KEYS.TRANSACTIONS, []);
      console.log('🏗️ createTransaction - 输入数据:', transactionData);
      console.log('🏗️ createTransaction - 现有交易:', transactions);

      const newTransaction: Transaction = {
        ...transactionData,
        user_id: transactionData.user_id, // 保持原始类型，不强制转换
        account_id: transactionData.account_id, // 保持原始类型，不强制转换
        id: this.generateUUID(), // 使用UUID而不是数字ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🏗️ createTransaction - 新交易:', newTransaction);
      transactions.push(newTransaction);
      console.log('🏗️ createTransaction - 更新后的交易列表:', transactions);

      if (this.safeSetItem(this.STORAGE_KEYS.TRANSACTIONS, transactions)) {
        console.log('✅ createTransaction - 保存成功，添加到同步队列');
        this.addToSyncQueue('createTransaction', newTransaction);
        return { success: true, data: newTransaction };
      } else {
        console.error('❌ createTransaction - 保存到本地存储失败');
        return { success: false, error: '保存交易记录失败' };
      }
    } catch (error) {
      console.error('❌ createTransaction - 创建交易记录失败:', error);
      return { success: false, error: '创建交易记录失败' };
    }
  }

  // 复盘日志管理
  getReviews(userId: string | number): ReviewLog[] {
    const reviews = this.safeGetItem(this.STORAGE_KEYS.REVIEWS, []);
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    return reviews.filter((review: ReviewLog) => review.user_id === userIdNum);
  }

  async createReview(reviewData: Omit<ReviewLog, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: ReviewLog }> {
    try {
      const reviews = this.safeGetItem(this.STORAGE_KEYS.REVIEWS, []);
      
      const newReview: ReviewLog = {
        ...reviewData,
        user_id: parseInt(reviewData.user_id.toString()),
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      reviews.push(newReview);
      
      if (this.safeSetItem(this.STORAGE_KEYS.REVIEWS, reviews)) {
        this.addToSyncQueue('createReview', newReview);
        console.log('复盘日志保存成功:', newReview);
        return { success: true, data: newReview };
      } else {
        return { success: false, error: '保存复盘日志失败' };
      }
    } catch (error) {
      console.error('创建复盘日志失败:', error);
      return { success: false, error: '创建复盘日志失败' };
    }
  }

  updateReviewLogById(id: number, updates: Partial<ReviewLog>): { success: boolean; error?: string } {
    try {
      const reviews = this.safeGetItem(this.STORAGE_KEYS.REVIEWS, []);
      const index = reviews.findIndex((review: ReviewLog) => review.id === id);

      if (index === -1) {
        return { success: false, error: '复盘日志不存在' };
      }

      reviews[index] = {
        ...reviews[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (this.safeSetItem(this.STORAGE_KEYS.REVIEWS, reviews)) {
        this.addToSyncQueue('updateReview', reviews[index]);
        return { success: true };
      } else {
        return { success: false, error: '更新复盘日志失败' };
      }
    } catch (error) {
      console.error('更新复盘日志失败:', error);
      return { success: false, error: '更新复盘日志失败' };
    }
  }

  // 投资计划管理
  getInvestmentPlans(userId: string | number): any[] {
    const plans = this.safeGetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, []);
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    return plans.filter((plan: any) => plan.user_id === userIdNum);
  }

  async createInvestmentPlan(planData: any): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const plans = this.safeGetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, []);
      
      const newPlan = {
        ...planData,
        user_id: parseInt(planData.user_id.toString()),
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      plans.push(newPlan);
      
      if (this.safeSetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, plans)) {
        this.addToSyncQueue('createInvestmentPlan', newPlan);
        console.log('投资计划保存成功:', newPlan);
        return { success: true, data: newPlan };
      } else {
        return { success: false, error: '保存投资计划失败' };
      }
    } catch (error) {
      console.error('创建投资计划失败:', error);
      return { success: false, error: '创建投资计划失败' };
    }
  }

  // 获取同步队列
  getSyncQueue(): any[] {
    return this.safeGetItem(this.STORAGE_KEYS.SYNC_QUEUE, []);
  }

  // 清空同步队列
  clearSyncQueue(): void {
    this.safeSetItem(this.STORAGE_KEYS.SYNC_QUEUE, []);
  }

  // 获取最后同步时间
  getLastSyncTime(): string | null {
    return this.safeGetItem(this.STORAGE_KEYS.LAST_SYNC, null);
  }

  // 设置最后同步时间
  setLastSyncTime(timestamp: string): void {
    this.safeSetItem(this.STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    return this.safeGetItem('assetwise_current_user', null);
  }

  // 更新用户信息
  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string; data?: User }> {
    console.log('🚨🚨🚨 LocalDataManager.updateUser 被调用了！！！');
    console.log('🔧 LocalDataManager.updateUser 开始:', { userId, updates });

    try {
      // 更新 assetwise_users 中的用户信息（支持字符串和数字ID）
      const users = this.safeGetItem(this.STORAGE_KEYS.USERS, []);
      console.log('📋 当前用户列表:', users);
      console.log('📋 用户列表长度:', users.length);

      // 尝试匹配字符串ID或数字ID
      const userIndex = users.findIndex((user: any) => {
        console.log('🔍 比较用户ID:', { userIdFromList: user.id, userIdFromParam: userId, match: user.id === userId });
        return user.id === userId || user.id?.toString() === userId || user.id === parseInt(userId);
      });

      console.log('🔍 用户索引查找结果:', userIndex);

      if (userIndex !== -1) {
        console.log('✅ 在用户列表中找到用户，索引:', userIndex);
        console.log('📝 更新前的用户数据:', users[userIndex]);
        users[userIndex] = {
          ...users[userIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        console.log('📝 更新后的用户数据:', users[userIndex]);
        this.safeSetItem(this.STORAGE_KEYS.USERS, users);
        console.log('💾 已更新用户列表');
      } else {
        console.log('⚠️ 在用户列表中未找到用户');
      }

      // 更新 assetwise_current_user 中的用户信息
      const currentUser = this.safeGetItem('assetwise_current_user', null);
      console.log('👤 当前用户数据:', currentUser);
      console.log('🔍 当前用户ID比较:', { currentUserId: currentUser?.id, paramUserId: userId, match: currentUser?.id === userId });

      if (currentUser && currentUser.id === userId) {
        console.log('✅ 当前用户ID匹配，开始更新');
        const updatedCurrentUser = {
          ...currentUser,
          ...updates,
          updated_at: new Date().toISOString()
        };
        console.log('📝 更新后的当前用户数据:', updatedCurrentUser);
        this.safeSetItem('assetwise_current_user', updatedCurrentUser);
        console.log('✅ 已更新当前用户数据');

        // 添加到同步队列
        this.addToSyncQueue('updateUser', { id: userId, updates });

        console.log('🎉 updateUser 成功完成');
        return { success: true, data: updatedCurrentUser };
      }

      console.log('❌ 当前用户不匹配或不存在');
      return { success: false, error: '用户不存在' };
    } catch (error) {
      console.error('❌ 更新用户失败:', error);
      return { success: false, error: '更新用户失败' };
    }
  }

  // 批量设置数据（用于同步）
  setAccounts(accounts: Account[]): void {
    this.safeSetItem(this.STORAGE_KEYS.ACCOUNTS, accounts);
  }

  setTransactions(transactions: Transaction[]): void {
    this.safeSetItem(this.STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  setReviews(reviews: ReviewLog[]): void {
    this.safeSetItem(this.STORAGE_KEYS.REVIEWS, reviews);
  }

  setAssets(assets: Asset[]): void {
    this.safeSetItem('assetwise_assets', assets);
  }

  setInvestmentPlans(plans: any[]): void {
    this.safeSetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, plans);
  }

  // 获取资产数据
  getAssets(userId: string | number): Asset[] {
    const assets = this.safeGetItem('assetwise_assets', []);
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    return assets.filter((asset: Asset) => asset.user_id === userIdNum);
  }

  // 更新方法
  updateAccount(id: number, updates: Partial<Account>): { success: boolean; error?: string } {
    return this.updateAccountById(id, updates);
  }

  updateAccountById(id: number, updates: Partial<Account>): { success: boolean; error?: string } {
    try {
      const accounts = this.safeGetItem(this.STORAGE_KEYS.ACCOUNTS, []);
      const index = accounts.findIndex((account: Account) => account.id === id);

      if (index === -1) {
        return { success: false, error: '账户不存在' };
      }

      accounts[index] = {
        ...accounts[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (this.safeSetItem(this.STORAGE_KEYS.ACCOUNTS, accounts)) {
        return { success: true };
      } else {
        return { success: false, error: '更新账户失败' };
      }
    } catch (error) {
      console.error('更新账户失败:', error);
      return { success: false, error: '更新账户失败' };
    }
  }

  updateTransaction(id: number, updates: Partial<Transaction>): { success: boolean; error?: string } {
    try {
      const transactions = this.safeGetItem(this.STORAGE_KEYS.TRANSACTIONS, []);
      const index = transactions.findIndex((t: Transaction) => t.id === id);

      if (index === -1) {
        return { success: false, error: '交易记录不存在' };
      }

      transactions[index] = {
        ...transactions[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (this.safeSetItem(this.STORAGE_KEYS.TRANSACTIONS, transactions)) {
        return { success: true };
      } else {
        return { success: false, error: '更新交易记录失败' };
      }
    } catch (error) {
      return { success: false, error: '更新交易记录失败' };
    }
  }

  updateReview(id: number, updates: Partial<ReviewLog>): { success: boolean; error?: string } {
    try {
      const reviews = this.safeGetItem(this.STORAGE_KEYS.REVIEWS, []);
      const index = reviews.findIndex((r: ReviewLog) => r.id === id);

      if (index === -1) {
        return { success: false, error: '复盘日志不存在' };
      }

      reviews[index] = {
        ...reviews[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (this.safeSetItem(this.STORAGE_KEYS.REVIEWS, reviews)) {
        return { success: true };
      } else {
        return { success: false, error: '更新复盘日志失败' };
      }
    } catch (error) {
      return { success: false, error: '更新复盘日志失败' };
    }
  }

  updateAsset(id: number, updates: Partial<Asset>): { success: boolean; error?: string } {
    try {
      const assets = this.safeGetItem('assetwise_assets', []);
      const index = assets.findIndex((a: Asset) => a.id === id);

      if (index === -1) {
        return { success: false, error: '资产不存在' };
      }

      assets[index] = {
        ...assets[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (this.safeSetItem('assetwise_assets', assets)) {
        return { success: true };
      } else {
        return { success: false, error: '更新资产失败' };
      }
    } catch (error) {
      return { success: false, error: '更新资产失败' };
    }
  }

  updateInvestmentPlan(id: number, updates: any): { success: boolean; error?: string } {
    try {
      const plans = this.safeGetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, []);
      const index = plans.findIndex((p: any) => p.id === id);

      if (index === -1) {
        return { success: false, error: '投资计划不存在' };
      }

      plans[index] = {
        ...plans[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (this.safeSetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, plans)) {
        return { success: true };
      } else {
        return { success: false, error: '更新投资计划失败' };
      }
    } catch (error) {
      return { success: false, error: '更新投资计划失败' };
    }
  }

  // 添加账户
  async addAccount(account: Account): Promise<{ success: boolean; error?: string; data?: Account }> {
    console.log('📝 addAccount - 调用参数:', account);
    return await this.createAccount(account);
  }

  // 添加交易记录
  async addTransaction(transaction: Transaction): Promise<{ success: boolean; error?: string; data?: Transaction }> {
    console.log('📝 addTransaction - 调用参数:', transaction);
    return await this.createTransaction(transaction);
  }

  // 添加复盘日志
  async addReview(review: ReviewLog): Promise<{ success: boolean; error?: string; data?: ReviewLog }> {
    console.log('📝 addReview - 调用参数:', review);
    return await this.createReview(review);
  }

  // 添加资产
  async addAsset(asset: Asset): Promise<{ success: boolean; error?: string; data?: Asset }> {
    try {
      const assets = this.safeGetItem('assetwise_assets', []);
      console.log('🏗️ addAsset - 输入数据:', asset);
      console.log('🏗️ addAsset - 现有资产:', assets);

      const newAsset: Asset = {
        ...asset,
        id: this.generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🏗️ addAsset - 新资产:', newAsset);
      assets.push(newAsset);
      console.log('🏗️ addAsset - 更新后的资产列表:', assets);

      if (this.safeSetItem('assetwise_assets', assets)) {
        console.log('✅ addAsset - 保存成功，添加到同步队列');
        this.addToSyncQueue('createAsset', newAsset);
        return { success: true, data: newAsset };
      } else {
        console.error('❌ addAsset - 保存到本地存储失败');
        return { success: false, error: '保存资产到本地存储失败' };
      }
    } catch (error) {
      console.error('❌ addAsset - 创建资产失败:', error);
      return { success: false, error: '创建资产失败' };
    }
  }

  // 添加投资计划
  async addInvestmentPlan(plan: any): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const plans = this.safeGetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, []);
      console.log('🏗️ addInvestmentPlan - 输入数据:', plan);
      console.log('🏗️ addInvestmentPlan - 现有计划:', plans);

      const newPlan = {
        ...plan,
        id: this.generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🏗️ addInvestmentPlan - 新计划:', newPlan);
      plans.push(newPlan);
      console.log('🏗️ addInvestmentPlan - 更新后的计划列表:', plans);

      if (this.safeSetItem(this.STORAGE_KEYS.INVESTMENT_PLANS, plans)) {
        console.log('✅ addInvestmentPlan - 保存成功，添加到同步队列');
        this.addToSyncQueue('createInvestmentPlan', newPlan);
        return { success: true, data: newPlan };
      } else {
        console.error('❌ addInvestmentPlan - 保存到本地存储失败');
        return { success: false, error: '保存投资计划到本地存储失败' };
      }
    } catch (error) {
      console.error('❌ addInvestmentPlan - 创建投资计划失败:', error);
      return { success: false, error: '创建投资计划失败' };
    }
  }
}

export const localDataManagerService = new LocalDataManagerService();
