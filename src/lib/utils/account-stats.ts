import { Account, Transaction, Currency } from '@/lib/types/data.types';
import { getCurrencyConfig } from '@/lib/config/account-types';

// 账户统计数据接口
export interface AccountStats {
  totalAssets: number;
  totalReturn: number;
  totalReturnPercent: number;
  todayChange: number;
  todayChangePercent: number;
  activeAccountsCount: number;
  totalAccountsCount: number;
  assetsByType: Record<string, number>;
  assetsByCurrency: Record<Currency, number>;
}

// 汇率转换（简化版本，实际应用中应该从API获取实时汇率）
const EXCHANGE_RATES: Record<Currency, number> = {
  CNY: 1,      // 基准货币
  USD: 7.2,    // 1 USD = 7.2 CNY
  HKD: 0.92,   // 1 HKD = 0.92 CNY
  EUR: 7.8,    // 1 EUR = 7.8 CNY
  JPY: 0.048,  // 1 JPY = 0.048 CNY
  GBP: 9.1,    // 1 GBP = 9.1 CNY
  SGD: 5.3,    // 1 SGD = 5.3 CNY
  AUD: 4.7,    // 1 AUD = 4.7 CNY
  CAD: 5.2     // 1 CAD = 5.2 CNY
};

// 将金额转换为基准货币（人民币）
export const convertToCNY = (amount: number, currency: Currency): number => {
  return amount * EXCHANGE_RATES[currency];
};

// 格式化货币显示
export const formatCurrency = (amount: number, currency: Currency = 'CNY'): string => {
  const config = getCurrencyConfig(currency);
  if (!config) return amount.toFixed(2);

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// 格式化百分比
export const formatPercent = (percent: number): string => {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
};

// 计算账户统计数据
export const calculateAccountStats = (
  accounts: Account[], 
  transactions: Transaction[] = []
): AccountStats => {
  // 过滤活跃账户
  const activeAccounts = accounts.filter(account => 
    account.status === 'active' || account.is_active !== false
  );

  // 计算总资产（转换为人民币）
  const totalAssets = accounts.reduce((sum, account) => {
    return sum + convertToCNY(account.balance || 0, account.currency);
  }, 0);

  // 计算初始投资总额
  const totalInitialInvestment = accounts.reduce((sum, account) => {
    return sum + convertToCNY(account.initial_balance || account.balance || 0, account.currency);
  }, 0);

  // 计算总收益
  const totalReturn = totalAssets - totalInitialInvestment;
  const totalReturnPercent = totalInitialInvestment > 0 
    ? (totalReturn / totalInitialInvestment) * 100 
    : 0;

  // 计算今日变化（简化版本，实际应该基于历史数据）
  // 这里暂时基于最近的交易记录来估算
  const todayTransactions = transactions.filter(t => {
    const today = new Date().toDateString();
    const transactionDate = new Date(t.transaction_date).toDateString();
    return today === transactionDate;
  });

  const todayChange = todayTransactions.reduce((sum, transaction) => {
    const account = accounts.find(a => a.id === transaction.account_id);
    if (!account) return sum;
    
    const amount = convertToCNY(transaction.amount, account.currency);
    return sum + (transaction.type === 'buy' ? -amount : amount);
  }, 0);

  const todayChangePercent = totalAssets > 0 ? (todayChange / totalAssets) * 100 : 0;

  // 按账户类型分组资产
  const assetsByType = accounts.reduce((acc, account) => {
    const amount = convertToCNY(account.balance || 0, account.currency);
    acc[account.type] = (acc[account.type] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  // 按币种分组资产
  const assetsByCurrency = accounts.reduce((acc, account) => {
    acc[account.currency] = (acc[account.currency] || 0) + (account.balance || 0);
    return acc;
  }, {} as Record<Currency, number>);

  return {
    totalAssets,
    totalReturn,
    totalReturnPercent,
    todayChange,
    todayChangePercent,
    activeAccountsCount: activeAccounts.length,
    totalAccountsCount: accounts.length,
    assetsByType,
    assetsByCurrency
  };
};

// 验证账户数据
export interface AccountValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateAccount = (
  account: Partial<Account>, 
  existingAccounts: Account[] = []
): AccountValidationResult => {
  const errors: string[] = [];

  // 检查必填字段
  if (!account.name?.trim()) {
    errors.push('账户名称不能为空');
  }

  if (!account.type) {
    errors.push('请选择账户类型');
  }

  if (!account.currency) {
    errors.push('请选择币种');
  }

  if (account.balance !== undefined && account.balance < 0) {
    errors.push('账户余额不能为负数');
  }

  if (account.initial_balance !== undefined && account.initial_balance < 0) {
    errors.push('初始资金不能为负数');
  }

  // 检查账户名称是否重复
  if (account.name) {
    const duplicateName = existingAccounts.find(existing => 
      existing.id !== account.id && 
      existing.name.toLowerCase() === account.name!.toLowerCase()
    );
    if (duplicateName) {
      errors.push('账户名称已存在');
    }
  }

  // 检查机构名称和账户号码组合是否重复
  if (account.broker && account.account_number) {
    const duplicateAccount = existingAccounts.find(existing =>
      existing.id !== account.id &&
      existing.broker === account.broker &&
      existing.account_number === account.account_number
    );
    if (duplicateAccount) {
      errors.push('该机构的账户号码已存在');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 检查账户是否有关联的交易记录
export const hasRelatedTransactions = (accountId: number, transactions: Transaction[]): boolean => {
  return transactions.some(transaction => transaction.account_id === accountId);
};

// 获取账户的交易统计
export const getAccountTransactionStats = (accountId: number, transactions: Transaction[]) => {
  const accountTransactions = transactions.filter(t => t.account_id === accountId);
  
  const totalTransactions = accountTransactions.length;
  const buyTransactions = accountTransactions.filter(t => t.type === 'buy').length;
  const sellTransactions = accountTransactions.filter(t => t.type === 'sell').length;
  
  const totalInvested = accountTransactions
    .filter(t => t.type === 'buy')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalReturned = accountTransactions
    .filter(t => t.type === 'sell')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastTransactionDate = accountTransactions.length > 0
    ? Math.max(...accountTransactions.map(t => new Date(t.transaction_date).getTime()))
    : null;

  return {
    totalTransactions,
    buyTransactions,
    sellTransactions,
    totalInvested,
    totalReturned,
    lastTransactionDate: lastTransactionDate ? new Date(lastTransactionDate).toISOString() : null
  };
};
