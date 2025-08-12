// 用户类型
export interface User {
  id: number;
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
  id: string; // 修改为UUID字符串
  user_id: string; // 统一为字符串UUID
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
  id: number;
  user_id: number;
  symbol: string;
  name: string;
  type: 'stock' | 'fund' | 'bond' | 'crypto';
  quantity: number;
  average_price: number;
  current_price: number;
  total_value: number;
  profit: number;
  profit_percentage: number;
  account_id: number;
  created_at: string;
  updated_at: string;
}

// 交易记录类型
export interface Transaction {
  id: string; // 修改为UUID字符串
  user_id: string; // 统一为字符串UUID
  account_id: string; // 修改为UUID字符串
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
  user_id: number | string; // 支持数字和字符串ID
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
  }[];
}

// 投资计划类型
export interface InvestmentPlan {
  id: number | string; // 支持数字和字符串ID
  user_id: number | string;
  title: string;
  description?: string; // 可选字段
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled'; // 添加取消状态
  created_at: string;
  updated_at?: string; // 添加更新时间字段
}
