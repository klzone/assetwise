// AssetWise 新数据类型定义
// 基于重新设计的数据库结构

// 用户类型 - 添加缺失字段
export interface User {
  id: string;  // UUID
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  // 新增字段
  phone?: string;
  location?: string;
  bio?: string;
  // 订阅信息
  subscription_type: 'free' | 'professional' | 'flagship';
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// 账户类型 - 使用数字ID，添加缺失字段
export interface Account {
  id: number;  // 数字ID
  user_id: string;  // UUID
  name: string;
  type: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank';
  broker?: string;
  account_number?: string;
  currency: string;
  balance: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 交易记录类型 - 使用数字ID，添加缺失字段
export interface Transaction {
  id: number;  // 数字ID
  user_id: string;  // UUID
  account_id?: number;  // 数字ID
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge';
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fee: number;
  tax: number;
  notes?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

// 复盘日志类型 - 重新设计以匹配页面功能
export interface ReviewLog {
  id: number;  // 数字ID
  user_id: string;  // UUID
  title: string;
  content: string;
  tags?: string[];
  // 情绪分析字段
  emotion_score?: number;  // 1-10评分
  mood?: 'positive' | 'neutral' | 'negative';
  // 关联数据
  related_transactions?: number[];
  // 扩展字段
  lessons_learned?: string;
  next_plan?: string;
  profit?: number;
  profit_rate?: number;
  // 日期
  review_date: string;
  created_at: string;
  updated_at: string;
}

// 资产类型 - 使用数字ID，添加风险分析字段
export interface Asset {
  id: number;  // 数字ID
  user_id: string;  // UUID
  account_id?: number;  // 数字ID
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash';
  // 价格和数量
  current_price?: number;
  quantity: number;
  average_cost: number;
  market_value: number;
  // 收益分析
  profit_loss: number;
  profit_loss_percentage: number;
  day_change: number;
  day_change_rate: number;
  weight: number;
  // 风险分析字段
  volatility?: number;
  beta?: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  // 时间戳
  last_updated: string;
  created_at: string;
  updated_at: string;
}

// 投资计划类型 - 使用数字ID
export interface InvestmentPlan {
  id: number;  // 数字ID
  user_id: string;  // UUID
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  risk_level: 'low' | 'medium' | 'high';
  category: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'fund' | 'cash';
  expected_return: number;
  actual_return: number;
  created_at: string;
  updated_at: string;
  is_active?: boolean;  // 兼容性字段
}

// 仪表板数据类型
export interface DashboardData {
  totalAssets: number;
  totalReturn: number;
  returnRate: number;
  todayChange: number;
  todayChangeRate: number;
  recentTransactions: Transaction[];
  assetDistribution: {
    name: string;
    value: number;
    percentage: number;
  }[];
  performanceData: {
    date: string;
    value: number;
    profit: number;
  }[];
}

// 资产分析数据类型
export interface AssetAnalysisData {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  totalProfitRate: number;
  dayChange: number;
  dayChangeRate: number;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
  };
  performanceData: {
    date: string;
    value: number;
    profit: number;
  }[];
  allocationData: {
    category: string;
    value: number;
    risk: number;
    return: number;
  }[];
  assets: {
    id: string;
    name: string;
    symbol: string;
    type: string;
    quantity: number;
    marketValue: number;
    weight: number;
    profit: number;
    profitRate: number;
    dayChange: number;
    dayChangeRate: number;
  }[];
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 统计数据类型
export interface Statistics {
  totalAccounts: number;
  totalTransactions: number;
  totalAssets: number;
  totalReviews: number;
  totalValue: number;
  totalProfit: number;
  profitRate: number;
}

// 搜索和过滤参数类型
export interface SearchParams {
  query?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 导入导出数据类型
export interface ImportData {
  accounts?: Account[];
  transactions?: Transaction[];
  assets?: Asset[];
  reviews?: ReviewLog[];
}

export interface ExportData extends ImportData {
  user: User;
  exportDate: string;
  version: string;
}

// 表单数据类型
export interface AccountFormData {
  name: string;
  type: 'securities' | 'fund' | 'cash' | 'crypto' | 'bank';
  broker?: string;
  account_number?: string;
  currency: string;
  balance: number;
  description?: string;
}

export interface TransactionFormData {
  account_id: number;
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw' | 'split' | 'merge';
  symbol?: string;
  name?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fee: number;
  tax: number;
  notes?: string;
  transaction_date: string;
}

export interface ReviewFormData {
  title: string;
  content: string;
  tags?: string[];
  emotion_score?: number;
  mood?: 'positive' | 'neutral' | 'negative';
  related_transactions?: number[];
  lessons_learned?: string;
  next_plan?: string;
  profit?: number;
  profit_rate?: number;
  review_date: string;
}

export interface UserProfileFormData {
  username?: string;
  full_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
}
