import { indexedDBService } from './indexeddb.service';
import { conflictResolverService, DataConflict } from './conflict-resolver.service';

// 增量同步记录
interface SyncRecord {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  user_id: string;
  synced: boolean;
  retry_count: number;
  last_error?: string;
}

// 同步检查点
interface SyncCheckpoint {
  user_id: string;
  table_name: string;
  last_sync_timestamp: string;
  last_sync_id: string;
  total_records: number;
  synced_records: number;
}

// 增量同步结果
interface IncrementalSyncResult {
  success: boolean;
  processed: number;
  conflicts: number;
  errors: string[];
  checkpoint: SyncCheckpoint;
  conflictDetails: DataConflict[];
}

class IncrementalSyncService {
  private readonly SYNC_BATCH_SIZE = 50;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5分钟

  // 执行增量同步
  async performIncrementalSync(userId: string, tableName: string): Promise<IncrementalSyncResult> {
    const result: IncrementalSyncResult = {
      success: true,
      processed: 0,
      conflicts: 0,
      errors: [],
      checkpoint: await this.getCheckpoint(userId, tableName),
      conflictDetails: []
    };

    try {
      console.log(`🔄 开始增量同步: ${tableName} for user ${userId}`);

      // 1. 获取本地变更
      const localChanges = await this.getLocalChanges(userId, tableName, result.checkpoint);
      
      // 2. 获取服务器变更
      const serverChanges = await this.getServerChanges(userId, tableName, result.checkpoint);

      // 3. 处理服务器变更到本地
      const serverResult = await this.applyServerChanges(serverChanges);
      result.processed += serverResult.processed;
      result.conflicts += serverResult.conflicts;
      result.conflictDetails.push(...serverResult.conflictDetails);
      result.errors.push(...serverResult.errors);

      // 4. 上传本地变更到服务器
      const clientResult = await this.uploadLocalChanges(localChanges);
      result.processed += clientResult.processed;
      result.errors.push(...clientResult.errors);

      // 5. 更新检查点
      if (result.errors.length === 0) {
        result.checkpoint = await this.updateCheckpoint(userId, tableName, {
          last_sync_timestamp: new Date().toISOString(),
          total_records: result.processed,
          synced_records: result.processed - result.conflicts
        });
      }

      console.log(`✅ 增量同步完成: ${tableName}, 处理 ${result.processed} 条记录, ${result.conflicts} 个冲突`);

    } catch (error) {
      console.error(`❌ 增量同步失败: ${tableName}`, error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '未知错误');
    }

    return result;
  }

  // 获取本地变更
  private async getLocalChanges(
    userId: string, 
    tableName: string, 
    checkpoint: SyncCheckpoint
  ): Promise<SyncRecord[]> {
    try {
      // 获取自上次同步以来的本地变更
      const changes: SyncRecord[] = [];
      
      // 从离线队列获取未同步的操作
      const queueItems = await indexedDBService.getOfflineQueue();
      const tableQueue = queueItems.filter(item => 
        item.table_name === tableName && 
        new Date(item.timestamp) > new Date(checkpoint.last_sync_timestamp)
      );

      for (const item of tableQueue) {
        changes.push({
          id: item.id,
          table_name: item.table_name,
          record_id: item.data.id,
          operation: item.operation,
          data: item.data,
          timestamp: item.timestamp,
          user_id: userId,
          synced: false,
          retry_count: item.retry_count
        });
      }

      // 获取本地数据库中未同步的记录
      const unsyncedData = await indexedDBService.getUnsyncedData(tableName as any);
      for (const record of unsyncedData) {
        if (new Date(record.last_modified || record.updated_at || 0) > new Date(checkpoint.last_sync_timestamp)) {
          changes.push({
            id: `local_${record.id}_${Date.now()}`,
            table_name: tableName,
            record_id: record.id,
            operation: 'update',
            data: record,
            timestamp: record.last_modified || record.updated_at || new Date().toISOString(),
            user_id: userId,
            synced: false,
            retry_count: 0
          });
        }
      }

      return changes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('获取本地变更失败:', error);
      return [];
    }
  }

  // 获取服务器变更（模拟实现）
  private async getServerChanges(
    userId: string, 
    tableName: string, 
    checkpoint: SyncCheckpoint
  ): Promise<SyncRecord[]> {
    try {
      // TODO: 实现实际的服务器API调用
      // 这里应该调用服务器API获取自上次同步以来的变更
      
      // 模拟服务器变更
      const serverChanges: SyncRecord[] = [];
      
      // 实际实现中，这里会调用类似以下的API：
      // const response = await fetch(`/api/sync/${tableName}?since=${checkpoint.last_sync_timestamp}&user_id=${userId}`);
      // const changes = await response.json();
      
      return serverChanges;
    } catch (error) {
      console.error('获取服务器变更失败:', error);
      return [];
    }
  }

