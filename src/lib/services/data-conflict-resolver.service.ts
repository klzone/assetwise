/**
 * 数据冲突解决服务
 * 处理本地数据与云端数据之间的冲突
 */

export interface ConflictItem {
  id: string;
  type: 'account' | 'transaction' | 'review' | 'asset' | 'plan';
  localData: any;
  cloudData: any;
  localUpdatedAt: string;
  cloudUpdatedAt: string;
}

export interface ConflictResolution {
  action: 'use_local' | 'use_cloud' | 'merge' | 'skip';
  mergedData?: any;
}

export class DataConflictResolverService {
  
  /**
   * 检测数据冲突
   */
  detectConflicts(localData: any[], cloudData: any[], dataType: string): ConflictItem[] {
    const conflicts: ConflictItem[] = [];
    
    // 创建云端数据的映射表
    const cloudDataMap = new Map();
    cloudData.forEach(item => {
      cloudDataMap.set(item.id, item);
    });
    
    // 检查本地数据与云端数据的冲突
    localData.forEach(localItem => {
      const cloudItem = cloudDataMap.get(localItem.id);
      
      if (cloudItem) {
        const localUpdated = new Date(localItem.updated_at || localItem.created_at);
        const cloudUpdated = new Date(cloudItem.updated_at || cloudItem.created_at);
        
        // 如果更新时间不同，可能存在冲突
        if (Math.abs(localUpdated.getTime() - cloudUpdated.getTime()) > 1000) { // 1秒容差
          // 检查数据内容是否真的不同
          if (this.hasDataDifferences(localItem, cloudItem)) {
            conflicts.push({
              id: localItem.id,
              type: dataType as any,
              localData: localItem,
              cloudData: cloudItem,
              localUpdatedAt: localItem.updated_at || localItem.created_at,
              cloudUpdatedAt: cloudItem.updated_at || cloudItem.created_at
            });
          }
        }
      }
    });
    
    return conflicts;
  }
  
  /**
   * 检查两个数据对象是否有实质性差异
   */
  private hasDataDifferences(local: any, cloud: any): boolean {
    // 忽略的字段（时间戳等）
    const ignoredFields = ['created_at', 'updated_at', 'last_updated'];
    
    const localKeys = Object.keys(local).filter(key => !ignoredFields.includes(key));
    const cloudKeys = Object.keys(cloud).filter(key => !ignoredFields.includes(key));
    
    // 检查字段数量
    if (localKeys.length !== cloudKeys.length) {
      return true;
    }
    
    // 检查每个字段的值
    for (const key of localKeys) {
      if (local[key] !== cloud[key]) {
        // 对于数字类型，进行精度比较
        if (typeof local[key] === 'number' && typeof cloud[key] === 'number') {
          if (Math.abs(local[key] - cloud[key]) > 0.0001) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 自动解决冲突
   * 策略：优先使用最新的数据
   */
  autoResolveConflicts(conflicts: ConflictItem[]): Map<string, ConflictResolution> {
    const resolutions = new Map<string, ConflictResolution>();
    
    conflicts.forEach(conflict => {
      const localTime = new Date(conflict.localUpdatedAt).getTime();
      const cloudTime = new Date(conflict.cloudUpdatedAt).getTime();
      
      if (localTime > cloudTime) {
        // 本地数据更新
        resolutions.set(conflict.id, { action: 'use_local' });
      } else if (cloudTime > localTime) {
        // 云端数据更新
        resolutions.set(conflict.id, { action: 'use_cloud' });
      } else {
        // 时间相同，尝试合并
        const mergedData = this.mergeData(conflict.localData, conflict.cloudData);
        resolutions.set(conflict.id, { 
          action: 'merge', 
          mergedData 
        });
      }
    });
    
    return resolutions;
  }
  
  /**
   * 合并两个数据对象
   */
  private mergeData(localData: any, cloudData: any): any {
    const merged = { ...cloudData }; // 以云端数据为基础
    
    // 合并策略：
    // 1. 数字字段：使用较大的值
    // 2. 字符串字段：使用非空且更长的值
    // 3. 布尔字段：使用本地值（用户最后的操作）
    // 4. 数组字段：合并去重
    
    Object.keys(localData).forEach(key => {
      const localValue = localData[key];
      const cloudValue = cloudData[key];
      
      if (localValue !== undefined && localValue !== null) {
        if (typeof localValue === 'number' && typeof cloudValue === 'number') {
          merged[key] = Math.max(localValue, cloudValue);
        } else if (typeof localValue === 'string' && typeof cloudValue === 'string') {
          merged[key] = localValue.length > cloudValue.length ? localValue : cloudValue;
        } else if (typeof localValue === 'boolean') {
          merged[key] = localValue; // 优先使用本地布尔值
        } else if (Array.isArray(localValue) && Array.isArray(cloudValue)) {
          merged[key] = [...new Set([...cloudValue, ...localValue])]; // 合并数组并去重
        } else {
          merged[key] = localValue; // 其他情况使用本地值
        }
      }
    });
    
    // 更新时间戳
    merged.updated_at = new Date().toISOString();
    
    return merged;
  }
  
  /**
   * 应用冲突解决方案
   */
  applyResolutions(
    conflicts: ConflictItem[], 
    resolutions: Map<string, ConflictResolution>
  ): {
    localUpdates: any[];
    cloudUpdates: any[];
  } {
    const localUpdates: any[] = [];
    const cloudUpdates: any[] = [];
    
    conflicts.forEach(conflict => {
      const resolution = resolutions.get(conflict.id);
      if (!resolution) return;
      
      switch (resolution.action) {
        case 'use_local':
          // 将本地数据推送到云端
          cloudUpdates.push({
            operation: `update${this.capitalizeFirst(conflict.type)}`,
            data: {
              id: conflict.id,
              updates: conflict.localData
            }
          });
          break;
          
        case 'use_cloud':
          // 将云端数据更新到本地
          localUpdates.push({
            type: conflict.type,
            data: conflict.cloudData
          });
          break;
          
        case 'merge':
          // 将合并后的数据同时更新到本地和云端
          if (resolution.mergedData) {
            localUpdates.push({
              type: conflict.type,
              data: resolution.mergedData
            });
            cloudUpdates.push({
              operation: `update${this.capitalizeFirst(conflict.type)}`,
              data: {
                id: conflict.id,
                updates: resolution.mergedData
              }
            });
          }
          break;
          
        case 'skip':
          // 跳过，不做任何操作
          break;
      }
    });
    
    return { localUpdates, cloudUpdates };
  }
  
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const dataConflictResolverService = new DataConflictResolverService();
