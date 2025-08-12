/**
 * AssetWise 核心数据类型定义
 * 定义系统中所有核心实体的数据结构
 */

// ============= 基础类型 =============

/** 用户ID类型 */
export type UserId = string;

/** 实体ID类型 */
export type EntityId = string | number;

/** 时间戳类型 */
export type Timestamp = string | Date;

/** 货币代码 */
export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'JPY' | 'HKD' | 'GBP';

/** 资产类型 */
export type AssetType = 
  | 'stock'        // 股票
  | 'fund'         // 基金
  | 'bond'         // 债券
  | 'crypto'       // 加密货币
  | 'commodity'    // 商品
  | 'real_estate'  // 房地产
  | 'cash'         // 现金
  | 'other';       // 其他

/** 交易类型 */
export type TransactionType = 
  | 'buy'          // 买入
  | 'sell'         // 卖出
  | 'dividend'     // 分红
  | 'interest'     // 利息
  | 'fee'          // 手续费
  | 'transfer_in'  // 转入
  | 'transfer_out' // 转出
  | 'split'        // 拆股
  | 'merge';       // 合股

/** 投资计划状态 */
export type PlanStatus = 
  | 'draft'        // 草稿
  | 'active'       // 进行中
  | 'completed'    // 已完成
  | 'paused'       // 暂停
  | 'cancelled';   // 已取消

/** 复盘日志类型 */
export type ReviewType = 
  | 'daily'        // 日复盘
  | 'weekly'       // 周复盘
  | 'monthly'      // 月复盘
  | 'quarterly'    // 季度复盘
  | 'yearly'       // 年度复盘
  | 'trade'        // 交易复盘
  | 'strategy';    // 策略复盘

// ============= 核心实体接口 =============

/** 基础实体接口 */
export interface BaseEntity {
  id: EntityId;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: UserId;
}

/** 资产信息 */
export interface Asset extends BaseEntity {
  /** 资产名称 */
  name: string;
  /** 资产代码/符号 */
  symbol: string;
  /** 资产类型 */
  type: AssetType;
  /** 所属市场/交易所 */
  market?: string;
  /** 货币单位 */
  currency: CurrencyCode;
  /** 当前价格 */
  current_price: number;
  /** 持有数量 */
  quantity: number;
  /** 平均成本价 */
  average_cost: number;
  /** 总成本 */
  total_cost: number;
  /** 当前市值 */
  market_value: number;
  /** 未实现盈亏 */
  unrealized_pnl: number;
  /** 未实现盈亏百分比 */
  unrealized_pnl_percent: number;
  /** 已实现盈亏 */
  realized_pnl: number;
  /** 总盈亏 */
  total_pnl: number;
  /** 今日涨跌 */
  daily_change: number;
  /** 今日涨跌百分比 */
  daily_change_percent: number;
  /** 资产描述 */
  description?: string;
  /** 标签 */
  tags?: string[];
  /** 是否活跃 */
  is_active: boolean;
  /** 最后更新价格时间 */
  last_price_update?: Timestamp;
}

/** 交易记录 */
export interface Transaction extends BaseEntity {
  /** 关联资产ID */
  asset_id: EntityId;
  /** 交易类型 */
  type: TransactionType;
  /** 交易数量 */
  quantity: number;
  /** 交易价格 */
  price: number;
  /** 交易金额 */
  amount: number;
  /** 手续费 */
  fee: number;
  /** 交易日期 */
  trade_date: Timestamp;
  /** 货币单位 */
  currency: CurrencyCode;
  /** 交易备注 */
  notes?: string;
  /** 交易平台/券商 */
  broker?: string;
  /** 订单号 */
  order_id?: string;
  /** 是否已确认 */
  is_confirmed: boolean;
}

/** 投资计划 */
export interface InvestmentPlan extends BaseEntity {
  /** 计划名称 */
  name: string;
  /** 计划描述 */
  description?: string;
  /** 计划状态 */
  status: PlanStatus;
  /** 目标金额 */
  target_amount: number;
  /** 当前金额 */
  current_amount: number;
  /** 目标日期 */
  target_date: Timestamp;
  /** 开始日期 */
  start_date: Timestamp;
  /** 结束日期 */
  end_date?: Timestamp;
  /** 货币单位 */
  currency: CurrencyCode;
  /** 风险等级 (1-5) */
  risk_level: number;
  /** 预期收益率 */
  expected_return: number;
  /** 实际收益率 */
  actual_return?: number;
  /** 关联资产ID列表 */
  asset_ids: EntityId[];
  /** 计划标签 */
  tags?: string[];
  /** 进度百分比 */
  progress_percent: number;
}