  // 应用服务器变更到本地
  private async applyServerChanges(serverChanges: SyncRecord[]): Promise<{
    processed: number;
    conflicts: number;
    errors: string[];
    conflictDetails: DataConflict[];
  }> {
    const result = {
      processed: 0,
      conflicts: 0,
      errors: [],
      conflictDetails: [] as DataConflict[]
    };

    for (const change of serverChanges) {
      try {
        const { table_name, record_id, operation, data } = change;

        switch (operation) {
          case 'create':
            await this.handleServerCreate(table_name, data);
            break;

          case 'update':
            const updateResult = await this.handleServerUpdate(table_name, record_id, data);
            if (updateResult.conflicts.length > 0) {
              result.conflicts += updateResult.conflicts.length;
              result.conflictDetails.push(...updateResult.conflicts);
            }
            break;

          case 'delete':
            await this.handleServerDelete(table_name, record_id);
            break;
        }

        result.processed++;
      } catch (error) {
        console.error('应用服务器变更失败:', change, error);
        result.errors.push(`应用变更失败: ${error}`);
      }
    }

    return result;
  }

  // 处理服务器创建操作
  private async handleServerCreate(tableName: string, serverData: any): Promise<void> {
    try {
      // 检查本地是否已存在
      const existingData = await indexedDBService.read(tableName as any, serverData.id);
      
      if (existingData) {
        // 如果本地已存在，按更新处理
        await this.handleServerUpdate(tableName, serverData.id, serverData);
      } else {
        // 创建新记录
        await indexedDBService.create(tableName as any, {
          ...serverData,
          synced: true,
          last_modified: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('处理服务器创建操作失败:', error);
      throw error;
    }
  }

  // 处理服务器更新操作
  private async handleServerUpdate(tableName: string, recordId: string, serverData: any): Promise<{
    conflicts: DataConflict[];
  }> {
    try {
      const localData = await indexedDBService.read(tableName as any, recordId);
      
      if (!localData) {
        // 本地不存在，直接创建
        await indexedDBService.create(tableName as any, {
          ...serverData,
          synced: true,
          last_modified: new Date().toISOString()
        });
        return { conflicts: [] };
      }

      // 检测冲突
      const conflicts = conflictResolverService.detectConflicts(tableName, localData, serverData);
      
      if (conflicts.length === 0) {
        // 无冲突，直接更新
        await indexedDBService.update(tableName as any, {
          ...serverData,
          synced: true,
          last_modified: new Date().toISOString()
        });
        return { conflicts: [] };
      }

      // 解决冲突
      const { resolvedData, manualConflicts } = conflictResolverService.resolveConflicts(
        tableName, 
        localData, 
        serverData
      );

      // 更新解决后的数据
      await indexedDBService.update(tableName as any, resolvedData);

      // 如果有需要手动解决的冲突，记录到冲突表
      if (manualConflicts.length > 0) {
        await this.recordManualConflicts(manualConflicts);
      }

      return { conflicts };
    } catch (error) {
      console.error('处理服务器更新操作失败:', error);
      throw error;
    }
  }

  // 处理服务器删除操作
  private async handleServerDelete(tableName: string, recordId: string): Promise<void> {
    try {
      const localData = await indexedDBService.read(tableName as any, recordId);
      
      if (localData) {
        // 检查本地是否有未同步的修改
        if (!(localData as any).synced) {
          // 有未同步的修改，创建删除冲突
          const conflict: DataConflict = {
            id: `delete_conflict_${recordId}`,
            table_name: tableName,
            field_name: '_record',
            client_value: localData,
            server_value: null,
            client_timestamp: (localData as any).last_modified || (localData as any).updated_at || '',
            server_timestamp: new Date().toISOString(),
            conflict_type: 'delete_conflict'
          };
          
          await this.recordManualConflicts([conflict]);
        } else {
          // 删除本地记录
          await indexedDBService.delete(tableName as any, recordId);
        }
      }
    } catch (error) {
      console.error('处理服务器删除操作失败:', error);
      throw error;
    }
  }

  // 上传本地变更到服务器
  private async uploadLocalChanges(localChanges: SyncRecord[]): Promise<{
    processed: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      errors: []
    };

    // 按批次处理
    for (let i = 0; i < localChanges.length; i += this.SYNC_BATCH_SIZE) {
      const batch = localChanges.slice(i, i + this.SYNC_BATCH_SIZE);
      
      try {
        await this.uploadBatch(batch);
        result.processed += batch.length;
        
        // 标记为已同步
        for (const change of batch) {
          await indexedDBService.markAsSynced(change.table_name as any, change.record_id);
          await indexedDBService.removeFromOfflineQueue(change.id);
        }
      } catch (error) {
        console.error('上传批次失败:', error);
        result.errors.push(`批次上传失败: ${error}`);
        
        // 增加重试计数
        for (const change of batch) {
          await indexedDBService.incrementRetryCount(change.id);
        }
      }
    }

    return result;
  }

  // 上传批次数据
  private async uploadBatch(batch: SyncRecord[]): Promise<void> {
    // TODO: 实现实际的服务器API调用
    // 这里应该调用服务器API上传批次数据
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟成功率（95%成功）
    if (Math.random() < 0.05) {
      throw new Error('网络错误');
    }
    
    console.log(`📤 上传批次: ${batch.length} 条记录`);
  }

  // 记录手动冲突
  private async recordManualConflicts(conflicts: DataConflict[]): Promise<void> {
    try {
      for (const conflict of conflicts) {
        await indexedDBService.create('manual_conflicts' as any, {
          id: conflict.id,
          ...conflict,
          created_at: new Date().toISOString(),
          resolved: false
        });
      }
    } catch (error) {
      console.error('记录手动冲突失败:', error);
    }
  }

  // 获取同步检查点
  private async getCheckpoint(userId: string, tableName: string): Promise<SyncCheckpoint> {
    try {
      const checkpoint = await indexedDBService.read('sync_checkpoints' as any, `${userId}_${tableName}`);
      
      if (checkpoint) {
        return checkpoint;
      }

      // 创建初始检查点
      const initialCheckpoint: SyncCheckpoint = {
        user_id: userId,
        table_name: tableName,
        last_sync_timestamp: '1970-01-01T00:00:00.000Z',
        last_sync_id: '',
        total_records: 0,
        synced_records: 0
      };

      await indexedDBService.create('sync_checkpoints' as any, {
        id: `${userId}_${tableName}`,
        ...initialCheckpoint
      });

      return initialCheckpoint;
    } catch (error) {
      console.error('获取同步检查点失败:', error);
      throw error;
    }
  }

  // 更新同步检查点
  private async updateCheckpoint(
    userId: string,
    tableName: string,
    updates: Partial<SyncCheckpoint>
  ): Promise<SyncCheckpoint> {
    try {
      const checkpointId = `${userId}_${tableName}`;
      const existingCheckpoint = await indexedDBService.read('sync_checkpoints' as any, checkpointId);
      
      const updatedCheckpoint: SyncCheckpoint = {
        ...existingCheckpoint,
        ...updates,
        user_id: userId,
        table_name: tableName
      };

      await indexedDBService.update('sync_checkpoints' as any, {
        id: checkpointId,
        ...updatedCheckpoint
      });

      return updatedCheckpoint;
    } catch (error) {
      console.error('更新同步检查点失败:', error);
      throw error;
    }
  }

  // 获取所有表的同步状态
  async getAllSyncStatus(userId: string): Promise<Record<string, SyncCheckpoint>> {
    try {
      const tables = ['users', 'accounts', 'assets', 'transactions', 'portfolios', 'portfolio_assets'];
      const status: Record<string, SyncCheckpoint> = {};

      for (const tableName of tables) {
        status[tableName] = await this.getCheckpoint(userId, tableName);
      }

      return status;
    } catch (error) {
      console.error('获取同步状态失败:', error);
      return {};
    }
  }

  // 重置表的同步状态
  async resetTableSync(userId: string, tableName: string): Promise<void> {
    try {
      const checkpointId = `${userId}_${tableName}`;
      
      // 重置检查点
      await indexedDBService.update('sync_checkpoints' as any, {
        id: checkpointId,
        user_id: userId,
        table_name: tableName,
        last_sync_timestamp: '1970-01-01T00:00:00.000Z',
        last_sync_id: '',
        total_records: 0,
        synced_records: 0
      });

      // 清除相关的离线队列项
      const queueItems = await indexedDBService.getOfflineQueue();
      const tableQueueItems = queueItems.filter(item => item.table_name === tableName);
      
      for (const item of tableQueueItems) {
        await indexedDBService.removeFromOfflineQueue(item.id);
      }

      console.log(`✅ 已重置表 ${tableName} 的同步状态`);
    } catch (error) {
      console.error('重置表同步状态失败:', error);
      throw error;
    }
  }

  // 获取冲突列表
  async getManualConflicts(userId: string): Promise<DataConflict[]> {
    try {
      const conflicts = await indexedDBService.getByIndex('manual_conflicts' as any, 'by-user', userId);
      return conflicts.filter((conflict: any) => !conflict.resolved);
    } catch (error) {
      console.error('获取手动冲突失败:', error);
      return [];
    }
  }

  // 解决手动冲突
  async resolveManualConflict(conflictId: string, resolution: 'client' | 'server' | 'custom', customValue?: any): Promise<void> {
    try {
      const conflict = await indexedDBService.read('manual_conflicts' as any, conflictId);
      if (!conflict) {
        throw new Error('冲突不存在');
      }

      let resolvedValue: any;
      switch (resolution) {
        case 'client':
          resolvedValue = conflict.client_value;
          break;
        case 'server':
          resolvedValue = conflict.server_value;
          break;
        case 'custom':
          resolvedValue = customValue;
          break;
        default:
          throw new Error('无效的解决方案');
      }

      // 应用解决方案到数据
      if (conflict.field_name === '_record') {
        // 整个记录的冲突
        if (resolution === 'server' && conflict.server_value === null) {
          // 服务器删除，删除本地记录
          await indexedDBService.delete(conflict.table_name as any, conflict.client_value.id);
        } else {
          // 更新记录
          await indexedDBService.update(conflict.table_name as any, {
            ...resolvedValue,
            synced: true,
            last_modified: new Date().toISOString()
          });
        }
      } else {
        // 字段级冲突
        const record = await indexedDBService.read(conflict.table_name as any, conflict.client_value.id);
        if (record) {
          await indexedDBService.update(conflict.table_name as any, {
            ...record,
            [conflict.field_name]: resolvedValue,
            synced: true,
            last_modified: new Date().toISOString()
          });
        }
      }

      // 标记冲突为已解决
      await indexedDBService.update('manual_conflicts' as any, {
        ...conflict,
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_type: resolution,
        resolved_value: resolvedValue
      });

      console.log(`✅ 已解决冲突: ${conflictId}`);
    } catch (error) {
      console.error('解决手动冲突失败:', error);
      throw error;
    }
  }

  // 批量解决冲突
  async batchResolveConflicts(
    conflictIds: string[], 
    resolution: 'client' | 'server',
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < conflictIds.length; i++) {
      try {
        await this.resolveManualConflict(conflictIds[i], resolution);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`冲突 ${conflictIds[i]}: ${error}`);
      }

      if (onProgress) {
        onProgress(i + 1, conflictIds.length);
      }
    }

    return result;
  }

