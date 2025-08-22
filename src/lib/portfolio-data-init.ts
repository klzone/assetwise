import { Portfolio, PortfolioAsset } from '@/lib/types/portfolio.types';
import { Asset } from '@/lib/types/data.types';
import { PortfolioService } from '@/lib/services/portfolio.service';
import { AssetStorage } from '@/lib/asset-storage';

export class PortfolioDataInit {
  private portfolioService: PortfolioService;
  private assetStorage: AssetStorage;

  constructor() {
    this.portfolioService = new PortfolioService();
    this.assetStorage = AssetStorage.getInstance();
  }

  async initializeSampleData(): Promise<void> {
    try {
      // 检查是否已有投资组合数据
      const existingPortfolios = await this.portfolioService.getUserPortfolios('user-1');
      if (existingPortfolios.length > 0) {
        console.log('投资组合数据已存在，跳过初始化');
        return;
      }

      // 获取现有资产
      const assets = this.assetStorage.getAllAssets();
      if (assets.length === 0) {
        console.log('没有可用资产，请先初始化资产数据');
        return;
      }

      // 创建示例投资组合
      await this.createSamplePortfolios(assets);
      
      console.log('✅ 投资组合示例数据初始化完成');
    } catch (error) {
      console.error('❌ 投资组合数据初始化失败:', error);
    }
  }

  private async createSamplePortfolios(assets: Asset[]): Promise<void> {
    // 稳健型投资组合
    const conservativePortfolio = {
      name: '稳健增长组合',
      description: '以稳定收益为目标的保守型投资组合，适合风险承受能力较低的投资者',
      risk_level: 'low' as const,
      investment_goal: '资本保值增值，追求稳定收益',
      time_horizon: '3-5年',
      rebalance_threshold: 5,
      target_allocation: [
        { asset_type: '债券', target_percentage: 60, target_value: 60000 },
        { asset_type: '股票', target_percentage: 30, target_value: 30000 },
        { asset_type: '现金', target_percentage: 10, target_value: 10000 }
      ]
    };

    const conservativeResult = await this.portfolioService.createPortfolio('user-1', conservativePortfolio);
    if (conservativeResult.success && conservativeResult.data) {
      await this.addAssetsToPortfolio(conservativeResult.data.id, assets, 'conservative');
    }

    // 平衡型投资组合
    const balancedPortfolio = {
      name: '平衡配置组合',
      description: '股债平衡的中等风险投资组合，追求收益与风险的平衡',
      risk_level: 'medium' as const,
      investment_goal: '长期资本增值，平衡风险与收益',
      time_horizon: '5-10年',
      rebalance_threshold: 8,
      target_allocation: [
        { asset_type: '股票', target_percentage: 50, target_value: 75000 },
        { asset_type: '债券', target_percentage: 35, target_value: 52500 },
        { asset_type: '基金', target_percentage: 10, target_value: 15000 },
        { asset_type: '现金', target_percentage: 5, target_value: 7500 }
      ]
    };

    const balancedResult = await this.portfolioService.createPortfolio('user-1', balancedPortfolio);
    if (balancedResult.success && balancedResult.data) {
      await this.addAssetsToPortfolio(balancedResult.data.id, assets, 'balanced');
    }

    // 成长型投资组合
    const growthPortfolio = {
      name: '成长动力组合',
      description: '以成长股为主的高风险高收益投资组合，适合年轻投资者',
      risk_level: 'high' as const,
      investment_goal: '追求长期资本大幅增值，承受较高波动',
      time_horizon: '10年以上',
      rebalance_threshold: 10,
      target_allocation: [
        { asset_type: '股票', target_percentage: 70, target_value: 140000 },
        { asset_type: '基金', target_percentage: 20, target_value: 40000 },
        { asset_type: '债券', target_percentage: 8, target_value: 16000 },
        { asset_type: '现金', target_percentage: 2, target_value: 4000 }
      ]
    };

    const growthResult = await this.portfolioService.createPortfolio('user-1', growthPortfolio);
    if (growthResult.success && growthResult.data) {
      await this.addAssetsToPortfolio(growthResult.data.id, assets, 'growth');
    }
  }

