// 投资组合类型定义

export type PortfolioType = 'fund' | 'stock' | 'mixed';
export type AssetType = 'fund' | 'stock' | 'bond' | 'crypto' | 'other';

// 基础持仓接口
export interface BaseHolding {
  id: string;
  code: string;
  name: string;
  holdingAmount: number; // 持有金额
  shares?: number; // 持有份额/股数
  costPrice?: number; // 成本价格
  profit?: number; // 盈亏
  profitRate?: number; // 盈亏率
  weight?: number; // 权重
  assetType: AssetType;
}

// 基金持仓
export interface FundHolding extends BaseHolding {
  assetType: 'fund';
  nav: number; // 净值
  fundType?: string; // 基金类型
  fundCompany?: string; // 基金公司
}

// 股票持仓
export interface StockHolding extends BaseHolding {
  assetType: 'stock';
  currentPrice: number; // 当前价格
  marketValue: number; // 市值
  peRatio?: number; // 市盈率
  pbRatio?: number; // 市净率
  dividendYield?: number; // 股息率
  sector?: string; // 行业
  exchange?: string; // 交易所
}

// 通用持仓类型
export type Holding = FundHolding | StockHolding;

// 投资组合接口
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  portfolioType: PortfolioType;
  totalValue: number;
  totalProfit: number;
  totalProfitRate: number;
  holdings: Holding[];
  createdAt: string;
  updatedAt: string;
  tiantianUrl?: string; // 天天基金组合链接（仅基金组合）
}

// 基金组合（向后兼容）
export interface FundPortfolio extends Portfolio {
  portfolioType: 'fund';
  holdings: FundHolding[];
}

// 股票组合
export interface StockPortfolio extends Portfolio {
  portfolioType: 'stock';
  holdings: StockHolding[];
}

// 混合组合
export interface MixedPortfolio extends Portfolio {
  portfolioType: 'mixed';
  holdings: Holding[];
}

// 组合统计信息
export interface PortfolioStats {
  totalValue: number;
  totalProfit: number;
  totalProfitRate: number;
  count: number;
  assetDistribution: Record<AssetType, number>;
}

// 创建组合的表单数据
export interface CreatePortfolioForm {
  name: string;
  description?: string;
  portfolioType: PortfolioType;
}

// 添加资产的表单数据
export interface AddAssetForm {
  code: string;
  name: string;
  assetType: AssetType;
  holdingAmount: string;
  shares?: string;
  costPrice?: string;
  // 基金特有字段
  nav?: string;
  fundType?: string;
  fundCompany?: string;
  // 股票特有字段
  currentPrice?: string;
  peRatio?: string;
  pbRatio?: string;
  dividendYield?: string;
  sector?: string;
  exchange?: string;
}