  // 获取同步统计信息
  async getSyncStatistics(userId: string): Promise<{
    totalTables: number;
    syncedTables: number;
    pendingChanges: number;
    conflicts: number;
    lastSyncTime: string | null;
    syncHealth: 'good' | 'warning' | 'error';
  }> {
    try {
      const allStatus = await this.getAllSyncStatus(userId);
      const conflicts = await this.getManualConflicts(userId);
      const queueItems = await indexedDBService.getOfflineQueue();

      const totalTables = Object.keys(allStatus).length;
      const syncedTables = Object.values(allStatus).filter(status => 
        status.synced_records === status.total_records && status.total_records > 0
      ).length;

      const pendingChanges = queueItems.length;
      const conflictCount = conflicts.length;

      // 计算最后同步时间
      const lastSyncTimes = Object.values(allStatus)
        .map(status => new Date(status.last_sync_timestamp).getTime())
        .filter(time => time > 0);
      
      const lastSyncTime = lastSyncTimes.length > 0 ? 
        new Date(Math.max(...lastSyncTimes)).toISOString() : null;

      // 计算同步健康状态
      let syncHealth: 'good' | 'warning' | 'error' = 'good';
      if (conflictCount > 0 || pendingChanges > 100) {
        syncHealth = 'error';
      } else if (pendingChanges > 10 || syncedTables < totalTables * 0.8) {
        syncHealth = 'warning';
      }

      return {
        totalTables,
        syncedTables,
        pendingChanges,
        conflicts: conflictCount,
        lastSyncTime,
        syncHealth
      };
    } catch (error) {
      console.error('获取同步统计信息失败:', error);
      return {
        totalTables: 0,
        syncedTables: 0,
        pendingChanges: 0,
        conflicts: 0,
        lastSyncTime: null,
        syncHealth: 'error'
      };
    }
  }

  // 启动自动增量同步
  startAutoSync(userId: string): () => void {
    const tables = ['users', 'accounts', 'assets', 'transactions', 'portfolios', 'portfolio_assets'];
    
    const syncInterval = setInterval(async () => {
      try {
        for (const tableName of tables) {
          await this.performIncrementalSync(userId, tableName);
        }
      } catch (error) {
        console.error('自动增量同步失败:', error);
      }
    }, this.SYNC_INTERVAL);

    console.log('✅ 自动增量同步已启动');

    // 返回停止函数
    return () => {
      clearInterval(syncInterval);
      console.log('⏹️ 自动增量同步已停止');
    };
  }
}

// 创建单例实例
export const incrementalSyncService = new IncrementalSyncService();

// 导出类型
export type { SyncRecord, SyncCheckpoint, IncrementalSyncResult };
