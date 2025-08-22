'use client';

import { DataType } from '@/lib/types/sync.types';

export interface DataConflict {
  id: string;
  itemId: string;
  itemType: string;
  dataType: DataType;
  conflictType: ConflictType;
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
  timestamp: Date;
  status: ConflictStatus;
  resolution?: ConflictResolution;
  metadata: ConflictMetadata;
}

export type ConflictType = 
  | 'update_update'    // 本地和远程都修改了同一字段
  | 'update_delete'    // 本地修改，远程删除
  | 'delete_update'    // 本地删除，远程修改
  | 'create_create'    // 本地和远程都创建了相同ID的项目
  | 'schema_mismatch'  // 数据结构不匹配
  | 'timestamp_conflict'; // 时间戳冲突

export type ConflictStatus = 'pending' | 'resolved' | 'ignored' | 'failed';

export interface ConflictVersion {
  data: any;
  timestamp: Date;
  checksum: string;
  source: 'local' | 'remote';
  userId?: string;
  device?: string;
  version?: number;
}

export interface ConflictResolution {
  strategy: ResolutionStrategy;
  resolvedData: any;
  resolvedBy: string;
  resolvedAt: Date;
  reason?: string;
  mergeDetails?: MergeDetails;
}

export type ResolutionStrategy = 
  | 'use_local'        // 使用本地版本
  | 'use_remote'       // 使用远程版本
  | 'merge_auto'       // 自动合并
  | 'merge_manual'     // 手动合并
  | 'create_both'      // 保留两个版本
  | 'ignore';          // 忽略冲突

export interface MergeDetails {
  mergedFields: string[];
  conflictedFields: string[];
  autoResolved: string[];
  manualResolved: string[];
}

export interface ConflictMetadata {
  syncId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: string[];
  relatedConflicts: string[];
  tags: string[];
}

export interface ConflictDetectionRule {
  id: string;
  name: string;
  dataType: DataType;
  enabled: boolean;
  priority: number;
  conditions: ConflictCondition[];
  autoResolution?: ResolutionStrategy;
}

export interface ConflictCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'changed' | 'exists' | 'not_exists';
  value?: any;
  weight: number;
}

export interface ConflictStats {
  total: number;
  pending: number;
  resolved: number;
  ignored: number;
  failed: number;
  byType: Record<ConflictType, number>;
  byDataType: Record<DataType, number>;
  avgResolutionTime: number;
  criticalCount: number;
}

