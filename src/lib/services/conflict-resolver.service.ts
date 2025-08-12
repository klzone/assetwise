import { User, Asset, Transaction, Account } from '@/lib/types/data.types';
import { Portfolio, PortfolioAsset } from '@/lib/types/portfolio.types';

// 冲突类型定义
export interface DataConflict<T = any> {
  id: string;
  table_name: string;
  field_name: string;
  client_value: T;
  server_value: T;
  client_timestamp: string;
  server_timestamp: string;
  conflict_type: 'value_mismatch' | 'concurrent_edit' | 'delete_conflict';
}

// 冲突解决策略
export type ConflictResolutionStrategy = 
  | 'client_wins'      // 客户端优先
  | 'server_wins'      // 服务器优先
  | 'latest_wins'      // 最新时间戳优先
  | 'merge'            // 智能合并
  | 'manual'           // 手动解决
  | 'field_priority';  // 字段优先级

// 冲突解决结果
export interface ConflictResolution<T = any> {
  strategy: ConflictResolutionStrategy;
  resolved_value: T;
  requires_manual: boolean;
  merge_details?: {
    merged_fields: string[];
    client_fields: string[];
    server_fields: string[];
  };
}

// 字段优先级配置
interface FieldPriorityConfig {
  [tableName: string]: {
    [fieldName: string]: 'client' | 'server' | 'latest' | 'merge';
  };
}

class ConflictResolverService {
  private fieldPriorityConfig: FieldPriorityConfig = {
    // 用户数据：服务器优先（权限、设置等）
    users: {
      email: 'server',
      username: 'server',
      avatar_url: 'client',
      preferences: 'merge',
      last_login: 'server',
      created_at: 'server',
      updated_at: 'latest'
    },

    // 账户数据：客户端优先（用户输入的数据）
    accounts: {
      name: 'client',
      type: 'client',
      balance: 'latest',
      currency: 'client',
      description: 'client',
      is_active: 'client',
      updated_at: 'latest'
    },

    // 资产数据：合并策略（价格信息服务器优先，用户数据客户端优先）
    assets: {
      symbol: 'server',
      name: 'server',
      current_price: 'server',
      market_cap: 'server',
      volume: 'server',
      change_24h: 'server',
      user_notes: 'client',
      is_favorite: 'client',
      updated_at: 'latest'
    },

    // 交易数据：客户端优先（用户输入的交易记录）
    transactions: {
      type: 'client',
      symbol: 'client',
      quantity: 'client',
      price: 'client',
      amount: 'client',
      fee: 'client',
      notes: 'client',
      date: 'client',
      updated_at: 'latest'
    },

    // 投资组合：智能合并
    portfolios: {
      name: 'client',
      description: 'client',
      target_allocation: 'client',
      current_allocation: 'latest',
      total_value: 'latest',
      risk_level: 'client',
      investment_goal: 'client',
      rebalance_threshold: 'client',
      updated_at: 'latest'
    },

    // 投资组合资产：最新优先
    portfolio_assets: {
      quantity: 'latest',
      average_price: 'latest',
      current_price: 'server',
      current_value: 'latest',
      target_percentage: 'client',
      updated_at: 'latest'
    }
  };

  // 检测数据冲突
  detectConflicts<T extends Record<string, any>>(
    tableName: string,
    clientData: T,
    serverData: T
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];

    // 比较每个字段
    for (const fieldName in clientData) {
      if (fieldName === 'id' || fieldName === 'synced' || fieldName === 'last_modified') {
        continue; // 跳过系统字段
      }

      const clientValue = clientData[fieldName];
      const serverValue = serverData[fieldName];

      // 检查值是否不同
      if (!this.isEqual(clientValue, serverValue)) {
        const clientTimestamp = clientData.updated_at || clientData.last_modified || '';
        const serverTimestamp = serverData.updated_at || '';

        conflicts.push({
          id: `${tableName}_${clientData.id}_${fieldName}`,
          table_name: tableName,
          field_name: fieldName,
          client_value: clientValue,
          server_value: serverValue,
          client_timestamp: clientTimestamp,
          server_timestamp: serverTimestamp,
          conflict_type: this.getConflictType(clientValue, serverValue)
        });
      }
    }

