/**
 * 直接本地存储服务
 * 完全独立的数据管理，不依赖任何其他服务
 */

// 存储键名
const STORAGE_KEYS = {
  TRANSACTIONS: 'assetwise_transactions_direct',
  REVIEWS: 'assetwise_reviews_direct',
  INVESTMENT_PLANS: 'assetwise_plans_direct',
  ACCOUNTS: 'assetwise_accounts_direct',
  SYNC_QUEUE: 'assetwise_sync_queue_direct'
};

// 生成唯一ID
let idCounter = 0;
function generateId(): number {
  // 使用时间戳 + 递增计数器确保唯一性
  return Date.now() * 1000 + (++idCounter % 1000);
}

// 安全的localStorage操作
function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('localStorage不可用，返回默认值');
      return defaultValue;
    }
    const item = localStorage.getItem(key);
    const result = item ? JSON.parse(item) : defaultValue;
    console.log(`从localStorage读取 ${key}:`, result);
    return result;
  } catch (error) {
    console.error(`读取 ${key} 失败:`, error);
    return defaultValue;
  }
}

function safeSetItem(key: string, value: any): boolean {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('localStorage不可用，无法保存');
      return false;
    }
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`保存到localStorage ${key}:`, value);
    return true;
  } catch (error) {
    console.error(`保存 ${key} 失败:`, error);
    return false;
  }
}