class ConflictService {
  private conflicts: Map<string, DataConflict> = new Map();
  private rules: ConflictDetectionRule[] = [];
  private listeners: ((conflicts: DataConflict[]) => void)[] = [];
  private readonly STORAGE_KEY = 'assetwise_conflicts';
  private readonly RULES_KEY = 'assetwise_conflict_rules';

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadConflicts();
      this.loadRules();
      this.initializeDefaultRules();
    }
  }

  private loadConflicts(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, conflict]: [string, any]) => {
          this.conflicts.set(id, {
            ...conflict,
            timestamp: new Date(conflict.timestamp),
            localVersion: {
              ...conflict.localVersion,
              timestamp: new Date(conflict.localVersion.timestamp)
            },
            remoteVersion: {
              ...conflict.remoteVersion,
              timestamp: new Date(conflict.remoteVersion.timestamp)
            },
            resolution: conflict.resolution ? {
              ...conflict.resolution,
              resolvedAt: new Date(conflict.resolution.resolvedAt)
            } : undefined
          });
        });
      }
    } catch (error) {
      console.error('加载冲突数据失败:', error);
    }
  }

  private saveConflicts(): void {
    try {
      const data: Record<string, any> = {};
      this.conflicts.forEach((conflict, id) => {
        data[id] = conflict;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存冲突数据失败:', error);
    }
  }

  private loadRules(): void {
    try {
      const stored = localStorage.getItem(this.RULES_KEY);
      if (stored) {
        this.rules = JSON.parse(stored);
      }
    } catch (error) {
      console.error('加载冲突规则失败:', error);
    }
  }

  private saveRules(): void {
    try {
      localStorage.setItem(this.RULES_KEY, JSON.stringify(this.rules));
    } catch (error) {
      console.error('保存冲突规则失败:', error);
    }
  }

  private initializeDefaultRules(): void {
    if (this.rules.length === 0) {
      const defaultRules: ConflictDetectionRule[] = [
        {
          id: 'update_update_rule',
          name: '同时修改检测',
          dataType: 'assets',
          enabled: true,
          priority: 1,
          conditions: [
            { field: 'updatedAt', operator: 'changed', weight: 1 },
            { field: 'name', operator: 'changed', weight: 0.8 }
          ],
          autoResolution: 'merge_auto'
        },
        {
          id: 'delete_update_rule',
          name: '删除-修改冲突检测',
          dataType: 'assets',
          enabled: true,
          priority: 2,
          conditions: [
            { field: 'deleted', operator: 'equals', value: true, weight: 1 },
            { field: 'updatedAt', operator: 'changed', weight: 0.9 }
          ]
        },
        {
          id: 'critical_field_rule',
          name: '关键字段冲突检测',
          dataType: 'transactions',
          enabled: true,
          priority: 3,
          conditions: [
            { field: 'amount', operator: 'changed', weight: 1 },
            { field: 'status', operator: 'changed', weight: 0.9 }
          ]
        }
      ];

      this.rules = defaultRules;
      this.saveRules();
    }
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private notifyListeners(): void {
    const conflicts = Array.from(this.conflicts.values());
    this.listeners.forEach(listener => listener(conflicts));
  }

  public subscribe(listener: (conflicts: DataConflict[]) => void): () => void {
    this.listeners.push(listener);
    listener(Array.from(this.conflicts.values()));
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public detectConflicts(
    localData: any,
    remoteData: any,
    dataType: DataType,
    itemId: string,
    itemType: string
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && rule.dataType === dataType
    );

    // 检测不同类型的冲突
    const conflictType = this.determineConflictType(localData, remoteData);
    
    if (conflictType) {
      const conflict: DataConflict = {
        id: this.generateConflictId(),
        itemId,
        itemType,
        dataType,
        conflictType,
        localVersion: {
          data: localData,
          timestamp: new Date(localData.updatedAt || Date.now()),
          checksum: this.calculateChecksum(localData),
          source: 'local'
        },
        remoteVersion: {
          data: remoteData,
          timestamp: new Date(remoteData.updatedAt || Date.now()),
          checksum: this.calculateChecksum(remoteData),
          source: 'remote'
        },
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          syncId: `sync_${Date.now()}`,
          priority: this.calculatePriority(conflictType, localData, remoteData),
          affectedUsers: [],
          relatedConflicts: [],
          tags: []
        }
      };

      // 尝试自动解决
      const autoResolution = this.tryAutoResolve(conflict, applicableRules);
      if (autoResolution) {
        conflict.resolution = autoResolution;
        conflict.status = 'resolved';
      }

      conflicts.push(conflict);
      this.conflicts.set(conflict.id, conflict);
    }

    if (conflicts.length > 0) {
      this.saveConflicts();
      this.notifyListeners();
    }

    return conflicts;
  }

  private determineConflictType(localData: any, remoteData: any): ConflictType | null {
    const localDeleted = localData.deleted || false;
    const remoteDeleted = remoteData.deleted || false;
    const localUpdated = new Date(localData.updatedAt || 0);
    const remoteUpdated = new Date(remoteData.updatedAt || 0);

    if (localDeleted && !remoteDeleted && remoteUpdated > localUpdated) {
      return 'delete_update';
    }
    
    if (!localDeleted && remoteDeleted && localUpdated > remoteUpdated) {
      return 'update_delete';
    }

    if (!localDeleted && !remoteDeleted) {
      // 检查是否有字段冲突
      const hasConflicts = this.hasFieldConflicts(localData, remoteData);
      if (hasConflicts) {
        return 'update_update';
      }
    }

    // 检查时间戳冲突
    if (Math.abs(localUpdated.getTime() - remoteUpdated.getTime()) < 1000) {
      return 'timestamp_conflict';
    }

    return null;
  }

  private hasFieldConflicts(localData: any, remoteData: any): boolean {
    const localKeys = Object.keys(localData);
    const remoteKeys = Object.keys(remoteData);
    const allKeys = new Set([...localKeys, ...remoteKeys]);

    for (const key of allKeys) {
      if (key === 'updatedAt' || key === 'createdAt') continue;
      
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      if (localValue !== remoteValue) {
        return true;
      }
    }

    return false;
  }

  private calculatePriority(
    conflictType: ConflictType,
    localData: any,
    remoteData: any
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 根据冲突类型和数据重要性计算优先级
    if (conflictType === 'delete_update' || conflictType === 'update_delete') {
      return 'critical';
    }

    if (conflictType === 'create_create') {
      return 'high';
    }

    // 检查关键字段
    const criticalFields = ['amount', 'status', 'id', 'userId'];
    const hasCriticalFieldConflict = criticalFields.some(field => 
      localData[field] !== remoteData[field]
    );

    if (hasCriticalFieldConflict) {
      return 'high';
    }

    return 'medium';
  }

  private tryAutoResolve(
    conflict: DataConflict,
    rules: ConflictDetectionRule[]
  ): ConflictResolution | null {
    for (const rule of rules) {
      if (rule.autoResolution) {
        const resolution = this.applyResolutionStrategy(
          conflict,
          rule.autoResolution,
          'system'
        );
        if (resolution) {
          resolution.reason = `自动解决 - 规则: ${rule.name}`;
          return resolution;
        }
      }
    }

    return null;
  }

  public resolveConflict(
    conflictId: string,
    strategy: ResolutionStrategy,
    resolvedBy: string,
    reason?: string
  ): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.status === 'resolved') {
      return false;
    }

    const resolution = this.applyResolutionStrategy(conflict, strategy, resolvedBy);
    if (resolution) {
      resolution.reason = reason;
      conflict.resolution = resolution;
      conflict.status = 'resolved';
      
      this.saveConflicts();
      this.notifyListeners();
      return true;
    }

    return false;
  }

  private applyResolutionStrategy(
    conflict: DataConflict,
    strategy: ResolutionStrategy,
    resolvedBy: string
  ): ConflictResolution | null {
    let resolvedData: any;
    let mergeDetails: MergeDetails | undefined;

    switch (strategy) {
      case 'use_local':
        resolvedData = conflict.localVersion.data;
        break;
        
      case 'use_remote':
        resolvedData = conflict.remoteVersion.data;
        break;
        
      case 'merge_auto':
        const mergeResult = this.autoMerge(conflict.localVersion.data, conflict.remoteVersion.data);
        resolvedData = mergeResult.data;
        mergeDetails = mergeResult.details;
        break;
        
      case 'create_both':
        // 为两个版本创建不同的ID
        resolvedData = [
          { ...conflict.localVersion.data, id: `${conflict.itemId}_local` },
          { ...conflict.remoteVersion.data, id: `${conflict.itemId}_remote` }
        ];
        break;
        
      case 'ignore':
        resolvedData = null;
        break;
        
      default:
        return null;
    }

    return {
      strategy,
      resolvedData,
      resolvedBy,
      resolvedAt: new Date(),
      mergeDetails
    };
  }

  private autoMerge(localData: any, remoteData: any): { data: any; details: MergeDetails } {
    const merged = { ...localData };
    const details: MergeDetails = {
      mergedFields: [],
      conflictedFields: [],
      autoResolved: [],
      manualResolved: []
    };

    Object.keys(remoteData).forEach(key => {
      if (key === 'id') return; // 不合并ID字段
      
      const localValue = localData[key];
      const remoteValue = remoteData[key];
      
      if (localValue === remoteValue) {
        details.mergedFields.push(key);
        return;
      }

      // 时间戳字段使用最新的
      if (key.includes('At') || key.includes('Time')) {
        const localTime = new Date(localValue || 0);
        const remoteTime = new Date(remoteValue || 0);
        merged[key] = localTime > remoteTime ? localValue : remoteValue;
        details.autoResolved.push(key);
        return;
      }

      // 数字字段使用较大的值
      if (typeof localValue === 'number' && typeof remoteValue === 'number') {
        merged[key] = Math.max(localValue, remoteValue);
        details.autoResolved.push(key);
        return;
      }

      // 字符串字段如果一个为空，使用非空的
      if (typeof localValue === 'string' && typeof remoteValue === 'string') {
        if (!localValue && remoteValue) {
          merged[key] = remoteValue;
          details.autoResolved.push(key);
          return;
        }
        if (localValue && !remoteValue) {
          merged[key] = localValue;
          details.autoResolved.push(key);
          return;
        }
      }

      // 其他情况标记为冲突
      details.conflictedFields.push(key);
      // 默认使用本地值
      merged[key] = localValue;
    });

    return { data: merged, details };
  }

  public getConflicts(filter?: {
    status?: ConflictStatus;
    dataType?: DataType;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): DataConflict[] {
    let conflicts = Array.from(this.conflicts.values());

    if (filter) {
      if (filter.status) {
        conflicts = conflicts.filter(c => c.status === filter.status);
      }
      if (filter.dataType) {
        conflicts = conflicts.filter(c => c.dataType === filter.dataType);
      }
      if (filter.priority) {
        conflicts = conflicts.filter(c => c.metadata.priority === filter.priority);
      }
    }

    return conflicts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getConflictStats(): ConflictStats {
    const conflicts = Array.from(this.conflicts.values());
    const stats: ConflictStats = {
      total: conflicts.length,
      pending: 0,
      resolved: 0,
      ignored: 0,
      failed: 0,
      byType: {} as Record<ConflictType, number>,
      byDataType: {} as Record<DataType, number>,
      avgResolutionTime: 0,
      criticalCount: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    conflicts.forEach(conflict => {
      // 统计状态
      stats[conflict.status]++;

      // 统计类型
      stats.byType[conflict.conflictType] = (stats.byType[conflict.conflictType] || 0) + 1;
      stats.byDataType[conflict.dataType] = (stats.byDataType[conflict.dataType] || 0) + 1;

      // 统计关键冲突
      if (conflict.metadata.priority === 'critical') {
        stats.criticalCount++;
      }

      // 计算平均解决时间
      if (conflict.resolution) {
        const resolutionTime = conflict.resolution.resolvedAt.getTime() - conflict.timestamp.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.avgResolutionTime = totalResolutionTime / resolvedCount;
    }

    return stats;
  }

  public ignoreConflict(conflictId: string, reason?: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    conflict.status = 'ignored';
    conflict.resolution = {
      strategy: 'ignore',
      resolvedData: null,
      resolvedBy: 'user',
      resolvedAt: new Date(),
      reason
    };

    this.saveConflicts();
    this.notifyListeners();
    return true;
  }

  public deleteConflict(conflictId: string): boolean {
    const deleted = this.conflicts.delete(conflictId);
    if (deleted) {
      this.saveConflicts();
      this.notifyListeners();
    }
    return deleted;
  }

  public clearResolvedConflicts(): number {
    const conflicts = Array.from(this.conflicts.entries());
    let removedCount = 0;

    conflicts.forEach(([id, conflict]) => {
      if (conflict.status === 'resolved' || conflict.status === 'ignored') {
        this.conflicts.delete(id);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      this.saveConflicts();
      this.notifyListeners();
    }

    return removedCount;
  }

  public getRules(): ConflictDetectionRule[] {
    return [...this.rules];
  }

  public updateRule(rule: ConflictDetectionRule): boolean {
    const index = this.rules.findIndex(r => r.id === rule.id);
    if (index > -1) {
      this.rules[index] = rule;
      this.saveRules();
      return true;
    }
    return false;
  }

  public addRule(rule: Omit<ConflictDetectionRule, 'id'>): string {
    const newRule: ConflictDetectionRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.rules.push(newRule);
    this.saveRules();
    return newRule.id;
  }

  public deleteRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      this.saveRules();
      return true;
    }
    return false;
  }
}

export const conflictService = new ConflictService();