    return conflicts;
  }

  // 解决单个冲突
  resolveConflict<T = any>(conflict: DataConflict<T>): ConflictResolution<T> {
    const { table_name, field_name, client_value, server_value, client_timestamp, server_timestamp } = conflict;

    // 获取字段优先级配置
    const fieldConfig = this.fieldPriorityConfig[table_name]?.[field_name];
    
    if (!fieldConfig) {
      // 默认策略：最新时间戳优先
      return this.resolveByTimestamp(client_value, server_value, client_timestamp, server_timestamp);
    }

    switch (fieldConfig) {
      case 'client':
        return {
          strategy: 'client_wins',
          resolved_value: client_value,
          requires_manual: false
        };

      case 'server':
        return {
          strategy: 'server_wins',
          resolved_value: server_value,
          requires_manual: false
        };

      case 'latest':
        return this.resolveByTimestamp(client_value, server_value, client_timestamp, server_timestamp);

      case 'merge':
        return this.attemptMerge(field_name, client_value, server_value);

      default:
        return this.resolveByTimestamp(client_value, server_value, client_timestamp, server_timestamp);
    }
  }

  // 批量解决冲突
  resolveConflicts<T extends Record<string, any>>(
    tableName: string,
    clientData: T,
    serverData: T
  ): { resolvedData: T; manualConflicts: DataConflict[] } {
    const conflicts = this.detectConflicts(tableName, clientData, serverData);
    const resolvedData = { ...serverData }; // 从服务器数据开始
    const manualConflicts: DataConflict[] = [];

    for (const conflict of conflicts) {
      const resolution = this.resolveConflict(conflict);

      if (resolution.requires_manual) {
        manualConflicts.push(conflict);
      } else {
        resolvedData[conflict.field_name] = resolution.resolved_value;
      }
    }

    // 确保保留客户端的同步状态
    (resolvedData as any).synced = true;
    (resolvedData as any).last_modified = new Date().toISOString();

    return { resolvedData, manualConflicts };
  }

  // 按时间戳解决冲突
  private resolveByTimestamp<T>(
    clientValue: T,
    serverValue: T,
    clientTimestamp: string,
    serverTimestamp: string
  ): ConflictResolution<T> {
    const clientTime = new Date(clientTimestamp || 0).getTime();
    const serverTime = new Date(serverTimestamp || 0).getTime();

    if (clientTime > serverTime) {
      return {
        strategy: 'latest_wins',
        resolved_value: clientValue,
        requires_manual: false
      };
    } else {
      return {
        strategy: 'latest_wins',
        resolved_value: serverValue,
        requires_manual: false
      };
    }
  }

  // 尝试智能合并
  private attemptMerge<T>(fieldName: string, clientValue: T, serverValue: T): ConflictResolution<T> {
    // 对于对象类型，尝试合并
    if (typeof clientValue === 'object' && typeof serverValue === 'object' && 
        clientValue !== null && serverValue !== null) {
      
      if (Array.isArray(clientValue) && Array.isArray(serverValue)) {
        // 数组合并：去重合并
        const merged = this.mergeArrays(clientValue, serverValue);
        return {
          strategy: 'merge',
          resolved_value: merged as T,
          requires_manual: false,
          merge_details: {
            merged_fields: [fieldName],
            client_fields: [],
            server_fields: []
          }
        };
      } else {
        // 对象合并
        const merged = { ...serverValue, ...clientValue };
        return {
          strategy: 'merge',
          resolved_value: merged as T,
          requires_manual: false,
          merge_details: {
            merged_fields: [fieldName],
            client_fields: Object.keys(clientValue as any),
            server_fields: Object.keys(serverValue as any)
          }
        };
      }
    }

    // 对于字符串，如果是用户偏好设置，尝试合并
    if (typeof clientValue === 'string' && typeof serverValue === 'string' && 
        fieldName === 'preferences') {
      try {
        const clientPrefs = JSON.parse(clientValue);
        const serverPrefs = JSON.parse(serverValue);
        const merged = { ...serverPrefs, ...clientPrefs };
        
        return {
          strategy: 'merge',
          resolved_value: JSON.stringify(merged) as T,
          requires_manual: false,
          merge_details: {
            merged_fields: [fieldName],
            client_fields: Object.keys(clientPrefs),
            server_fields: Object.keys(serverPrefs)
          }
        };
      } catch {
        // JSON解析失败，标记为需要手动解决
        return {
          strategy: 'manual',
          resolved_value: serverValue,
          requires_manual: true
        };
      }
    }

    // 无法自动合并，标记为需要手动解决
    return {
      strategy: 'manual',
      resolved_value: serverValue,
      requires_manual: true
    };
  }

  // 合并数组（去重）
  private mergeArrays<T>(clientArray: T[], serverArray: T[]): T[] {
    const merged = [...serverArray];
    
    for (const clientItem of clientArray) {
      if (!this.arrayContains(merged, clientItem)) {
        merged.push(clientItem);
      }
    }
    
    return merged;
  }

  // 检查数组是否包含某项
  private arrayContains<T>(array: T[], item: T): boolean {
    return array.some(arrayItem => this.isEqual(arrayItem, item));
  }

  // 深度比较两个值是否相等
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => this.isEqual(item, b[index]));
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => this.isEqual(a[key], b[key]));
    }
    
    return false;
  }

  // 获取冲突类型
  private getConflictType(clientValue: any, serverValue: any): DataConflict['conflict_type'] {
    if (clientValue == null && serverValue != null) return 'delete_conflict';
    if (clientValue != null && serverValue == null) return 'delete_conflict';
    return 'value_mismatch';
  }

  // 获取表的冲突解决策略
  getTableStrategy(tableName: string): ConflictResolutionStrategy {
    const strategies: Record<string, ConflictResolutionStrategy> = {
      users: 'server_wins',
      accounts: 'client_wins',
      assets: 'merge',
      transactions: 'client_wins',
      portfolios: 'merge',
      portfolio_assets: 'latest_wins'
    };

    return strategies[tableName] || 'latest_wins';
  }

  // 设置字段优先级
  setFieldPriority(
    tableName: string, 
    fieldName: string, 
    priority: 'client' | 'server' | 'latest' | 'merge'
  ): void {
    if (!this.fieldPriorityConfig[tableName]) {
      this.fieldPriorityConfig[tableName] = {};
    }
    this.fieldPriorityConfig[tableName][fieldName] = priority;
  }

  // 获取冲突统计
  getConflictStats(conflicts: DataConflict[]): {
    total: number;
    byTable: Record<string, number>;
    byType: Record<string, number>;
    requiresManual: number;
  } {
    const stats = {
      total: conflicts.length,
      byTable: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      requiresManual: 0
    };

    for (const conflict of conflicts) {
      // 按表统计
      stats.byTable[conflict.table_name] = (stats.byTable[conflict.table_name] || 0) + 1;
      
      // 按类型统计
      stats.byType[conflict.conflict_type] = (stats.byType[conflict.conflict_type] || 0) + 1;
      
      // 检查是否需要手动解决
      const resolution = this.resolveConflict(conflict);
      if (resolution.requires_manual) {
        stats.requiresManual++;
      }
    }

    return stats;
  }
}

// 创建单例实例
export const conflictResolverService = new ConflictResolverService();

// 导出类型
export type { ConflictResolutionStrategy, ConflictResolution, DataConflict };