/**
 * 数据同步相关类型定义
 */

// 用户订阅级别
export type SubscriptionTier = 'free' | 'professional' | 'flagship';

// 同步频率
export type SyncFrequency = 'manual' | 'hourly' | 'daily' | 'weekly';

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'paused' | 'conflict';

// 数据类型
export type DataType = 'assets' | 'transactions' | 'plans' | 'reviews' | 'settings';

// 同步配置
export interface SyncConfig {
  id: string;
  user_id: string;
  enabled: boolean;
  frequency: SyncFrequency;
  data_types: DataType[];
  wifi_only: boolean;
  auto_resolve_conflicts: boolean;
  max_versions: number;
  created_at: string;
  updated_at: string;
}

// 同步会话
export interface SyncSession {
  id: string;
  user_id: string;
  status: SyncStatus;
  started_at: string;
  completed_at?: string;
  total_items: number;
  synced_items: number;
  failed_items: number;
  data_types: DataType[];
  error_message?: string;
  conflicts?: SyncConflict[];
}

// 数据版本
export interface DataVersion {
  id: string;
  user_id: string;
  data_type: DataType;
  data_id: string;
  version: number;
  data: any;
  checksum: string;
  device_id: string;
  created_at: string;
  is_deleted: boolean;
}

// 同步冲突
export interface SyncConflict {
  id: string;
  session_id: string;
  data_type: DataType;
  data_id: string;
  local_version: DataVersion;
  remote_version: DataVersion;
  resolution?: 'local' | 'remote' | 'merged';
  resolved_at?: string;
  resolved_data?: any;
}

// 同步日志
export interface SyncLog {
  id: string;
  session_id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  data_type?: DataType;
  data_id?: string;
  timestamp: string;
}

// 同步统计
export interface SyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  last_sync_at?: string;
  next_sync_at?: string;
  total_data_size: number;
  conflicts_resolved: number;
  average_sync_time: number;
}

// 订阅限制
export interface SubscriptionLimits {
  tier: SubscriptionTier;
  max_storage_mb: number;
  max_versions_per_item: number;
  sync_frequency_options: SyncFrequency[];
  realtime_sync: boolean;
  conflict_resolution: boolean;
  backup_retention_days: number;
}

// 同步进度
export interface SyncProgress {
  session_id: string;
  current_step: string;
  progress_percentage: number;
  estimated_time_remaining?: number;
  current_data_type?: DataType;
  items_processed: number;
  total_items: number;
}

// 设备信息
export interface DeviceInfo {
  id: string;
  user_id: string;
  name: string;
  type: 'web' | 'desktop' | 'mobile';
  platform: string;
  last_active: string;
  sync_enabled: boolean;
}

// 同步队列项
export interface SyncQueueItem {
  id: string;
  data_type: DataType;
  data_id: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  priority: number;
  created_at: string;
  retry_count: number;
  max_retries: number;
}

// 同步事件
export interface SyncEvent {
  type: 'sync_started' | 'sync_progress' | 'sync_completed' | 'sync_failed' | 'conflict_detected';
  session_id: string;
  data?: any;
  timestamp: string;
}

// API响应类型
export interface SyncApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 同步设置表单
export interface SyncSettingsForm {
  enabled: boolean;
  frequency: SyncFrequency;
  data_types: DataType[];
  wifi_only: boolean;
  auto_resolve_conflicts: boolean;
}

// 冲突解决选项
export interface ConflictResolutionOption {
  id: string;
  label: string;
  description: string;
  action: 'local' | 'remote' | 'merge' | 'skip';
}

// 同步状态上下文
export interface SyncContextState {
  config: SyncConfig | null;
  currentSession: SyncSession | null;
  progress: SyncProgress | null;
  stats: SyncStats | null;
  conflicts: SyncConflict[];
  logs: SyncLog[];
  isOnline: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionLimits: SubscriptionLimits | null;
}

// 同步操作
export interface SyncActions {
  startSync: (dataTypes?: DataType[]) => Promise<void>;
  pauseSync: () => Promise<void>;
  resumeSync: () => Promise<void>;
  cancelSync: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', data?: any) => Promise<void>;
  updateConfig: (config: Partial<SyncConfig>) => Promise<void>;
  getVersionHistory: (dataType: DataType, dataId: string) => Promise<DataVersion[]>;
  restoreVersion: (versionId: string) => Promise<void>;
  clearSyncData: () => Promise<void>;
}