import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Account, Asset, Transaction, ReviewLog, InvestmentPlan } from '@/lib/types/data.types';
import { unifiedDataService } from '@/lib/services/unified-data.service';
import { supabaseAuthService, AuthUser } from '@/lib/services/supabase-auth.service';

// 用户状态接口
interface UserState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, username?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  updateSubscription: (type: 'free' | 'professional' | 'flagship') => Promise<{ success: boolean; error?: string }>;
  initializeAuth: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

// 账户状态接口
interface AccountState {
  accounts: Account[];
  selectedAccount: Account | null;
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: number, account: Partial<Account>) => void;
  deleteAccount: (id: number) => void;
  selectAccount: (account: Account | null) => void;
}

// 资产状态接口
interface AssetState {
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: number, asset: Partial<Asset>) => void;
  deleteAsset: (id: number) => void;
  getAssetsByAccount: (accountId: number) => Asset[];
}

// 交易状态接口
interface TransactionState {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: number, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: number) => void;
  getTransactionsByAccount: (accountId: number) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
}

// 复盘日志状态接口
interface ReviewLogState {
  reviewLogs: ReviewLog[];
  setReviewLogs: (logs: ReviewLog[]) => void;
  addReviewLog: (log: ReviewLog) => void;
  updateReviewLog: (id: number, log: Partial<ReviewLog>) => void;
  deleteReviewLog: (id: number) => void;
  getReviewLogsByDateRange: (startDate: Date, endDate: Date) => ReviewLog[];
}

// 投资计划状态接口
interface InvestmentPlanState {
  investmentPlans: InvestmentPlan[];
  setInvestmentPlans: (plans: InvestmentPlan[]) => void;
  addInvestmentPlan: (plan: InvestmentPlan) => void;
  updateInvestmentPlan: (id: number, plan: Partial<InvestmentPlan>) => void;
  deleteInvestmentPlan: (id: number) => void;
  getActivePlans: () => InvestmentPlan[];
}

// 应用设置状态接口
interface AppState {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: 'zh' | 'en';
  sidebarCollapsed: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: string) => void;
  setLanguage: (language: 'zh' | 'en') => void;
  toggleSidebar: () => void;
}

// 用户状态store
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await supabaseAuthService.signIn({ email, password });
          if (result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: result.error || '登录失败' };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: '登录过程中发生错误' };
        }
      },

      register: async (email, password, username, fullName) => {
        set({ isLoading: true });
        try {
          const result = await supabaseAuthService.signUp({
            email,
            password,
            username,
            full_name: fullName
          });
          if (result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: result.error || '注册失败' };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: '注册过程中发生错误' };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabaseAuthService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error) {
          console.error('登出失败:', error);
          set({ isLoading: false });
        }
      },

      updateUser: async (userData) => {
        console.log('🚨🚨🚨 useUserStore.updateUser 被调用了！！！');
        console.log('📝 传入的用户数据:', userData);

        set({ isLoading: true });
        try {
          const currentUser = get().user;
          console.log('👤 当前用户:', currentUser);

          if (!currentUser) {
            console.log('❌ 用户未登录');
            set({ isLoading: false });
            return { success: false, error: '用户未登录' };
          }

          // 检查是否在本地模式下运行
          const isLocalMode = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

          console.log('🔍 运行模式检查:', { isLocalMode, hostname: window?.location?.hostname });

          if (isLocalMode) {
            console.log('✅ 使用本地数据管理器');
            // 使用本地数据管理器
            const { localDataManagerService } = await import('@/lib/services/local-data-manager.service');

            console.log('🚀 调用 localDataManagerService.updateUser:', { userId: currentUser.id, userData });
            const result = await localDataManagerService.updateUser(currentUser.id, userData);
            console.log('✅ localDataManagerService.updateUser 结果:', result);

            if (result.success && result.data) {
              console.log('✅ 更新成功，设置新用户数据:', result.data);
              set({
                user: result.data,
                isLoading: false
              });
              return { success: true };
            } else {
              console.log('❌ 更新失败:', result.error);
              set({ isLoading: false });
              return { success: false, error: result.error || '更新用户信息失败' };
            }
          } else {
            console.log('✅ 使用Supabase服务');
            // 使用Supabase服务
            const { error } = await supabaseAuthService.updateProfile(userData);
            if (!error) {
              const updatedUser = await supabaseAuthService.getCurrentUser();
              set({
                user: updatedUser,
                isLoading: false
              });
              return { success: true };
            } else {
              set({ isLoading: false });
              return { success: false, error };
            }
          }
        } catch (error) {
          console.error('❌ useUserStore.updateUser 异常:', error);
          set({ isLoading: false });
          return { success: false, error: '更新用户信息失败' };
        }
      },

      updateSubscription: async (type) => {
        set({ isLoading: true });
        try {
          const { error } = await supabaseAuthService.updateProfile({
            subscription_type: type
          });
          if (!error) {
            const updatedUser = await supabaseAuthService.getCurrentUser();
            set({
              user: updatedUser,
              isLoading: false
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: '更新订阅状态失败' };
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          console.log('🔐 开始初始化认证...');
          
          const user = await supabaseAuthService.getCurrentUser();
          console.log('👤 获取到的用户信息:', user);
          
          // 检查返回的用户对象是否有效
          if (user && typeof user === 'object' && user.id) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            console.log('✅ 用户认证成功');
          } else {
            // 如果返回空对象或无效数据，设置为未登录状态
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            console.log('ℹ️ 用户未登录或认证数据无效');
          }

          // 监听认证状态变化
          supabaseAuthService.onAuthStateChange((user) => {
            console.log('🔄 认证状态变化:', user);
            set({
              user,
              isAuthenticated: !!user,
              isLoading: false
            });
          });
        } catch (error) {
          console.error('Supabase认证错误:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      setUser: (user) => {
        set({ user });
      },

      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        // 只持久化基本用户信息，认证状态由Supabase管理
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// 账户状态store
export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  selectedAccount: null,
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => {
    const { accounts } = get();
    set({ accounts: [...accounts, account] });
  },
  updateAccount: (id, updatedAccount) => {
    const { accounts } = get();
    set({
      accounts: accounts.map((account) =>
        account.id === id ? { ...account, ...updatedAccount } : account
      ),
    });
  },
  deleteAccount: (id) => {
    const { accounts } = get();
    set({ accounts: accounts.filter((account) => account.id !== id) });
  },
  selectAccount: (account) => set({ selectedAccount: account }),
}));

