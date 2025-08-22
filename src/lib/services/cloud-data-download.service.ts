import { getSupabaseBrowserClient } from '../supabase/client';

const supabase = getSupabaseBrowserClient();

export interface DownloadItem {
  id: string;
  name: string;
  type: 'assets' | 'transactions' | 'plans' | 'reviews' | 'settings';
  size: number;
  count: number;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'skipped';
  progress: number;
  error?: string;
  lastUpdated?: string;
}

export interface DownloadProgress {
  itemId: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'skipped';
  progress: number;
  error?: string;
}

export interface DownloadStats {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  totalSize: number;
  downloadedSize: number;
  startTime: Date | null;
  estimatedTime: number;
  speed: number;
}

class CloudDataDownloadService {
  private progressCallbacks: ((progress: DownloadProgress) => void)[] = [];
  private isDownloading = false;
  private downloadCancelled = false;

  // 订阅进度更新
  onProgress(callback: (progress: DownloadProgress) => void) {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  // 触发进度更新
  private notifyProgress(progress: DownloadProgress) {
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  // 获取可下载的数据项
  async getAvailableItems(): Promise<DownloadItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const items: DownloadItem[] = [];

      // 检查资产数据
      const { count: assetsCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (assetsCount && assetsCount > 0) {
        items.push({
          id: 'assets',
          name: '资产数据',
          type: 'assets',
          size: assetsCount * 1024, // 估算大小
          count: assetsCount,
          status: 'pending',
          progress: 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // 检查交易记录
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (transactionsCount && transactionsCount > 0) {
        items.push({
          id: 'transactions',
          name: '交易记录',
          type: 'transactions',
          size: transactionsCount * 2048, // 估算大小
          count: transactionsCount,
          status: 'pending',
          progress: 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // 检查投资计划
      const { count: plansCount } = await supabase
        .from('investment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (plansCount && plansCount > 0) {
        items.push({
          id: 'plans',
          name: '投资计划',
          type: 'plans',
          size: plansCount * 1536, // 估算大小
          count: plansCount,
          status: 'pending',
          progress: 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // 检查评估报告
      const { count: reviewsCount } = await supabase
        .from('asset_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (reviewsCount && reviewsCount > 0) {
        items.push({
          id: 'reviews',
          name: '评估报告',
          type: 'reviews',
          size: reviewsCount * 3072, // 估算大小
          count: reviewsCount,
          status: 'pending',
          progress: 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // 用户设置
      items.push({
        id: 'settings',
        name: '用户设置',
        type: 'settings',
        size: 512, // 估算大小
        count: 1,
        status: 'pending',
        progress: 0,
        lastUpdated: new Date().toISOString()
      });

      return items;
    } catch (error) {
      console.error('获取可下载项目失败:', error);
      throw error;
    }
  }

  // 下载资产数据
  private async downloadAssets(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const assets = data?.map((item: any) => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString()
    })) || [];

    return assets;
  }

  // 下载交易记录
  private async downloadTransactions(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const transactions = data?.map((item: any) => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString()
    })) || [];

    return transactions;
  }

  // 下载投资计划
  private async downloadPlans(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const plans = data?.map((item: any) => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString()
    })) || [];

    return plans;
  }

  // 下载评估报告
  private async downloadReviews(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('asset_reviews')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const reviews = data?.map((item: any) => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString()
    })) || [];

    return reviews;
  }

  // 下载用户设置
  private async downloadSettings(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const settings = {
      user_id: user.id,
      email: user.email || '',
      downloaded_at: new Date().toISOString(),
      preferences: {}
    };

    return settings;
  }

  // 下载单个数据项
  async downloadItem(itemId: string): Promise<void> {
    try {
      this.notifyProgress({ itemId, status: 'downloading', progress: 0 });

      let data: any;
      switch (itemId) {
        case 'assets':
          data = await this.downloadAssets();
          break;
        case 'transactions':
          data = await this.downloadTransactions();
          break;
        case 'plans':
          data = await this.downloadPlans();
          break;
        case 'reviews':
          data = await this.downloadReviews();
          break;
        case 'settings':
          data = await this.downloadSettings();
          break;
        default:
          throw new Error(`未知的数据类型: ${itemId}`);
      }

      // 模拟下载进度
      for (let i = 0; i <= 100; i += 20) {
        this.notifyProgress({ itemId, status: 'downloading', progress: i });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 保存到本地存储
      this.saveToLocalStorage(itemId, data);

      this.notifyProgress({ itemId, status: 'completed', progress: 100 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '下载失败';
      this.notifyProgress({ 
        itemId, 
        status: 'error', 
        progress: 0, 
        error: errorMessage 
      });
      throw error;
    }
  }

  // 下载所有数据项
  async downloadAll(items: DownloadItem[]): Promise<void> {
    if (this.isDownloading) {
      throw new Error('下载正在进行中');
    }

    this.isDownloading = true;
    this.downloadCancelled = false;

    try {
      for (const item of items) {
        if (this.downloadCancelled) {
          console.log('下载已取消，停止处理剩余项目');
          break;
        }
        
        if (item.status === 'pending') {
          try {
            await this.downloadItem(item.id);
          } catch (error) {
            console.error(`下载项目 ${item.id} 失败:`, error);
            // 继续下载其他项目，不中断整个过程
            if (this.downloadCancelled) {
              break;
            }
          }
        }
      }
    } finally {
      this.isDownloading = false;
      this.downloadCancelled = false;
    }
  }

  // 保存数据到本地存储
  private saveToLocalStorage(key: string, data: any): void {
    try {
      if (key === 'assets') {
        // 对于资产数据，需要集成到现有的资产管理系统
        this.integrateAssetsData(data);
      } else {
        // 其他数据类型保存到独立的存储空间
        const storageData = {
          data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        localStorage.setItem(`assetwise_${key}`, JSON.stringify(storageData));
      }
    } catch (error) {
      console.error('保存到本地存储失败:', error);
      throw new Error('保存数据失败');
    }
  }

  // 集成资产数据到现有系统
  private integrateAssetsData(cloudAssets: any[]): void {
    try {
      // 导入资产存储服务
      const { assetStorage } = require('@/lib/asset-storage');
      
      // 获取当前本地资产
      const localAssets = assetStorage.getLocalAssets();
      
      // 转换云端资产数据格式
      const convertedAssets = cloudAssets.map((cloudAsset: any) => ({
        id: cloudAsset.id || `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: cloudAsset.name || cloudAsset.asset_name || '未知资产',
        symbol: cloudAsset.symbol || cloudAsset.asset_symbol || '',
        logo: cloudAsset.logo || '',
        category: cloudAsset.category || cloudAsset.asset_type || '其他',
        currentPrice: parseFloat(cloudAsset.current_price || cloudAsset.price || 0),
        purchasePrice: parseFloat(cloudAsset.purchase_price || cloudAsset.cost_price || 0),
        quantity: parseFloat(cloudAsset.quantity || cloudAsset.amount || 0),
        totalValue: parseFloat(cloudAsset.total_value || 0),
        totalCost: parseFloat(cloudAsset.total_cost || 0),
        profitLoss: parseFloat(cloudAsset.profit_loss || 0),
        profitLossPercent: parseFloat(cloudAsset.profit_loss_percent || 0),
        dayChange: parseFloat(cloudAsset.day_change || 0),
        dayChangePercent: parseFloat(cloudAsset.day_change_percent || 0),
        allocation: parseFloat(cloudAsset.allocation || 0),
        lastUpdated: cloudAsset.updated_at || cloudAsset.last_updated || new Date().toLocaleString('zh-CN'),
        riskLevel: cloudAsset.risk_level || 'medium'
      }));

      // 合并资产数据（避免重复）
      const mergedAssets = [...localAssets];
      
      convertedAssets.forEach(cloudAsset => {
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

      // 保存合并后的资产数据
      assetStorage.saveLocalAssets(mergedAssets);
      
      console.log(`成功集成 ${convertedAssets.length} 项云端资产数据`);
    } catch (error) {
      console.error('集成资产数据失败:', error);
      throw error;
    }
  }

  // 从本地存储获取数据
  getFromLocalStorage(key: string): any {
    try {
      const stored = localStorage.getItem(`assetwise_${key}`);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return parsed;
    } catch (error) {
      console.error('从本地存储读取失败:', error);
      return null;
    }
  }

  // 清除本地存储的数据
  clearLocalStorage(key?: string): void {
    if (key) {
      localStorage.removeItem(`assetwise_${key}`);
    } else {
      // 清除所有 AssetWise 相关数据
      const keys = Object.keys(localStorage).filter(k => k.startsWith('assetwise_'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  }

  // 检查是否正在下载
  isDownloadInProgress(): boolean {
    return this.isDownloading;
  }

  // 取消下载
  cancelDownload(): void {
    this.downloadCancelled = true;
    this.isDownloading = false;
  }
}

export const cloudDataDownloadService = new CloudDataDownloadService();