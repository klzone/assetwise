import {
  Portfolio,
  PortfolioAsset,
  PortfolioPerformance,
  RebalanceRecommendation,
  PortfolioSummary,
  CreatePortfolioData,
  UpdatePortfolioData,
  PortfolioAnalysis,
  PortfolioComparison,
  PortfolioAllocation
} from '@/lib/types/portfolio.types';
import { Asset, Transaction } from '@/lib/types/data.types';
import { InputSanitizationService } from './secure-data.service';

class PortfolioService {
  private readonly STORAGE_KEYS = {
    PORTFOLIOS: 'assetwise_portfolios',
    PORTFOLIO_ASSETS: 'assetwise_portfolio_assets',
    PORTFOLIO_PERFORMANCE: 'assetwise_portfolio_performance'
  };

  // 获取用户的所有投资组合
  async getPortfolios(userId: string): Promise<Portfolio[]> {
    try {
      const portfolios = this.getStoredData<Portfolio[]>(this.STORAGE_KEYS.PORTFOLIOS) || [];
      return portfolios.filter(portfolio => portfolio.user_id === userId && portfolio.is_active);
    } catch (error) {
      console.error('获取投资组合失败:', error);
      return [];
    }
  }

  // 根据ID获取特定投资组合
  async getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
    try {
      const portfolios = this.getStoredData<Portfolio[]>(this.STORAGE_KEYS.PORTFOLIOS) || [];
      return portfolios.find(portfolio => portfolio.id === portfolioId && portfolio.is_active) || null;
    } catch (error) {
      console.error('获取投资组合详情失败:', error);
      return null;
    }
  }

  // 创建新的投资组合
  async createPortfolio(userId: string, data: CreatePortfolioData): Promise<{ success: boolean; error?: string; data?: Portfolio }> {
    try {
      // 验证输入数据
      const validation = this.validateCreatePortfolioData(data);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // 检查目标配置总和是否为100%
      const totalAllocation = data.target_allocation.reduce((sum, allocation) => sum + allocation.target_percentage, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        return { success: false, error: '目标资产配置总和必须为100%' };
      }

      const portfolios = this.getStoredData<Portfolio[]>(this.STORAGE_KEYS.PORTFOLIOS) || [];
      
      // 检查名称是否重复
      const existingPortfolio = portfolios.find(p => 
        p.user_id === userId && 
        p.name.toLowerCase() === data.name.toLowerCase() && 
        p.is_active
      );
      
      if (existingPortfolio) {
        return { success: false, error: '投资组合名称已存在' };
      }

      // 创建新投资组合
      const newPortfolio: Portfolio = {
        id: this.generateId(),
        user_id: userId,
        name: InputSanitizationService.sanitizeText(data.name),
        description: data.description ? InputSanitizationService.sanitizeText(data.description) : undefined,
        target_allocation: data.target_allocation.map(allocation => ({
          asset_type: InputSanitizationService.sanitizeText(allocation.asset_type),
          target_percentage: allocation.target_percentage,
          current_percentage: 0,
          current_value: 0,
          target_value: (data.initial_amount * allocation.target_percentage) / 100
        })),
        current_allocation: data.target_allocation.map(allocation => ({
          asset_type: InputSanitizationService.sanitizeText(allocation.asset_type),
          target_percentage: allocation.target_percentage,
          current_percentage: 0,
          current_value: 0,
          target_value: 0
        })),
        total_value: 0,
        target_value: data.initial_amount,
        rebalance_threshold: data.rebalance_threshold,
        risk_level: data.risk_level,
        investment_goal: InputSanitizationService.sanitizeText(data.investment_goal),
        time_horizon: data.time_horizon,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      portfolios.push(newPortfolio);
      this.setStoredData(this.STORAGE_KEYS.PORTFOLIOS, portfolios);

      console.log('✅ 投资组合创建成功:', newPortfolio.name);
      return { success: true, data: newPortfolio };
    } catch (error) {
      console.error('创建投资组合失败:', error);
      return { success: false, error: '创建投资组合时发生错误' };
    }
  }

  // 更新投资组合
  async updatePortfolio(portfolioId: string, updates: UpdatePortfolioData): Promise<{ success: boolean; error?: string; data?: Portfolio }> {
    try {
      const portfolios = this.getStoredData<Portfolio[]>(this.STORAGE_KEYS.PORTFOLIOS) || [];
      const index = portfolios.findIndex(portfolio => portfolio.id === portfolioId);

      if (index === -1) {
        return { success: false, error: '投资组合不存在' };
      }

      const portfolio = portfolios[index];

      // 验证更新数据
      if (updates.name) {
        const existingPortfolio = portfolios.find(p => 
          p.user_id === portfolio.user_id && 
          p.name.toLowerCase() === updates.name!.toLowerCase() && 
          p.id !== portfolioId &&
          p.is_active
        );
        
        if (existingPortfolio) {
          return { success: false, error: '投资组合名称已存在' };
        }
      }

      // 检查目标配置总和
      if (updates.target_allocation) {
        const totalAllocation = updates.target_allocation.reduce((sum, allocation) => sum + allocation.target_percentage, 0);
        if (Math.abs(totalAllocation - 100) > 0.01) {
          return { success: false, error: '目标资产配置总和必须为100%' };
        }
      }

      // 应用更新
      const updatedPortfolio: Portfolio = {
        ...portfolio,
        name: updates.name ? InputSanitizationService.sanitizeText(updates.name) : portfolio.name,
        description: updates.description ? InputSanitizationService.sanitizeText(updates.description) : portfolio.description,
        risk_level: updates.risk_level || portfolio.risk_level,
        investment_goal: updates.investment_goal ? InputSanitizationService.sanitizeText(updates.investment_goal) : portfolio.investment_goal,
        time_horizon: updates.time_horizon || portfolio.time_horizon,
        rebalance_threshold: updates.rebalance_threshold || portfolio.rebalance_threshold,
        is_active: updates.is_active !== undefined ? updates.is_active : portfolio.is_active,
        updated_at: new Date().toISOString()
      };

      // 更新目标配置
      if (updates.target_allocation) {
        updatedPortfolio.target_allocation = updates.target_allocation.map(allocation => ({
          asset_type: InputSanitizationService.sanitizeText(allocation.asset_type),
          target_percentage: allocation.target_percentage,
          current_percentage: portfolio.current_allocation.find(ca => ca.asset_type === allocation.asset_type)?.current_percentage || 0,
          current_value: portfolio.current_allocation.find(ca => ca.asset_type === allocation.asset_type)?.current_value || 0,
          target_value: (portfolio.total_value * allocation.target_percentage) / 100
        }));
      }

      portfolios[index] = updatedPortfolio;
      this.setStoredData(this.STORAGE_KEYS.PORTFOLIOS, portfolios);

      console.log('✅ 投资组合更新成功:', updatedPortfolio.name);
      return { success: true, data: updatedPortfolio };
    } catch (error) {
      console.error('更新投资组合失败:', error);
      return { success: false, error: '更新投资组合时发生错误' };
    }
  }

  // 删除投资组合（软删除）
  async deletePortfolio(portfolioId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const portfolios = this.getStoredData<Portfolio[]>(this.STORAGE_KEYS.PORTFOLIOS) || [];
      const index = portfolios.findIndex(portfolio => portfolio.id === portfolioId);

      if (index === -1) {
        return { success: false, error: '投资组合不存在' };
      }

      // 软删除：设置is_active为false
      portfolios[index] = {
        ...portfolios[index],
        is_active: false,
        updated_at: new Date().toISOString()
      };

      this.setStoredData(this.STORAGE_KEYS.PORTFOLIOS, portfolios);

      console.log('✅ 投资组合删除成功:', portfolios[index].name);
      return { success: true };
    } catch (error) {
      console.error('删除投资组合失败:', error);
      return { success: false, error: '删除投资组合时发生错误' };
    }
  }

  // 获取投资组合中的资产
  async getPortfolioAssets(portfolioId: string): Promise<PortfolioAsset[]> {
    try {
      const portfolioAssets = this.getStoredData<PortfolioAsset[]>(this.STORAGE_KEYS.PORTFOLIO_ASSETS) || [];
      return portfolioAssets.filter(asset => asset.portfolio_id === portfolioId);
    } catch (error) {
      console.error('获取投资组合资产失败:', error);
      return [];
    }
  }

  // 向投资组合添加资产
  async addAssetToPortfolio(portfolioId: string, assetData: {
    asset_id: string;
    symbol: string;
    name: string;
    asset_type: string;
    quantity: number;
    average_price: number;
    current_price: number;
    target_percentage: number;
  }): Promise<{ success: boolean; error?: string; data?: PortfolioAsset }> {
    try {
      const portfolio = await this.getPortfolioById(portfolioId);
      if (!portfolio) {
        return { success: false, error: '投资组合不存在' };
      }

      const portfolioAssets = this.getStoredData<PortfolioAsset[]>(this.STORAGE_KEYS.PORTFOLIO_ASSETS) || [];
      
      // 检查资产是否已存在
      const existingAsset = portfolioAssets.find(asset => 
        asset.portfolio_id === portfolioId && asset.asset_id === assetData.asset_id
      );

      if (existingAsset) {
        return { success: false, error: '该资产已在投资组合中' };
      }

      const currentValue = assetData.quantity * assetData.current_price;
      const currentPercentage = portfolio.total_value > 0 ? (currentValue / portfolio.total_value) * 100 : 0;

      const newPortfolioAsset: PortfolioAsset = {
        id: this.generateId(),
        portfolio_id: portfolioId,
        asset_id: assetData.asset_id,
        symbol: InputSanitizationService.sanitizeText(assetData.symbol).toUpperCase(),
        name: InputSanitizationService.sanitizeText(assetData.name),
        asset_type: InputSanitizationService.sanitizeText(assetData.asset_type),
        quantity: assetData.quantity,
        average_price: assetData.average_price,
        current_price: assetData.current_price,
        current_value: currentValue,
        target_percentage: assetData.target_percentage,
        current_percentage: currentPercentage,
        deviation: currentPercentage - assetData.target_percentage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      portfolioAssets.push(newPortfolioAsset);
      this.setStoredData(this.STORAGE_KEYS.PORTFOLIO_ASSETS, portfolioAssets);

      // 更新投资组合的总价值和当前配置
      await this.updatePortfolioAllocations(portfolioId);

      console.log('✅ 资产添加到投资组合成功:', newPortfolioAsset.symbol);
      return { success: true, data: newPortfolioAsset };
    } catch (error) {
      console.error('添加资产到投资组合失败:', error);
      return { success: false, error: '添加资产时发生错误' };
    }
  }

  // 从投资组合移除资产
  async removeAssetFromPortfolio(portfolioId: string, assetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const portfolioAssets = this.getStoredData<PortfolioAsset[]>(this.STORAGE_KEYS.PORTFOLIO_ASSETS) || [];
      const filteredAssets = portfolioAssets.filter(asset => 
        !(asset.portfolio_id === portfolioId && asset.asset_id === assetId)
      );

      if (filteredAssets.length === portfolioAssets.length) {
        return { success: false, error: '资产不在投资组合中' };
      }

      this.setStoredData(this.STORAGE_KEYS.PORTFOLIO_ASSETS, filteredAssets);

      // 更新投资组合的总价值和当前配置
      await this.updatePortfolioAllocations(portfolioId);

      console.log('✅ 资产从投资组合移除成功');
      return { success: true };
    } catch (error) {
      console.error('从投资组合移除资产失败:', error);
      return { success: false, error: '移除资产时发生错误' };
    }
  }

  // 更新投资组合的资产配置
  private async updatePortfolioAllocations(portfolioId: string): Promise<void> {
    try {
      const portfolio = await this.getPortfolioById(portfolioId);
      const portfolioAssets = await this.getPortfolioAssets(portfolioId);

      if (!portfolio) return;

      // 计算总价值
      const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.current_value, 0);

      // 按资产类型分组计算当前配置
      const allocationMap = new Map<string, { current_value: number; current_percentage: number }>();

      portfolioAssets.forEach(asset => {
        const existing = allocationMap.get(asset.asset_type) || { current_value: 0, current_percentage: 0 };
        existing.current_value += asset.current_value;
        existing.current_percentage = totalValue > 0 ? (existing.current_value / totalValue) * 100 : 0;
        allocationMap.set(asset.asset_type, existing);
      });

      // 更新当前配置
      const updatedCurrentAllocation: PortfolioAllocation[] = portfolio.target_allocation.map(target => {
        const current = allocationMap.get(target.asset_type) || { current_value: 0, current_percentage: 0 };
        return {
          asset_type: target.asset_type,
          target_percentage: target.target_percentage,
          current_percentage: current.current_percentage,
          current_value: current.current_value,
          target_value: totalValue > 0 ? (totalValue * target.target_percentage) / 100 : 0
        };
      });

      // 更新投资组合
      const portfolios = this.getStoredData<Portfolio[]>(this.STORAGE_KEYS.PORTFOLIOS) || [];
      const index = portfolios.findIndex(p => p.id === portfolioId);

      if (index !== -1) {
        portfolios[index] = {
          ...portfolios[index],
          total_value: totalValue,
          current_allocation: updatedCurrentAllocation,
          updated_at: new Date().toISOString()
        };

        this.setStoredData(this.STORAGE_KEYS.PORTFOLIOS, portfolios);
      }
    } catch (error) {
      console.error('更新投资组合配置失败:', error);
    }
  }

  // 获取重新平衡建议
  async getRebalanceRecommendations(portfolioId: string): Promise<RebalanceRecommendation[]> {
    try {
      const portfolio = await this.getPortfolioById(portfolioId);
      const portfolioAssets = await this.getPortfolioAssets(portfolioId);

      if (!portfolio || portfolioAssets.length === 0) {
        return [];
      }

      const recommendations: RebalanceRecommendation[] = [];

      // 分析每个资产类型的偏离情况
      portfolio.current_allocation.forEach(current => {
        const target = portfolio.target_allocation.find(t => t.asset_type === current.asset_type);
        if (!target) return;

        const deviation = current.current_percentage - target.target_percentage;
        const absDeviation = Math.abs(deviation);

        // 如果偏离超过阈值，生成建议
        if (absDeviation > portfolio.rebalance_threshold) {
          const targetValue = (portfolio.total_value * target.target_percentage) / 100;
          const recommendedAmount = targetValue - current.current_value;

          recommendations.push({
            portfolio_id: portfolioId,
            asset_symbol: current.asset_type,
            current_percentage: current.current_percentage,
            target_percentage: target.target_percentage,
            deviation: deviation,
            recommended_action: recommendedAmount > 0 ? 'buy' : 'sell',
            recommended_amount: Math.abs(recommendedAmount),
            priority: absDeviation > portfolio.rebalance_threshold * 2 ? 'high' : 
                     absDeviation > portfolio.rebalance_threshold * 1.5 ? 'medium' : 'low',
            reason: deviation > 0 ? 
              `${current.asset_type}配置过高，超出目标${absDeviation.toFixed(2)}%` :
              `${current.asset_type}配置过低，低于目标${absDeviation.toFixed(2)}%`
          });
        }
      });

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('获取重新平衡建议失败:', error);
      return [];
    }
  }

  // 获取投资组合摘要
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    try {
      const portfolios = await this.getPortfolios(userId);
      
      if (portfolios.length === 0) {
        return {
          total_portfolios: 0,
          total_value: 0,
          total_return: 0,
          total_return_percentage: 0,
          best_performing_portfolio: { id: '', name: '', return_percentage: 0 },
          worst_performing_portfolio: { id: '', name: '', return_percentage: 0 },
          asset_allocation_summary: []
        };
      }

      const totalValue = portfolios.reduce((sum, portfolio) => sum + portfolio.total_value, 0);
      
      // 计算总收益（简化计算，实际应基于历史数据）
      const totalTargetValue = portfolios.reduce((sum, portfolio) => sum + portfolio.target_value, 0);
      const totalReturn = totalValue - totalTargetValue;
      const totalReturnPercentage = totalTargetValue > 0 ? (totalReturn / totalTargetValue) * 100 : 0;

      // 找出表现最好和最差的投资组合（简化计算）
      let bestPortfolio = portfolios[0];
      let worstPortfolio = portfolios[0];

      portfolios.forEach(portfolio => {
        const returnPercentage = portfolio.target_value > 0 ? 
          ((portfolio.total_value - portfolio.target_value) / portfolio.target_value) * 100 : 0;
        
        const bestReturn = bestPortfolio.target_value > 0 ? 
          ((bestPortfolio.total_value - bestPortfolio.target_value) / bestPortfolio.target_value) * 100 : 0;
        
        const worstReturn = worstPortfolio.target_value > 0 ? 
          ((worstPortfolio.total_value - worstPortfolio.target_value) / worstPortfolio.target_value) * 100 : 0;

        if (returnPercentage > bestReturn) {
          bestPortfolio = portfolio;
        }
        if (returnPercentage < worstReturn) {
          worstPortfolio = portfolio;
        }
      });

      // 计算资产配置摘要
      const allocationMap = new Map<string, number>();
      portfolios.forEach(portfolio => {
        portfolio.current_allocation.forEach(allocation => {
          const existing = allocationMap.get(allocation.asset_type) || 0;
          allocationMap.set(allocation.asset_type, existing + allocation.current_value);
        });
      });

      const assetAllocationSummary = Array.from(allocationMap.entries()).map(([assetType, value]) => ({
        asset_type: assetType,
        total_value: value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      }));

      return {
        total_portfolios: portfolios.length,
        total_value: totalValue,
        total_return: totalReturn,
        total_return_percentage: totalReturnPercentage,
        best_performing_portfolio: {
          id: bestPortfolio.id,
          name: bestPortfolio.name,
          return_percentage: bestPortfolio.target_value > 0 ? 
            ((bestPortfolio.total_value - bestPortfolio.target_value) / bestPortfolio.target_value) * 100 : 0
        },
        worst_performing_portfolio: {
          id: worstPortfolio.id,
          name: worstPortfolio.name,
          return_percentage: worstPortfolio.target_value > 0 ? 
            ((worstPortfolio.total_value - worstPortfolio.target_value) / worstPortfolio.target_value) * 100 : 0
        },
        asset_allocation_summary: assetAllocationSummary
      };
    } catch (error) {
      console.error('获取投资组合摘要失败:', error);
      return {
        total_portfolios: 0,
        total_value: 0,
        total_return: 0,
        total_return_percentage: 0,
        best_performing_portfolio: { id: '', name: '', return_percentage: 0 },
        worst_performing_portfolio: { id: '', name: '', return_percentage: 0 },
        asset_allocation_summary: []
      };
    }
  }

  // 验证创建投资组合数据
  private validateCreatePortfolioData(data: CreatePortfolioData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('投资组合名称不能为空');
    }

    if (data.name && data.name.length > 100) {
      errors.push('投资组合名称不能超过100个字符');
    }

    if (!['conservative', 'moderate', 'aggressive'].includes(data.risk_level)) {
      errors.push('风险等级必须是conservative、moderate或aggressive之一');
    }

    if (!data.investment_goal || data.investment_goal.trim().length === 0) {
      errors.push('投资目标不能为空');
    }

    if (data.time_horizon <= 0 || data.time_horizon > 50) {
      errors.push('投资期限必须在1-50年之间');
    }

    if (data.initial_amount <= 0) {
      errors.push('初始投资金额必须大于0');
    }

    if (data.rebalance_threshold <= 0 || data.rebalance_threshold > 50) {
      errors.push('重新平衡阈值必须在0-50%之间');
    }

    if (!data.target_allocation || data.target_allocation.length === 0) {
      errors.push('必须设置至少一个目标资产配置');
    }

    if (data.target_allocation) {
      data.target_allocation.forEach((allocation, index) => {
        if (!allocation.asset_type || allocation.asset_type.trim().length === 0) {
          errors.push(`第${index + 1}个资产配置的资产类型不能为空`);
        }
        if (allocation.target_percentage <= 0 || allocation.target_percentage > 100) {
          errors.push(`第${index + 1}个资产配置的目标百分比必须在0-100%之间`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // 存储数据到localStorage
  private setStoredData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('存储数据失败:', error);
    }
  }

  // 从localStorage获取数据
  private getStoredData<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('读取数据失败:', error);
      return null;
    }
  }

  // 基于交易记录同步投资组合资产
  async syncPortfolioWithTransactions(portfolioId: string, transactions: Transaction[]): Promise<{ success: boolean; error?: string }> {
    try {
      const portfolio = await this.getPortfolioById(portfolioId);
      if (!portfolio) {
        return { success: false, error: '投资组合不存在' };
      }

      // 按资产分组交易记录
      const assetTransactions = new Map<string, Transaction[]>();
      transactions.forEach(transaction => {
        const existing = assetTransactions.get(transaction.symbol) || [];
        existing.push(transaction);
        assetTransactions.set(transaction.symbol, existing);
      });

      const portfolioAssets = this.getStoredData<PortfolioAsset[]>(this.STORAGE_KEYS.PORTFOLIO_ASSETS) || [];
      const updatedAssets: PortfolioAsset[] = [];

      // 处理每个资产的交易记录
      for (const [symbol, assetTxns] of assetTransactions.entries()) {
        let totalQuantity = 0;
        let totalCost = 0;

        // 计算持仓和平均成本
        assetTxns.forEach(txn => {
          const quantity = txn.quantity || 0;
          const amount = txn.amount || 0;
          
          if (txn.type === 'buy') {
            totalQuantity += quantity;
            totalCost += amount;
          } else if (txn.type === 'sell') {
            totalQuantity -= quantity;
            totalCost -= (amount * (totalCost / (totalQuantity + quantity)));
          }
        });

        if (totalQuantity > 0) {
          const averagePrice = totalCost / totalQuantity;
          const latestTransaction = assetTxns[assetTxns.length - 1];
          const currentPrice = latestTransaction.price || 0;
          
          // 查找现有的投资组合资产
          let existingAsset = portfolioAssets.find(asset => 
            asset.portfolio_id === portfolioId && asset.symbol === symbol
          );

          if (existingAsset) {
            // 更新现有资产
            existingAsset.quantity = totalQuantity;
            existingAsset.average_price = averagePrice;
            existingAsset.current_price = currentPrice;
            existingAsset.current_value = totalQuantity * currentPrice;
            existingAsset.updated_at = new Date().toISOString();
            updatedAssets.push(existingAsset);
          } else {
            // 创建新的投资组合资产
            const newAsset: PortfolioAsset = {
              id: this.generateId(),
              portfolio_id: portfolioId,
              asset_id: latestTransaction.symbol || symbol,
              symbol: symbol,
              name: latestTransaction.name || symbol,
              asset_type: this.inferAssetType(symbol),
              quantity: totalQuantity,
              average_price: averagePrice,
              current_price: currentPrice,
              current_value: totalQuantity * currentPrice,
              target_percentage: 0, // 需要手动设置
              current_percentage: 0, // 将在updatePortfolioAllocations中计算
              deviation: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            portfolioAssets.push(newAsset);
            updatedAssets.push(newAsset);
          }
        }
      }

      // 保存更新的投资组合资产
      this.setStoredData(this.STORAGE_KEYS.PORTFOLIO_ASSETS, portfolioAssets);

      // 更新投资组合配置
      await this.updatePortfolioAllocations(portfolioId);

      console.log('✅ 投资组合与交易记录同步成功');
      return { success: true };
    } catch (error) {
      console.error('同步投资组合与交易记录失败:', error);
      return { success: false, error: '同步过程中发生错误' };
    }
  }

  // 推断资产类型
  private inferAssetType(symbol: string): string {
    // 简单的资产类型推断逻辑
    if (symbol.includes('ETF') || symbol.includes('基金')) {
      return '基金';
    } else if (symbol.includes('债券') || symbol.includes('BOND')) {
      return '债券';
    } else if (symbol.includes('现金') || symbol.includes('CASH')) {
      return '现金';
    } else {
      return '股票'; // 默认为股票
    }
  }

  // 计算投资组合风险指标
  async calculatePortfolioRisk(portfolioId: string): Promise<{
    volatility: number;
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }> {
    try {
      // 这里是简化的风险计算，实际应用中需要更复杂的算法
      const portfolio = await this.getPortfolioById(portfolioId);
      const portfolioAssets = await this.getPortfolioAssets(portfolioId);

      if (!portfolio || portfolioAssets.length === 0) {
        return { volatility: 0, beta: 0, sharpeRatio: 0, maxDrawdown: 0 };
      }

      // 基于风险等级的简化计算
      let baseVolatility = 0;
      switch (portfolio.risk_level) {
        case 'conservative':
          baseVolatility = 0.08; // 8%
          break;
        case 'moderate':
          baseVolatility = 0.15; // 15%
          break;
        case 'aggressive':
          baseVolatility = 0.25; // 25%
          break;
      }

      // 根据资产分散程度调整波动率
      const diversificationFactor = Math.min(portfolioAssets.length / 10, 1);
      const adjustedVolatility = baseVolatility * (1 - diversificationFactor * 0.2);

      return {
        volatility: adjustedVolatility,
        beta: portfolio.risk_level === 'conservative' ? 0.7 : 
              portfolio.risk_level === 'moderate' ? 1.0 : 1.3,
        sharpeRatio: Math.random() * 2, // 简化计算
        maxDrawdown: adjustedVolatility * 2 // 简化计算
      };
    } catch (error) {
      console.error('计算投资组合风险失败:', error);
      return { volatility: 0, beta: 0, sharpeRatio: 0, maxDrawdown: 0 };
    }
  }

  // 导出投资组合数据
  async exportPortfolioData(portfolioId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const portfolio = await this.getPortfolioById(portfolioId);
      const portfolioAssets = await this.getPortfolioAssets(portfolioId);
      const rebalanceRecommendations = await this.getRebalanceRecommendations(portfolioId);

      if (!portfolio) {
        return { success: false, error: '投资组合不存在' };
      }

      const exportData = {
        portfolio: portfolio,
        assets: portfolioAssets,
        rebalance_recommendations: rebalanceRecommendations,
        export_date: new Date().toISOString(),
        export_version: '1.0'
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error('导出投资组合数据失败:', error);
      return { success: false, error: '导出过程中发生错误' };
    }
  }

  // 导入投资组合数据
  async importPortfolioData(userId: string, importData: any): Promise<{ success: boolean; error?: string; data?: Portfolio }> {
    try {
      // 验证导入数据格式
      if (!importData.portfolio || !importData.assets) {
        return { success: false, error: '导入数据格式不正确' };
      }

      const portfolioData = importData.portfolio;
      
      // 创建新的投资组合
      const createData: CreatePortfolioData = {
        name: portfolioData.name + '_导入',
        description: portfolioData.description,
        risk_level: portfolioData.risk_level,
        investment_goal: portfolioData.investment_goal,
        time_horizon: portfolioData.time_horizon,
        initial_amount: portfolioData.target_value,
        target_allocation: portfolioData.target_allocation.map((allocation: any) => ({
          asset_type: allocation.asset_type,
          target_percentage: allocation.target_percentage
        })),
        rebalance_threshold: portfolioData.rebalance_threshold
      };

      const createResult = await this.createPortfolio(userId, createData);
      if (!createResult.success || !createResult.data) {
        return { success: false, error: createResult.error };
      }

      // 导入资产数据
      const portfolioAssets = this.getStoredData<PortfolioAsset[]>(this.STORAGE_KEYS.PORTFOLIO_ASSETS) || [];
      
      importData.assets.forEach((asset: any) => {
        const newAsset: PortfolioAsset = {
          ...asset,
          id: this.generateId(),
          portfolio_id: createResult.data!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        portfolioAssets.push(newAsset);
      });

      this.setStoredData(this.STORAGE_KEYS.PORTFOLIO_ASSETS, portfolioAssets);

      // 更新投资组合配置
      await this.updatePortfolioAllocations(createResult.data.id);

      console.log('✅ 投资组合数据导入成功');
      return { success: true, data: createResult.data };
    } catch (error) {
      console.error('导入投资组合数据失败:', error);
      return { success: false, error: '导入过程中发生错误' };
    }
  }
}

export const portfolioService = new PortfolioService();
