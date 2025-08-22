'use client';

import { DataType } from '@/lib/types/sync.types';

export interface DataVersion {
  id: string;
  dataType: DataType;
  version: number;
  timestamp: Date;
  changes: VersionChange[];
  metadata: VersionMetadata;
  size: number; // in bytes
  checksum: string;
  parentVersion?: string;
  tags: string[];
  description?: string;
}

export interface VersionChange {
  type: 'create' | 'update' | 'delete';
  itemId: string;
  itemType: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface VersionMetadata {
  device: string;
  userId: string;
  syncId: string;
  conflictResolved?: boolean;
  mergeStrategy?: 'client' | 'server' | 'manual';
  source: 'local' | 'remote' | 'merge';
}

export interface VersionComparison {
  added: VersionChange[];
  modified: VersionChange[];
  deleted: VersionChange[];
  summary: {
    totalChanges: number;
    addedCount: number;
    modifiedCount: number;
    deletedCount: number;
  };
}

export interface RestoreOptions {
  targetVersion: string;
  dataTypes?: DataType[];
  preserveCurrentData?: boolean;
  createBackup?: boolean;
  mergeStrategy?: 'replace' | 'merge' | 'selective';
}

class VersionService {
  private versions: Map<string, DataVersion[]> = new Map();
  private readonly STORAGE_KEY = 'assetwise_versions';
  private readonly MAX_VERSIONS_PER_TYPE = 50;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadVersions();
    }
  }

  private loadVersions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([dataType, versions]: [string, any[]]) => {
          this.versions.set(dataType as DataType, versions.map(v => ({
            ...v,
            timestamp: new Date(v.timestamp),
            changes: v.changes.map((c: any) => ({
              ...c,
              timestamp: new Date(c.timestamp)
            }))
          })));
        });
      }
    } catch (error) {
      console.error('加载版本历史失败:', error);
    }
  }

  private saveVersions(): void {
    try {
      const data: Record<string, any[]> = {};
      this.versions.forEach((versions, dataType) => {
        data[dataType] = versions;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('保存版本历史失败:', error);
    }
  }

  private generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(data: any): string {
    // 简单的校验和计算，实际应用中应使用更强的哈希算法
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  public createVersion(
    dataType: DataType,
    changes: VersionChange[],
    metadata: VersionMetadata,
    description?: string
  ): string {
    const versions = this.versions.get(dataType) || [];
    const latestVersion = versions[0];
    const newVersion = (latestVersion?.version || 0) + 1;

    const version: DataVersion = {
      id: this.generateVersionId(),
      dataType,
      version: newVersion,
      timestamp: new Date(),
      changes,
      metadata,
      size: JSON.stringify(changes).length,
      checksum: this.calculateChecksum(changes),
      parentVersion: latestVersion?.id,
      tags: [],
      description
    };

    versions.unshift(version);

    // 限制版本数量
    if (versions.length > this.MAX_VERSIONS_PER_TYPE) {
      versions.splice(this.MAX_VERSIONS_PER_TYPE);
    }

    this.versions.set(dataType, versions);
    this.saveVersions();

    return version.id;
  }

  public getVersions(dataType?: DataType): DataVersion[] {
    if (dataType) {
      return [...(this.versions.get(dataType) || [])];
    }

    // 返回所有版本，按时间排序
    const allVersions: DataVersion[] = [];
    this.versions.forEach(versions => {
      allVersions.push(...versions);
    });

    return allVersions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getVersion(versionId: string): DataVersion | null {
    for (const versions of this.versions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) return version;
    }
    return null;
  }

  public getLatestVersion(dataType: DataType): DataVersion | null {
    const versions = this.versions.get(dataType);
    return versions?.[0] || null;
  }

  public compareVersions(versionId1: string, versionId2: string): VersionComparison | null {
    const version1 = this.getVersion(versionId1);
    const version2 = this.getVersion(versionId2);

    if (!version1 || !version2) return null;

    const changes1 = new Map(version1.changes.map(c => [`${c.itemId}_${c.field}`, c]));
    const changes2 = new Map(version2.changes.map(c => [`${c.itemId}_${c.field}`, c]));

    const added: VersionChange[] = [];
    const modified: VersionChange[] = [];
    const deleted: VersionChange[] = [];

    // 查找新增和修改的变更
    changes2.forEach((change, key) => {
      const oldChange = changes1.get(key);
      if (!oldChange) {
        added.push(change);
      } else if (oldChange.newValue !== change.newValue) {
        modified.push(change);
      }
    });

    // 查找删除的变更
    changes1.forEach((change, key) => {
      if (!changes2.has(key)) {
        deleted.push(change);
      }
    });

    return {
      added,
      modified,
      deleted,
      summary: {
        totalChanges: added.length + modified.length + deleted.length,
        addedCount: added.length,
        modifiedCount: modified.length,
        deletedCount: deleted.length
      }
    };
  }

  public async restoreVersion(versionId: string, options: RestoreOptions = {}): Promise<boolean> {
    const version = this.getVersion(versionId);
    if (!version) {
      throw new Error('版本不存在');
    }

    try {
      // 创建备份（如果需要）
      if (options.createBackup) {
        const currentData = await this.getCurrentData(version.dataType);
        this.createVersion(
          version.dataType,
          currentData,
          {
            device: 'current',
            userId: 'system',
            syncId: 'backup',
            source: 'local'
          },
          `恢复前备份 - ${new Date().toLocaleString()}`
        );
      }

      // 执行恢复操作
      await this.applyVersionChanges(version, options);

      // 创建恢复记录
      this.createVersion(
        version.dataType,
        [{
          type: 'update',
          itemId: 'system',
          itemType: 'restore',
          newValue: versionId,
          timestamp: new Date()
        }],
        {
          device: 'current',
          userId: 'system',
          syncId: 'restore',
          source: 'local'
        },
        `恢复到版本 ${version.version}`
      );

      return true;
    } catch (error) {
      console.error('恢复版本失败:', error);
      throw error;
    }
  }

  private async getCurrentData(dataType: DataType): Promise<VersionChange[]> {
    // 在实际应用中，这里会从本地存储或数据库获取当前数据
    // 这里返回模拟数据
    return [
      {
        type: 'create',
        itemId: 'current_data',
        itemType: dataType,
        newValue: 'current_state',
        timestamp: new Date()
      }
    ];
  }

  private async applyVersionChanges(version: DataVersion, options: RestoreOptions): Promise<void> {
    // 在实际应用中，这里会将版本变更应用到实际数据
    console.log('应用版本变更:', version.id, options);
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  public tagVersion(versionId: string, tag: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
      this.saveVersions();
    }

    return true;
  }

  public removeTag(versionId: string, tag: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    const index = version.tags.indexOf(tag);
    if (index > -1) {
      version.tags.splice(index, 1);
      this.saveVersions();
    }

    return true;
  }

  public searchVersions(query: {
    dataType?: DataType;
    dateRange?: { start: Date; end: Date };
    tags?: string[];
    description?: string;
    userId?: string;
    device?: string;
  }): DataVersion[] {
    let results = this.getVersions(query.dataType);

    if (query.dateRange) {
      results = results.filter(v => 
        v.timestamp >= query.dateRange!.start && 
        v.timestamp <= query.dateRange!.end
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(v => 
        query.tags!.some(tag => v.tags.includes(tag))
      );
    }

    if (query.description) {
      results = results.filter(v => 
        v.description?.toLowerCase().includes(query.description!.toLowerCase())
      );
    }

    if (query.userId) {
      results = results.filter(v => v.metadata.userId === query.userId);
    }

    if (query.device) {
      results = results.filter(v => v.metadata.device === query.device);
    }

    return results;
  }

  public getVersionStats(): {
    totalVersions: number;
    versionsByType: Record<DataType, number>;
    totalSize: number;
    oldestVersion: Date | null;
    newestVersion: Date | null;
  } {
    const allVersions = this.getVersions();
    const versionsByType: Record<string, number> = {};
    let totalSize = 0;
    let oldestVersion: Date | null = null;
    let newestVersion: Date | null = null;

    allVersions.forEach(version => {
      versionsByType[version.dataType] = (versionsByType[version.dataType] || 0) + 1;
      totalSize += version.size;

      if (!oldestVersion || version.timestamp < oldestVersion) {
        oldestVersion = version.timestamp;
      }
      if (!newestVersion || version.timestamp > newestVersion) {
        newestVersion = version.timestamp;
      }
    });

    return {
      totalVersions: allVersions.length,
      versionsByType: versionsByType as Record<DataType, number>,
      totalSize,
      oldestVersion,
      newestVersion
    };
  }

  public cleanupOldVersions(keepCount: number = 20): number {
    let removedCount = 0;

    this.versions.forEach((versions, dataType) => {
      if (versions.length > keepCount) {
        const removed = versions.splice(keepCount);
        removedCount += removed.length;
      }
    });

    if (removedCount > 0) {
      this.saveVersions();
    }

    return removedCount;
  }
}

export const versionService = new VersionService();