// 资产状态store
export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => {
    const { assets } = get();
    set({ assets: [...assets, asset] });
  },
  updateAsset: (id, updatedAsset) => {
    const { assets } = get();
    set({
      assets: assets.map((asset) =>
        asset.id === id ? { ...asset, ...updatedAsset } : asset
      ),
    });
  },
  deleteAsset: (id) => {
    const { assets } = get();
    set({ assets: assets.filter((asset) => asset.id !== id) });
  },
  getAssetsByAccount: (accountId) => {
    const { assets } = get();
    return assets.filter((asset) => asset.account_id === accountId);
  },
}));

// 交易状态store
export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) => {
    const { transactions } = get();
    set({ transactions: [...transactions, transaction] });
  },
  updateTransaction: (id, updatedTransaction) => {
    const { transactions } = get();
    set({
      transactions: transactions.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
      ),
    });
  },
  deleteTransaction: (id) => {
    const { transactions } = get();
    set({ transactions: transactions.filter((transaction) => transaction.id !== id) });
  },
  getTransactionsByAccount: (accountId) => {
    const { transactions } = get();
    return transactions.filter((transaction) => transaction.account_id === accountId);
  },
  getTransactionsByDateRange: (startDate, endDate) => {
    const { transactions } = get();
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transaction_date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  },
}));

// 复盘日志状态store
export const useReviewLogStore = create<ReviewLogState>((set, get) => ({
  reviewLogs: [],
  setReviewLogs: (reviewLogs) => set({ reviewLogs }),
  addReviewLog: (log) => {
    const { reviewLogs } = get();
    set({ reviewLogs: [...reviewLogs, log] });
  },
  updateReviewLog: (id, updatedLog) => {
    const { reviewLogs } = get();
    set({
      reviewLogs: reviewLogs.map((log) =>
        log.id === id ? { ...log, ...updatedLog } : log
      ),
    });
  },
  deleteReviewLog: (id) => {
    const { reviewLogs } = get();
    set({ reviewLogs: reviewLogs.filter((log) => log.id !== id) });
  },
  getReviewLogsByDateRange: (startDate, endDate) => {
    const { reviewLogs } = get();
    return reviewLogs.filter((log) => {
      const logDate = new Date(log.review_date);
      return logDate >= startDate && logDate <= endDate;
    });
  },
}));

// 投资计划状态store
export const useInvestmentPlanStore = create<InvestmentPlanState>((set, get) => ({
  investmentPlans: [],
  setInvestmentPlans: (investmentPlans) => set({ investmentPlans }),
  addInvestmentPlan: (plan) => {
    const { investmentPlans } = get();
    set({ investmentPlans: [...investmentPlans, plan] });
  },
  updateInvestmentPlan: (id, updatedPlan) => {
    const { investmentPlans } = get();
    set({
      investmentPlans: investmentPlans.map((plan) =>
        plan.id === id ? { ...plan, ...updatedPlan } : plan
      ),
    });
  },
  deleteInvestmentPlan: (id) => {
    const { investmentPlans } = get();
    set({ investmentPlans: investmentPlans.filter((plan) => plan.id !== id) });
  },
  getActivePlans: () => {
    const { investmentPlans } = get();
    return investmentPlans.filter((plan) => plan.is_active);
  },
}));

// 应用设置状态store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      currency: 'CNY',
      language: 'zh',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => {
        const { sidebarCollapsed } = get();
        set({ sidebarCollapsed: !sidebarCollapsed });
      },
    }),
    {
      name: 'app-storage',
    }
  )
);

// 组合所有状态的hook
export const useStore = () => ({
  user: useUserStore(),
  account: useAccountStore(),
  asset: useAssetStore(),
  transaction: useTransactionStore(),
  reviewLog: useReviewLogStore(),
  investmentPlan: useInvestmentPlanStore(),
  app: useAppStore(),
});
