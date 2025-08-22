import { assetStorage } from './asset-storage';
import { cloudDataDownloadService } from './services/cloud-data-download.service';

/**
 * 数据同步助手 - 帮助协调云端下载和本地数据管理
 */
export class DataSyncHelper {
  private static instance: DataSyncHelper;

  static getInstance(): DataSyncHelper {
    if (!DataSyncHelper.instance) {
      DataSyncHelper.instance = new DataSyncHelper();
    }
    return DataSyncHelper.instance;
  }

  /**
   * 检查是否有新下载的云端数据需要加载
   */
  checkForNewCloudData(): boolean {
    try {
      // 检查云端下载的资产数据
      const cloudAssets = cloudDataDownloadService.getFromLocalStorage('assets');
      if (cloudAssets && cloudAssets.data && cloudAssets.data.length > 0) {
        return true;
      }

      // 检查其他类型的云端数据
      const dataTypes = ['transactions', 'plans', 'reviews', 'settings'];
      for (const type of dataTypes) {
        const data = cloudDataDownloadService.getFromLocalStorage(type);
        if (data && data.data) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('检查云端数据失败:', error);
      return false;
    }
  }

  /**
   * 加载云端下载的数据到应用中
   */
  async loadCloudDataToApp(): Promise<{
    success: boolean;
    assetsLoaded: number;
    message: string;
  }> {
    try {
      let assetsLoaded = 0;
      let totalDataLoaded = 0;

      // 加载资产数据
      const cloudAssets = cloudDataDownloadService.getFromLocalStorage('assets');
      if (cloudAssets && cloudAssets.data && cloudAssets.data.length > 0) {
        // 获取当前本地资产
        const localAssets = assetStorage.getLocalAssets();
        
        // 转换并合并云端资产数据
        const convertedAssets = cloudAssets.data.map((cloudAsset: any) => {
          // 获取基本价格和数量信息
          const currentPrice = parseFloat(cloudAsset.current_price || cloudAsset.price || 0);
          const purchasePrice = parseFloat(cloudAsset.purchase_price || cloudAsset.cost_price || 0);
          const quantity = parseFloat(cloudAsset.quantity || cloudAsset.amount || 0);
          
          // 计算总价值和总成本
          const totalValue = cloudAsset.total_value ? parseFloat(cloudAsset.total_value) : currentPrice * quantity;
          const totalCost = cloudAsset.total_cost ? parseFloat(cloudAsset.total_cost) : purchasePrice * quantity;
          
          // 计算盈亏和盈亏百分比
          const profitLoss = totalValue - totalCost;
          const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
          
          return {
            id: cloudAsset.id || `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: cloudAsset.name || cloudAsset.asset_name || '未知资产',
            symbol: cloudAsset.symbol || cloudAsset.asset_symbol || '',
            logo: cloudAsset.logo || '',
            category: cloudAsset.category || cloudAsset.asset_type || '其他',
            currentPrice,
            purchasePrice,
            quantity,
            totalValue,
            totalCost,
            profitLoss,
            profitLossPercent,
            dayChange: parseFloat(cloudAsset.day_change || 0),
            dayChangePercent: parseFloat(cloudAsset.day_change_percent || 0),
            allocation: parseFloat(cloudAsset.allocation || 0),
            lastUpdated: cloudAsset.updated_at || cloudAsset.last_updated || new Date().toLocaleString('zh-CN'),
            riskLevel: cloudAsset.risk_level || 'medium'
          };
        });

        // 合并资产数据（避免重复）
        const mergedAssets = [...localAssets];
        
        convertedAssets.forEach((cloudAsset: any) => {
          const existingIndex = mergedAssets.findIndex(local => 
            local.symbol === cloudAsset.symbol || local.name === cloudAsset.name
          );
          
          if (existingIndex >= 0) {
            // 更新现有资产（使用云端数据）
            mergedAssets[existingIndex] = {
              ...mergedAssets[existingIndex],
              ...cloudAsset,
              id: mergedAssets[existingIndex].id // 保持本地ID
            };
          } else {
            // 添加新资产
            mergedAssets.push(cloudAsset);
          }
        });
        
        // 重新计算所有资产的配置占比
        const totalPortfolioValue = mergedAssets.reduce((sum, asset) => sum + asset.totalValue, 0);
        if (totalPortfolioValue > 0) {
          mergedAssets.forEach(asset => {
            asset.allocation = (asset.totalValue / totalPortfolioValue) * 100;
          });
        }

        // 保存合并后的资产数据
        assetStorage.saveLocalAssets(mergedAssets);
        assetsLoaded = convertedAssets.length;
        totalDataLoaded++;

        // 清除已处理的云端数据
        cloudDataDownloadService.clearLocalStorage('assets');
      }

      // 处理其他类型的数据（交易记录、投资计划等）
      const dataTypes = ['transactions', 'plans', 'reviews', 'settings'];
      for (const type of dataTypes) {
        const data = cloudDataDownloadService.getFromLocalStorage(type);
        if (data && data.data) {
          // 这里可以根据需要处理其他类型的数据
          console.log(`发现 ${type} 数据:`, data.data);
          totalDataLoaded++;
          
          // 清除已处理的数据
          cloudDataDownloadService.clearLocalStorage(type);
        }
      }

      if (totalDataLoaded > 0) {
        return {
          success: true,
          assetsLoaded,
          message: `成功加载 ${assetsLoaded} 项资产数据和 ${totalDataLoaded - 1} 项其他数据`
        };
      } else {
        return {
          success: false,
          assetsLoaded: 0,
          message: '没有发现需要加载的云端数据'
        };
      }
    } catch (error) {
      console.error('加载云端数据失败:', error);
      return {
        success: false,
        assetsLoaded: 0,
        message: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 强制刷新应用数据（从云端重新同步）
   */
  async forceRefreshFromCloud(): Promise<{
    success: boolean;
    assetsCount: number;
    message: string;
  }> {
    try {
      const assets = await assetStorage.syncFromCloud();
      
      return {
        success: true,
        assetsCount: assets.length,
        message: `成功从云端同步 ${assets.length} 项资产数据`
      };
    } catch (error) {
      console.error('强制刷新失败:', error);
      return {
        success: false,
        assetsCount: 0,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 清理所有云端下载的临时数据
   */
  clearAllCloudData(): void {
    try {
      cloudDataDownloadService.clearLocalStorage();
      console.log('已清理所有云端下载的临时数据');
    } catch (error) {
      console.error('清理云端数据失败:', error);
    }
  }
}

export const dataSyncHelper = DataSyncHelper.getInstance();