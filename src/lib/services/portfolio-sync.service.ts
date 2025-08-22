/**
 * 通用投资组合同步服务
 */

import { createClient } from '@supabase/supabase-js';
import { Portfolio, Holding, PortfolioType, AssetType } from '@/types/portfolio.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface SyncResult {
  success: boolean;
  message: string;
  data?: Portfolio[];
}

export class PortfolioSyncService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 同步数据到云端
   */
  async syncToCloud(portfolios: Portfolio[]): Promise<SyncResult> {
    try {
      if (!supabaseUrl || !supabaseKey) {
        return {
          success: false,
          message: 'Supabase配置未完成'
        };
      }

      // 获取当前用户
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return {
          success: false,
          message: '用户未登录，请先登录后再同步'
        };
      }
      const userId = user.id;

      // 删除现有数据（先删除持仓，再删除组合）
      await this.supabase
        .from('fund_holdings')
        .delete()
        .in('portfolio_id', portfolios.map(p => p.id));

      await this.supabase
        .from('fund_portfolios')
        .delete()
        .eq('user_id', userId);

      // 插入组合数据
      const portfolioData = portfolios.map(portfolio => ({
        id: portfolio.id,
        user_id: userId,
        name: portfolio.name,
        description: portfolio.description,
        portfolio_type: portfolio.portfolioType,
        total_value: portfolio.totalValue,
        total_profit: portfolio.totalProfit,
        total_profit_rate: portfolio.totalProfitRate,
        tiantian_url: portfolio.tiantianUrl,
        created_at: portfolio.createdAt,
        updated_at: portfolio.updatedAt
      }));

      const { error: portfolioError } = await this.supabase
        .from('fund_portfolios')
        .insert(portfolioData);

      if (portfolioError) {
        console.error('同步组合数据失败:', portfolioError);
        return {
          success: false,
          message: '同步失败: ' + portfolioError.message
        };
      }

      // 插入持仓数据
      const holdingsData = [];
      for (const portfolio of portfolios) {
        for (const holding of portfolio.holdings || []) {
          const baseHolding = {
            id: holding.id,
            portfolio_id: portfolio.id,
            code: holding.code,
            name: holding.name,
            asset_type: holding.assetType,
            holding_amount: holding.holdingAmount,
            shares: holding.shares,
            cost_price: holding.costPrice,
            profit: holding.profit,
            profit_rate: holding.profitRate,
            weight: holding.weight,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // 根据资产类型添加特定字段
          if (holding.assetType === 'fund') {
            const fundHolding = holding as any;
            holdingsData.push({
              ...baseHolding,
              nav: fundHolding.nav,
              current_price: null,
              market_value: null,
              pe_ratio: null,
              pb_ratio: null,
              dividend_yield: null
            });
          } else if (holding.assetType === 'stock') {
            const stockHolding = holding as any;
            holdingsData.push({
              ...baseHolding,
              nav: null,
              current_price: stockHolding.currentPrice,
              market_value: stockHolding.marketValue,
              pe_ratio: stockHolding.peRatio,
              pb_ratio: stockHolding.pbRatio,
              dividend_yield: stockHolding.dividendYield
            });
          } else {
            // 其他资产类型
            holdingsData.push({
              ...baseHolding,
              nav: null,
              current_price: null,
              market_value: null,
              pe_ratio: null,
              pb_ratio: null,
              dividend_yield: null
            });
          }
        }
      }

      if (holdingsData.length > 0) {
        const { error: holdingsError } = await this.supabase
          .from('fund_holdings')
          .insert(holdingsData);

        if (holdingsError) {
          console.error('同步持仓数据失败:', holdingsError);
          return {
            success: false,
            message: '同步失败: ' + holdingsError.message
          };
        }
      }

      return {
        success: true,
        message: '同步成功'
      };
    } catch (error) {
      console.error('同步到云端失败:', error);
      return {
        success: false,
        message: '同步失败'
      };
    }
  }

  /**
   * 从云端同步数据
   */
  async syncFromCloud(): Promise<SyncResult> {
    try {
      if (!supabaseUrl || !supabaseKey) {
        return {
          success: false,
          message: 'Supabase配置未完成'
        };
      }

      // 获取当前用户
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return {
          success: false,
          message: '用户未登录，请先登录后再同步'
        };
      }
      const userId = user.id;

      // 获取组合数据
      const { data: portfolioData, error: portfolioError } = await this.supabase
        .from('fund_portfolios')
        .select('*')
        .eq('user_id', userId);

      if (portfolioError) {
        console.error('从云端同步组合失败:', portfolioError);
        return {
          success: false,
          message: '同步失败: ' + portfolioError.message
        };
      }

      // 获取持仓数据
      const portfolioIds = portfolioData?.map(p => p.id) || [];
      let holdingsData = [];
      
      if (portfolioIds.length > 0) {
        const { data: holdings, error: holdingsError } = await this.supabase
          .from('fund_holdings')
          .select('*')
          .in('portfolio_id', portfolioIds);

        if (holdingsError) {
          console.error('从云端同步持仓失败:', holdingsError);
          return {
            success: false,
            message: '同步失败: ' + holdingsError.message
          };
        }

        holdingsData = holdings || [];
      }

      // 组合数据
      const portfolios: Portfolio[] = portfolioData?.map(item => {
        const portfolioHoldings: Holding[] = holdingsData
          .filter(h => h.portfolio_id === item.id)
          .map(h => {
            const baseHolding = {
              id: h.id,
              code: h.code,
              name: h.name,
              assetType: (h.asset_type || 'fund') as AssetType,
              holdingAmount: parseFloat(h.holding_amount) || 0,
              shares: h.shares ? parseFloat(h.shares) : undefined,
              costPrice: h.cost_price ? parseFloat(h.cost_price) : undefined,
              profit: h.profit ? parseFloat(h.profit) : undefined,
              profitRate: h.profit_rate ? parseFloat(h.profit_rate) : undefined,
              weight: h.weight ? parseFloat(h.weight) : undefined
            };

            // 根据资产类型返回特定的持仓对象
            if (h.asset_type === 'fund') {
              return {
                ...baseHolding,
                nav: parseFloat(h.nav) || 0
              } as any;
            } else if (h.asset_type === 'stock') {
              return {
                ...baseHolding,
                currentPrice: parseFloat(h.current_price) || 0,
                marketValue: parseFloat(h.market_value) || 0,
                peRatio: h.pe_ratio ? parseFloat(h.pe_ratio) : undefined,
                pbRatio: h.pb_ratio ? parseFloat(h.pb_ratio) : undefined,
                dividendYield: h.dividend_yield ? parseFloat(h.dividend_yield) : undefined
              } as any;
            } else {
              return baseHolding as any;
            }
          });

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          portfolioType: (item.portfolio_type || 'fund') as PortfolioType,
          totalValue: parseFloat(item.total_value) || 0,
          totalProfit: parseFloat(item.total_profit) || 0,
          totalProfitRate: parseFloat(item.total_profit_rate) || 0,
          holdings: portfolioHoldings,
          tiantianUrl: item.tiantian_url,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        };
      }) || [];

      return {
        success: true,
        message: '同步成功',
        data: portfolios
      };
    } catch (error) {
      console.error('从云端同步失败:', error);
      return {
        success: false,
        message: '同步失败'
      };
    }
  }
}