  private async addAssetsToPortfolio(portfolioId: string, assets: Asset[], type: 'conservative' | 'balanced' | 'growth'): Promise<void> {
    const stockAssets = assets.filter(a => a.asset_type === 'stock');
    const bondAssets = assets.filter(a => a.asset_type === 'bond');
    const fundAssets = assets.filter(a => a.asset_type === 'fund');

    switch (type) {
      case 'conservative':
        // 添加债券资产
        if (bondAssets.length > 0) {
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: bondAssets[0].id,
            quantity: 1000,
            current_price: 100,
            target_percentage: 60
          });
        }
        
        // 添加蓝筹股
        if (stockAssets.length > 0) {
          const blueChip = stockAssets.find(a => a.name.includes('银行') || a.name.includes('电力')) || stockAssets[0];
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: blueChip.id,
            quantity: 500,
            current_price: 60,
            target_percentage: 30
          });
        }
        break;

      case 'balanced':
        // 添加多样化股票
        if (stockAssets.length >= 2) {
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: stockAssets[0].id,
            quantity: 800,
            current_price: 75,
            target_percentage: 30
          });
          
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: stockAssets[1].id,
            quantity: 600,
            current_price: 50,
            target_percentage: 20
          });
        }
        
        // 添加债券
        if (bondAssets.length > 0) {
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: bondAssets[0].id,
            quantity: 500,
            current_price: 105,
            target_percentage: 35
          });
        }
        
        // 添加基金
        if (fundAssets.length > 0) {
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: fundAssets[0].id,
            quantity: 1000,
            current_price: 15,
            target_percentage: 10
          });
        }
        break;

      case 'growth':
        // 添加成长股
        const growthStocks = stockAssets.filter(a => 
          a.type === 'stock' && (a.name.includes('科技') || a.name.includes('新能源') || a.name.includes('医药'))
        );
        
        if (growthStocks.length >= 3) {
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: growthStocks[0].id,
            quantity: 1000,
            current_price: 80,
            target_percentage: 40
          });
          
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: growthStocks[1].id,
            quantity: 800,
            current_price: 45,
            target_percentage: 20
          });
          
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: growthStocks[2].id,
            quantity: 600,
            current_price: 25,
            target_percentage: 10
          });
        } else if (stockAssets.length >= 3) {
          // 如果没有足够的成长股，使用普通股票
          for (let i = 0; i < Math.min(3, stockAssets.length); i++) {
            await this.portfolioService.addAssetToPortfolio(portfolioId, {
              asset_id: stockAssets[i].id,
              quantity: 800 - i * 100,
              current_price: 60 + i * 10,
              target_percentage: [40, 20, 10][i]
            });
          }
        }
        
        // 添加基金
        if (fundAssets.length > 0) {
          await this.portfolioService.addAssetToPortfolio(portfolioId, {
            asset_id: fundAssets[0].id,
            quantity: 2000,
            current_price: 20,
            target_percentage: 20
          });
        }
        break;
    }
  }

  async clearAllPortfolios(): Promise<void> {
    try {
      const portfolios = await this.portfolioService.getUserPortfolios('user-1');
      for (const portfolio of portfolios) {
        await this.portfolioService.deletePortfolio(portfolio.id);
      }
      console.log('✅ 所有投资组合数据已清除');
    } catch (error) {
      console.error('❌ 清除投资组合数据失败:', error);
    }
  }
}

// 导出初始化函数
export const initializePortfolioData = async () => {
  const init = new PortfolioDataInit();
  await init.initializeSampleData();
};

export const clearPortfolioData = async () => {
  const init = new PortfolioDataInit();
  await init.clearAllPortfolios();
};