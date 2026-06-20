// 用户类型
export interface User {
  id: string; // 统一为UUID字符串
  username: string;
  email: string;
  subscription_type: 'free' | 'professional' | 'flagship';
  created_at: string;
}

// 账户状态枚举
export type AccountStatus = 'active' | 'inactive' | 'frozen' | 'closed';

// 账户类型枚举 - 支持更多投资账户类型
export type AccountType =
  | 'securities'    // 证券账户
  | 'stock'         // 股票账户
  | 'fund'          // 基金账户
  | 'bank'          // 银行账户
  | 'crypto'        // 虚拟货币账户
  | 'bond'          // 债券账户
  | 'futures'       // 期货账户
  | 'forex'         // 外汇账户
  | 'cash'          // 现金账户
  | 'pension'       // 养老金账户
  | 'insurance'     // 保险账户
  | 'commodity';    // 商品账户

// 币种枚举
export type Currency = 'CNY' | 'USD' | 'HKD' | 'EUR' | 'JPY' | 'GBP' | 'SGD' | 'AUD' | 'CAD';

// 账户类型
export interface Account {
  id: string; // UUID字符串
  user_id: string; // UUID字符串
  name: string;
  type: AccountType;
  broker?: string; // 券商/机构名称
  account_number?: string; // 账户号码
  currency: Currency; // 币种
  balance: number; // 当前余额
  initial_balance?: number; // 初始资金
  description?: string; // 账户描述
  status: AccountStatus; // 账户状态
  is_active?: boolean; // 是否活跃（向后兼容）
  risk_level?: 'low' | 'medium' | 'high'; // 风险等级
  created_at: string;
  updated_at?: string;
  last_transaction_date?: string; // 最后交易日期
}

// 资产类型
export interface Asset {
  id: number; // 资产ID可能仍为数字，视后端实现而定，这里暂保留数字或根据实际情况调整
  user_id: string; // UUID
  symbol: string;
  name: string;
  type: 'stock' | 'fund' | 'bond' | 'crypto';
  quantity: number;
  average_price: number;
  current_price: number;
  total_value: number;
  profit: number;
  profit_percentage: number;
  account_id: string; // UUID
  created_at: string;
  updated_at: string;
}

// 交易记录类型
export interface Transaction {
  id: string; // UUID字符串
  user_id: string; // UUID字符串
  account_id: string; // UUID字符串
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge' | 'bonus' | 'rights' | 'transfer_in' | 'transfer_out'; // 完整的交易类型
  symbol?: string; // 可选
  name?: string; // 可选
  quantity?: number; // 可选
  price?: number; // 可选
  amount: number;
  fee: number;
  tax?: number; // 税费字段
  currency?: string; // 货币类型
  exchange?: string; // 交易所
  transaction_date: string;
  notes?: string;
  created_at: string;
  updated_at?: string; // 更新时间字段
}

// 复盘日志类型
export interface ReviewLog {
  id: number;
  user_id: string; // UUID
  date?: string; // 兼容旧字段
  review_date?: string; // 新字段名
  title: string;
  content: string;
  mood: 'positive' | 'neutral' | 'negative';
  emotion_score?: number; // 情绪评分 1-10
  profit?: number; // 盈亏金额
  profit_rate?: number; // 盈亏比例
  tags?: string[]; // 可选
  lessons_learned?: string; // 经验教训
  next_plan?: string; // 下一步计划
  related_transactions?: number[]; // 关联交易
  created_at: string;
  updated_at?: string;
}

// 仪表板数据类型
export interface DashboardData {
  totalAssets: number;
  totalValue: number;
  totalProfit: number;
  profitPercentage: number;
  recentTransactions: Transaction[];
  assetDistribution: {
    name: string;
    value: number;
    percentage: number;
  }[];
  performanceData: {
    date: string;
    value: number;
    return: number;
  }[];
}

// 用户设置类型
export interface UserSettings {
  id: number;
  user_id?: string;

  // 个人信息
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;

  // 通知设置
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  priceAlerts: boolean;
  newsAlerts: boolean;
  portfolioUpdates: boolean;

  // 安全设置
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;

  // 显示设置
  language: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  theme: string;

  // 数据设置
  dataRetention: string;
  autoBackup: boolean;
  exportFormat: string;

  // 元数据
  createdAt: string;
  updatedAt: string;
  version?: number;
  checksum?: string;
  deviceId?: string;
}

// 投资计划类型
export interface InvestmentPlan {
  id: number;
  user_id?: string;
  title: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  priority: 'high' | 'medium' | 'low';
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
  assets: Array<{
    name: string;
    allocation: number;
    currentPrice: number;
    targetPrice: number;
  }>;
  milestones: Array<{
    title: string;
    targetDate: string;
    completed: boolean;
    description: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  checksum?: string;
  deviceId?: string;
}
