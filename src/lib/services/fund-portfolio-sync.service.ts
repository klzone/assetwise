/**
 * 基金组合同步服务
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

export class FundPortfolioSyncService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 同步数据到云端
   */
  async syncToCloud(portfolios: any[]): Promise<SyncResult> {
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
          holdingsData.push({
            id: holding.id,
            portfolio_id: portfolio.id,
            code: holding.code,
            name: holding.name,
            nav: holding.nav,
            holding_amount: holding.holdingAmount,
            shares: holding.shares,
            cost_price: holding.costPrice,
            profit: holding.profit,
            profit_rate: holding.profitRate,
            weight: holding.weight,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
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
      const portfolios = portfolioData?.map(item => {
        const portfolioHoldings = holdingsData
          .filter(h => h.portfolio_id === item.id)
          .map(h => ({
            id: h.id,
            code: h.code,
            name: h.name,
            nav: parseFloat(h.nav) || 0,
            holdingAmount: parseFloat(h.holding_amount) || 0,
            shares: h.shares ? parseFloat(h.shares) : undefined,
            costPrice: h.cost_price ? parseFloat(h.cost_price) : undefined,
            profit: h.profit ? parseFloat(h.profit) : undefined,
            profitRate: h.profit_rate ? parseFloat(h.profit_rate) : undefined,
            weight: h.weight ? parseFloat(h.weight) : undefined
          }));

        return {
          id: item.id,
          name: item.name,
          description: item.description,
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

  /**
   * 创建基金组合表（如果不存在）
   */
  async createTableIfNotExists(): Promise<void> {
    try {
      // 这个方法需要在Supabase控制台中手动创建表
      // 或者使用数据库迁移脚本
      console.log('请在Supabase控制台中创建fund_portfolios和fund_holdings表');
    } catch (error) {
      console.error('创建表失败:', error);
    }
  }
}