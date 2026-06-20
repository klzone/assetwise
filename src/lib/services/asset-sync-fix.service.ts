/**
 * 资产同步修复服务
 * 专门解决资产删除/卖出操作的同步问题
 */

import { createClient } from '@supabase/supabase-js';
import { assetStorage } from '../asset-storage';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class AssetSyncFixService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /**
   * 强制同步本地资产状态到云端
   * 解决删除/卖出操作未同步的问题
   */
  async forceSyncAssetState(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔄 开始强制同步资产状态...');

      // 获取当前用户
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, message: '用户未登录' };
      }

      // 获取本地活跃资产（已过滤删除的资产）
      const localActiveAssets = assetStorage.getLocalAssets();
      console.log('📱 本地活跃资产:', localActiveAssets.length, '个');

      // 获取云端所有资产
      const { data: cloudAssets, error: cloudError } = await this.supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id);

      if (cloudError) {
        return { success: false, message: `获取云端数据失败: ${cloudError.message}` };
      }

      console.log('☁️ 云端资产:', cloudAssets?.length || 0, '个');

      // 创建本地资产ID集合
      const localAssetIds = new Set(localActiveAssets.map(asset => asset.id));
      
      // 找出需要删除的云端资产（云端存在但本地不存在的）
      const assetsToDelete = cloudAssets?.filter(cloudAsset => 
        !localAssetIds.has(cloudAsset.id)
      ) || [];

      console.log('🗑️ 需要从云端删除的资产:', assetsToDelete.length, '个');

      // 删除云端多余的资产
      let deletedCount = 0;
      for (const assetToDelete of assetsToDelete) {
        try {
          const { error: deleteError } = await this.supabase
            .from('assets')
            .delete()
            .eq('id', assetToDelete.id)
            .eq('user_id', user.id);

          if (deleteError) {
            console.error(`删除云端资产失败 ${assetToDelete.name}:`, deleteError);
          } else {
            deletedCount++;
            console.log(`✅ 已删除云端资产: ${assetToDelete.name}`);
          }
        } catch (error) {
          console.error(`删除云端资产异常 ${assetToDelete.name}:`, error);
        }
      }

      // 同步本地活跃资产到云端
      let syncedCount = 0;
      for (const localAsset of localActiveAssets) {
        try {
          const assetData = this.convertLocalAssetToCloudFormat(localAsset, user.id);
          
          const { error: upsertError } = await this.supabase
            .from('assets')
            .upsert([assetData], { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (upsertError) {
            console.error(`同步资产失败 ${localAsset.name}:`, upsertError);
          } else {
            syncedCount++;
            console.log(`✅ 已同步资产: ${localAsset.name}`);
          }
        } catch (error) {
          console.error(`同步资产异常 ${localAsset.name}:`, error);
        }
      }

      const result = {
        success: true,
        message: `同步完成: 删除${deletedCount}个云端资产，同步${syncedCount}个本地资产`,
        details: {
          localAssets: localActiveAssets.length,
          cloudAssets: cloudAssets?.length || 0,
          deleted: deletedCount,
          synced: syncedCount,
          assetsToDelete: assetsToDelete.map(a => ({ id: a.id, name: a.name }))
        }
      };

      console.log('🎉 强制同步完成:', result);
      return result;

    } catch (error) {
      console.error('❌ 强制同步失败:', error);
      return { 
        success: false, 
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 转换本地资产格式到云端格式
   */
  private convertLocalAssetToCloudFormat(localAsset: any, userId: string): any {
    // 映射资产类型
    const mapCategoryToType = (category: string): string => {
      const typeMap: { [key: string]: string } = {
        '股票': 'stock', '科技股': 'stock', '金融股': 'stock', '消费股': 'stock',
        '虚拟货币': 'crypto', '比特币': 'crypto', '以太坊': 'crypto',
        '基金': 'fund', '债券': 'bond', '大宗商品': 'commodity'
      };
      return typeMap[category] || 'stock';
    };

    return {
      id: localAsset.id,
      user_id: userId,
      name: localAsset.name || '',
      symbol: localAsset.symbol || '',
      type: mapCategoryToType(localAsset.category),
      current_price: localAsset.currentPrice || 0,
      average_cost: localAsset.purchasePrice || 0,
      quantity: localAsset.quantity || 0,
      total_value: localAsset.totalValue || 0,
      profit_loss: localAsset.profitLoss || 0,
      profit_loss_percentage: localAsset.profitLossPercent || 0,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 验证同步结果
   */
  async validateSyncResult(): Promise<{ success: boolean; message: string; comparison?: any }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, message: '用户未登录' };
      }

      const localAssets = assetStorage.getLocalAssets();
      const { data: cloudAssets } = await this.supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id);

      const comparison = {
        local: {
          count: localAssets.length,
          assets: localAssets.map(a => ({ id: a.id, name: a.name, symbol: a.symbol }))
        },
        cloud: {
          count: cloudAssets?.length || 0,
          assets: cloudAssets?.map(a => ({ id: a.id, name: a.name, symbol: a.symbol })) || []
        },
        isConsistent: localAssets.length === (cloudAssets?.length || 0)
      };

      return {
        success: true,
        message: comparison.isConsistent ? '数据一致' : '数据不一致',
        comparison
      };

    } catch (error) {
      return { 
        success: false, 
        message: `验证失败: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  /**
   * 清理本地已删除资产的标记
   */
  cleanupLocalDeletedAssets(): void {
    try {
      const allAssets = assetStorage.getAllAssets();
      const activeAssets = allAssets.filter(asset => !asset.isDeleted);
      
      console.log(`清理前: ${allAssets.length} 个资产（包含已删除）`);
      console.log(`清理后: ${activeAssets.length} 个活跃资产`);
      
      assetStorage.saveLocalAssets(activeAssets);
      console.log('✅ 本地已删除资产清理完成');
    } catch (error) {
      console.error('❌ 清理本地已删除资产失败:', error);
    }
  }
}

export const assetSyncFixService = new AssetSyncFixService();