/** 复盘日志 */
export interface ReviewLog extends BaseEntity {
  /** 日志标题 */
  title: string;
  /** 日志内容 */
  content: string;
  /** 复盘类型 */
  type: ReviewType;
  /** 复盘日期 */
  review_date: Timestamp;
  /** 关联资产ID列表 */
  asset_ids?: EntityId[];
  /** 关联交易ID列表 */
  transaction_ids?: EntityId[];
  /** 关联计划ID */
  plan_id?: EntityId;
  /** 标签 */
  tags?: string[];
  /** 评分 (1-5) */
  rating?: number;
  /** 关键词 */
  keywords?: string[];
  /** 是否公开 */
  is_public: boolean;
  /** 附件URL列表 */
  attachments?: string[];
}

// ============= 统计和分析类型 =============

/** 资产组合统计 */
export interface PortfolioStats {
  /** 总资产 */
  total_assets: number;
  /** 总成本 */
  total_cost: number;
  /** 总市值 */
  total_market_value: number;
  /** 总盈亏 */
  total_pnl: number;
  /** 总盈亏百分比 */
  total_pnl_percent: number;
  /** 今日盈亏 */
  daily_pnl: number;
  /** 今日盈亏百分比 */
  daily_pnl_percent: number;
  /** 资产数量 */
  asset_count: number;
  /** 活跃资产数量 */
  active_asset_count: number;
  /** 最后更新时间 */
  last_updated: Timestamp;
}

/** 资产分配 */
export interface AssetAllocation {
  /** 资产类型 */
  type: AssetType;
  /** 资产名称 */
  name: string;
  /** 市值 */
  value: number;
  /** 占比 */
  percentage: number;
  /** 盈亏 */
  pnl: number;
  /** 盈亏百分比 */
  pnl_percent: number;
}

/** 性能指标 */
export interface PerformanceMetrics {
  /** 总收益率 */
  total_return: number;
  /** 年化收益率 */
  annualized_return: number;
  /** 夏普比率 */
  sharpe_ratio: number;
  /** 最大回撤 */
  max_drawdown: number;
  /** 波动率 */
  volatility: number;
  /** 胜率 */
  win_rate: number;
  /** 盈亏比 */
  profit_loss_ratio: number;
  /** 计算时间范围 */
  period_start: Timestamp;
  period_end: Timestamp;
}

// ============= API 响应类型 =============

/** API 响应基础结构 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Timestamp;
}

/** 分页响应 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** 市场数据 */
export interface MarketData {
  /** 资产符号 */
  symbol: string;
  /** 当前价格 */
  price: number;
  /** 涨跌额 */
  change: number;
  /** 涨跌幅 */
  change_percent: number;
  /** 开盘价 */
  open: number;
  /** 最高价 */
  high: number;
  /** 最低价 */
  low: number;
  /** 收盘价 */
  close: number;
  /** 成交量 */
  volume: number;
  /** 更新时间 */
  timestamp: Timestamp;
}

// ============= 表单和输入类型 =============

/** 创建资产表单 */
export interface CreateAssetForm {
  name: string;
  symbol: string;
  type: AssetType;
  market?: string;
  currency: CurrencyCode;
  quantity: number;
  average_cost: number;
  description?: string;
  tags?: string[];
}

/** 创建交易表单 */
export interface CreateTransactionForm {
  asset_id: EntityId;
  type: TransactionType;
  quantity: number;
  price: number;
  fee: number;
  trade_date: Timestamp;
  notes?: string;
  broker?: string;
  order_id?: string;
}

/** 创建计划表单 */
export interface CreatePlanForm {
  name: string;
  description?: string;
  target_amount: number;
  target_date: Timestamp;
  currency: CurrencyCode;
  risk_level: number;
  expected_return: number;
  asset_ids?: EntityId[];
  tags?: string[];
}

/** 创建复盘表单 */
export interface CreateReviewForm {
  title: string;
  content: string;
  type: ReviewType;
  review_date: Timestamp;
  asset_ids?: EntityId[];
  transaction_ids?: EntityId[];
  plan_id?: EntityId;
  tags?: string[];
  rating?: number;
  keywords?: string[];
}

// ============= 查询和过滤类型 =============

/** 基础查询参数 */
export interface BaseQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

/** 资产查询参数 */
export interface AssetQuery extends BaseQuery {
  type?: AssetType;
  currency?: CurrencyCode;
  market?: string;
  is_active?: boolean;
  tags?: string[];
  min_value?: number;
  max_value?: number;
}

/** 交易查询参数 */
export interface TransactionQuery extends BaseQuery {
  asset_id?: EntityId;
  type?: TransactionType;
  currency?: CurrencyCode;
  broker?: string;
  start_date?: Timestamp;
  end_date?: Timestamp;
  min_amount?: number;
  max_amount?: number;
}

/** 计划查询参数 */
export interface PlanQuery extends BaseQuery {
  status?: PlanStatus;
  currency?: CurrencyCode;
  risk_level?: number;
  tags?: string[];
  start_date?: Timestamp;
  end_date?: Timestamp;
}

/** 复盘查询参数 */
export interface ReviewQuery extends BaseQuery {
  type?: ReviewType;
  tags?: string[];
  keywords?: string[];
  rating?: number;
  start_date?: Timestamp;
  end_date?: Timestamp;
  is_public?: boolean;
}