// 交易记录管理
export const directTransactionService = {
  // 获取交易记录
  getTransactions(userId: string): any[] {
    console.log('directTransactionService.getTransactions 调用，用户ID:', userId);
    const transactions = safeGetItem(STORAGE_KEYS.TRANSACTIONS, []);
    // 支持字符串和数字ID的比较
    const result = transactions.filter((t: any) =>
      t.user_id === userId || t.user_id === parseInt(userId) || t.user_id?.toString() === userId
    );
    console.log('过滤后的交易记录:', result);
    return result;
  },

  // 创建交易记录
  createTransaction(transactionData: any): { success: boolean; error?: string; data?: any } {
    console.log('directTransactionService.createTransaction 开始:', transactionData);
    
    try {
      const transactions = safeGetItem(STORAGE_KEYS.TRANSACTIONS, []);
      
      const newTransaction = {
        ...transactionData,
        user_id: transactionData.user_id, // 保持原始用户ID格式
        account_id: parseInt(transactionData.account_id.toString()),
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      transactions.push(newTransaction);
      
      if (safeSetItem(STORAGE_KEYS.TRANSACTIONS, transactions)) {
        console.log('交易记录保存成功:', newTransaction);

        // 添加到同步队列
        try {
          // 动态导入云端同步服务以避免循环依赖
          import('./cloud-sync.service').then(({ cloudSyncService }) => {
            cloudSyncService.addToDirectSyncQueue('createTransaction', newTransaction, 'transaction');
            console.log('交易记录已添加到同步队列');
          }).catch(error => {
            console.warn('添加到同步队列失败:', error);
          });
        } catch (error) {
          console.warn('同步队列操作失败:', error);
        }

        return { success: true, data: newTransaction };
      } else {
        return { success: false, error: '保存交易记录失败' };
      }
    } catch (error) {
      console.error('创建交易记录失败:', error);
      return { success: false, error: '创建交易记录失败' };
    }
  },

  // 更新交易记录
  updateTransaction(transactionData: any): { success: boolean; error?: string; data?: any } {
    console.log('directTransactionService.updateTransaction 开始:', transactionData);

    try {
      const transactions = safeGetItem(STORAGE_KEYS.TRANSACTIONS, []);
      const index = transactions.findIndex((t: any) => t.id === transactionData.id);

      if (index === -1) {
        return { success: false, error: '交易记录不存在' };
      }

      const updatedTransaction = {
        ...transactions[index],
        ...transactionData,
        updated_at: new Date().toISOString()
      };

      transactions[index] = updatedTransaction;

      if (safeSetItem(STORAGE_KEYS.TRANSACTIONS, transactions)) {
        console.log('交易记录更新成功:', updatedTransaction);

        // 添加到同步队列
        try {
          import('./cloud-sync.service').then(({ cloudSyncService }) => {
            cloudSyncService.addToDirectSyncQueue('updateTransaction', updatedTransaction, 'transaction');
            console.log('交易记录更新已添加到同步队列');
          }).catch(error => {
            console.warn('添加到同步队列失败:', error);
          });
        } catch (error) {
          console.warn('同步队列操作失败:', error);
        }

        return { success: true, data: updatedTransaction };
      } else {
        return { success: false, error: '保存交易记录失败' };
      }
    } catch (error) {
      console.error('更新交易记录失败:', error);
      return { success: false, error: '更新交易记录失败' };
    }
  },

  // 删除交易记录
  deleteTransaction(id: number): { success: boolean; error?: string } {
    console.log('directTransactionService.deleteTransaction 开始:', id);

    try {
      const transactions = safeGetItem(STORAGE_KEYS.TRANSACTIONS, []);
      const index = transactions.findIndex((t: any) => t.id === id);

      if (index === -1) {
        return { success: false, error: '交易记录不存在' };
      }

      const deletedTransaction = transactions[index];
      transactions.splice(index, 1);

      if (safeSetItem(STORAGE_KEYS.TRANSACTIONS, transactions)) {
        console.log('交易记录删除成功:', id);

        // 添加到同步队列
        try {
          import('./cloud-sync.service').then(({ cloudSyncService }) => {
            cloudSyncService.addToDirectSyncQueue('deleteTransaction', { id, ...deletedTransaction }, 'transaction');
            console.log('交易记录删除已添加到同步队列');
          }).catch(error => {
            console.warn('添加到同步队列失败:', error);
          });
        } catch (error) {
          console.warn('同步队列操作失败:', error);
        }

        return { success: true };
      } else {
        return { success: false, error: '删除交易记录失败' };
      }
    } catch (error) {
      console.error('删除交易记录失败:', error);
      return { success: false, error: '删除交易记录失败' };
    }
  }
};

// 复盘日志管理
export const directReviewService = {
  // 获取复盘日志
  getReviews(userId: string): any[] {
    console.log('directReviewService.getReviews 调用，用户ID:', userId);
    const reviews = safeGetItem(STORAGE_KEYS.REVIEWS, []);
    // 支持字符串和数字ID的比较
    const result = reviews.filter((r: any) =>
      r.user_id === userId || r.user_id === parseInt(userId) || r.user_id?.toString() === userId
    );
    console.log('过滤后的复盘日志:', result);
    return result;
  },

  // 创建复盘日志
  createReview(reviewData: any): { success: boolean; error?: string; data?: any } {
    console.log('directReviewService.createReview 开始:', reviewData);
    
    try {
      const reviews = safeGetItem(STORAGE_KEYS.REVIEWS, []);
      
      const newReview = {
        ...reviewData,
        user_id: reviewData.user_id, // 保持原始用户ID格式
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      reviews.push(newReview);
      
      if (safeSetItem(STORAGE_KEYS.REVIEWS, reviews)) {
        console.log('复盘日志保存成功:', newReview);
        return { success: true, data: newReview };
      } else {
        return { success: false, error: '保存复盘日志失败' };
      }
    } catch (error) {
      console.error('创建复盘日志失败:', error);
      return { success: false, error: '创建复盘日志失败' };
    }
  },

  // 更新复盘日志
  updateReview(id: number, updates: any): { success: boolean; error?: string } {
    try {
      const reviews = safeGetItem(STORAGE_KEYS.REVIEWS, []);
      const index = reviews.findIndex((r: any) => r.id === id);

      if (index === -1) {
        return { success: false, error: '复盘日志不存在' };
      }

      reviews[index] = {
        ...reviews[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (safeSetItem(STORAGE_KEYS.REVIEWS, reviews)) {
        console.log('复盘日志更新成功:', reviews[index]);
        return { success: true };
      } else {
        return { success: false, error: '更新复盘日志失败' };
      }
    } catch (error) {
      console.error('更新复盘日志失败:', error);
      return { success: false, error: '更新复盘日志失败' };
    }
  }
};

// 投资计划管理
export const directPlanService = {
  // 获取投资计划
  getInvestmentPlans(userId: string): any[] {
    console.log('directPlanService.getInvestmentPlans 调用，用户ID:', userId);
    const plans = safeGetItem(STORAGE_KEYS.INVESTMENT_PLANS, []);
    // 支持字符串和数字ID的比较
    const result = plans.filter((p: any) =>
      p.user_id === userId || p.user_id === parseInt(userId) || p.user_id?.toString() === userId
    );
    console.log('过滤后的投资计划:', result);
    return result;
  },

  // 创建投资计划
  createInvestmentPlan(planData: any): { success: boolean; error?: string; data?: any } {
    console.log('directPlanService.createInvestmentPlan 开始:', planData);
    
    try {
      const plans = safeGetItem(STORAGE_KEYS.INVESTMENT_PLANS, []);
      
      const newPlan = {
        ...planData,
        user_id: planData.user_id, // 保持原始用户ID格式
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      plans.push(newPlan);
      
      if (safeSetItem(STORAGE_KEYS.INVESTMENT_PLANS, plans)) {
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
};

// 账户管理
export const directAccountService = {
  // 获取账户
  getAccounts(userId: string): any[] {
    console.log('directAccountService.getAccounts 调用，用户ID:', userId);
    const accounts = safeGetItem(STORAGE_KEYS.ACCOUNTS, []);
    // 支持字符串和数字ID的比较
    const result = accounts.filter((a: any) =>
      a.user_id === userId || a.user_id === parseInt(userId) || a.user_id?.toString() === userId
    );
    console.log('过滤后的账户:', result);
    return result;
  },

  // 创建账户
  createAccount(accountData: any): { success: boolean; error?: string; data?: any } {
    console.log('directAccountService.createAccount 开始:', accountData);
    
    try {
      const accounts = safeGetItem(STORAGE_KEYS.ACCOUNTS, []);
      
      const newAccount = {
        ...accountData,
        user_id: accountData.user_id, // 保持原始用户ID格式
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      accounts.push(newAccount);
      
      if (safeSetItem(STORAGE_KEYS.ACCOUNTS, accounts)) {
        console.log('账户保存成功:', newAccount);

        // 添加到同步队列
        const syncQueue = safeGetItem(STORAGE_KEYS.SYNC_QUEUE, []);
        syncQueue.push({
          operation: 'createAccount',
          data: newAccount,
          timestamp: new Date().toISOString(),
          retries: 0
        });
        safeSetItem(STORAGE_KEYS.SYNC_QUEUE, syncQueue);

        return { success: true, data: newAccount };
      } else {
        return { success: false, error: '保存账户失败' };
      }
    } catch (error) {
      console.error('创建账户失败:', error);
      return { success: false, error: '创建账户失败' };
    }
  },

  // 更新账户
  updateAccount(id: number, updates: any): { success: boolean; error?: string } {
    console.log('directAccountService.updateAccount 开始:', { id, updates });

    try {
      const accounts = safeGetItem(STORAGE_KEYS.ACCOUNTS, []);
      const index = accounts.findIndex((a: any) => a.id === id);

      if (index === -1) {
        return { success: false, error: '账户不存在' };
      }

      accounts[index] = {
        ...accounts[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (safeSetItem(STORAGE_KEYS.ACCOUNTS, accounts)) {
        console.log('账户更新成功:', accounts[index]);

        // 添加到同步队列
        const syncQueue = safeGetItem(STORAGE_KEYS.SYNC_QUEUE, []);
        syncQueue.push({
          operation: 'updateAccount',
          data: { id, updates },
          timestamp: new Date().toISOString(),
          retries: 0
        });
        safeSetItem(STORAGE_KEYS.SYNC_QUEUE, syncQueue);

        return { success: true };
      } else {
        return { success: false, error: '更新账户失败' };
      }
    } catch (error) {
      console.error('更新账户失败:', error);
      return { success: false, error: '更新账户失败' };
    }
  },

  // 删除账户
  deleteAccount(id: number): { success: boolean; error?: string } {
    console.log('directAccountService.deleteAccount 开始:', id);

    try {
      const accounts = safeGetItem(STORAGE_KEYS.ACCOUNTS, []);
      const index = accounts.findIndex((a: any) => a.id === id);

      if (index === -1) {
        return { success: false, error: '账户不存在' };
      }

      const deletedAccount = accounts[index];
      accounts.splice(index, 1);

      if (safeSetItem(STORAGE_KEYS.ACCOUNTS, accounts)) {
        console.log('账户删除成功:', deletedAccount);

        // 添加到同步队列
        const syncQueue = safeGetItem(STORAGE_KEYS.SYNC_QUEUE, []);
        syncQueue.push({
          operation: 'deleteAccount',
          data: { id },
          timestamp: new Date().toISOString(),
          retries: 0
        });
        safeSetItem(STORAGE_KEYS.SYNC_QUEUE, syncQueue);

        return { success: true };
      } else {
        return { success: false, error: '删除账户失败' };
      }
    } catch (error) {
      console.error('删除账户失败:', error);
      return { success: false, error: '删除账户失败' };
    }
  }
};

// 调试信息
export const directDebugService = {
  getServiceInfo(): string {
    return 'DirectLocalService';
  },
  
  clearAllData(): void {
    console.log('清空所有直接存储的数据');
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
  
  getAllData(): any {
    return {
      transactions: safeGetItem(STORAGE_KEYS.TRANSACTIONS, []),
      reviews: safeGetItem(STORAGE_KEYS.REVIEWS, []),
      plans: safeGetItem(STORAGE_KEYS.INVESTMENT_PLANS, []),
      accounts: safeGetItem(STORAGE_KEYS.ACCOUNTS, [])
    };
  }
};
