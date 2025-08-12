// 投资组合相关类型定义
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_allocation: PortfolioAllocation[];
  current_allocation: PortfolioAllocation[];
  total_value: number;
  target_value: number;
  rebalance_threshold: number; // 重新平衡阈值（百分比）
  risk_level: 'conservative' | 'moderate' | 'aggressive';
  investment_goal: string;
  time_horizon: number; // 投资期限（年）
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PortfolioAllocation {
  asset_type: string; // 资产类型：股票、债券、现金等
  symbol?: string; // 具体资产代码（可选）
  target_percentage: number; // 目标配置百分比
  current_percentage: number; // 当前配置百分比
  current_value: number; // 当前价值
  target_value: number; // 目标价值
}

export interface PortfolioAsset {
  id: string;
  portfolio_id: string;
  asset_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  quantity: number;
  average_price: number;
  current_price: number;
  current_value: number;
  target_percentage: number;
  current_percentage: number;
  deviation: number; // 偏离目标配置的百分比
  created_at: string;
  updated_at: string;
}

export interface PortfolioPerformance {
  portfolio_id: string;
  date: string;
  total_value: number;
  daily_return: number;
  daily_return_percentage: number;
  cumulative_return: number;
  cumulative_return_percentage: number;
  benchmark_return?: number; // 基准收益率
  alpha?: number; // 超额收益
  beta?: number; // 贝塔系数
  sharpe_ratio?: number; // 夏普比率
  max_drawdown?: number; // 最大回撤
}

export interface RebalanceRecommendation {
  portfolio_id: string;
  asset_symbol: string;
  current_percentage: number;
  target_percentage: number;
  deviation: number;
  recommended_action: 'buy' | 'sell' | 'hold';
  recommended_amount: number;
  recommended_quantity?: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface PortfolioSummary {
  total_portfolios: number;
  total_value: number;
  total_return: number;
  total_return_percentage: number;
  best_performing_portfolio: {
    id: string;
    name: string;
    return_percentage: number;
  };
  worst_performing_portfolio: {
    id: string;
    name: string;
    return_percentage: number;
  };
  asset_allocation_summary: {
    asset_type: string;
    total_value: number;
    percentage: number;
  }[];
}

// 投资组合创建表单数据
export interface CreatePortfolioData {
  name: string;
  description?: string;
  risk_level: 'conservative' | 'moderate' | 'aggressive';
  investment_goal: string;
  time_horizon: number;
  initial_amount: number;
  target_allocation: {
    asset_type: string;
    target_percentage: number;
  }[];
  rebalance_threshold: number;
}

// 投资组合更新数据
export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  risk_level?: 'conservative' | 'moderate' | 'aggressive';
  investment_goal?: string;
  time_horizon?: number;
  target_allocation?: {
    asset_type: string;
    target_percentage: number;
  }[];
  rebalance_threshold?: number;
  is_active?: boolean;
}

// 投资组合分析结果
export interface PortfolioAnalysis {
  portfolio_id: string;
  analysis_date: string;
  risk_metrics: {
    volatility: number; // 波动率
    var_95: number; // 95% VaR
    var_99: number; // 99% VaR
    beta: number;
    correlation_with_market: number;
  };
  performance_metrics: {
    total_return: number;
    annualized_return: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    calmar_ratio: number;
  };
  allocation_analysis: {
    diversification_score: number; // 多样化评分
    concentration_risk: number; // 集中度风险
    rebalance_needed: boolean;
    deviation_from_target: number;
  };
  recommendations: string[];
}

// 投资组合比较
export interface PortfolioComparison {
  portfolios: {
    id: string;
    name: string;
    total_return: number;
    volatility: number;
    sharpe_ratio: number;
    max_drawdown: number;
  }[];
  comparison_period: {
    start_date: string;
    end_date: string;
  };
  winner: {
    best_return: string;
    best_sharpe: string;
    lowest_risk: string;
  };
}