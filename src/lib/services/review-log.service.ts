/**
 * 复盘日志数据服务
 * 负责复盘日志的本地存储和云端同步
 */

import { ReviewLog } from '../types/data.types';
import { localStorageService } from './local-storage.service';
import { syncService } from './sync.service';
import { supabaseSyncService } from './supabase-sync.service';

export interface CreateReviewLogData {
  title: string;
  content: string;
  review_date: string;
  mood: 'positive' | 'neutral' | 'negative';
  emotion_score?: number;
  profit?: number;
  profit_rate?: number;
  tags?: string[];
  lessons_learned?: string;
  next_plan?: string;
  related_transactions?: number[];
}

export interface UpdateReviewLogData extends Partial<CreateReviewLogData> {
  id: number;
}

export interface ReviewLogQuery {
  search?: string;
  mood?: 'positive' | 'neutral' | 'negative';
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  sortBy?: 'date' | 'profit' | 'emotion_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class ReviewLogService {
  private readonly STORAGE_KEY = 'assetwise_reviews';

  // 获取所有复盘日志
  async getAllReviewLogs(): Promise<ReviewLog[]> {
    try {
      const data = await localStorageService.getData<ReviewLog>('reviews');
      return data.sort((a, b) => 
        new Date(b.review_date || b.created_at).getTime() - 
        new Date(a.review_date || a.created_at).getTime()
      );
    } catch (error) {
      console.error('获取复盘日志失败:', error);
      return [];
    }
  }

  // 根据查询条件获取复盘日志
  async getReviewLogs(query: ReviewLogQuery = {}): Promise<ReviewLog[]> {
    try {
      let logs = await this.getAllReviewLogs();

      // 搜索过滤
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        logs = logs.filter(log => 
          log.title.toLowerCase().includes(searchTerm) ||
          log.content.toLowerCase().includes(searchTerm) ||
          (log.tags && log.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
      }

      // 情绪过滤
      if (query.mood) {
        logs = logs.filter(log => log.mood === query.mood);
      }

      // 日期范围过滤
      if (query.dateFrom) {
        logs = logs.filter(log => {
          const logDate = log.review_date || log.created_at;
          return new Date(logDate) >= new Date(query.dateFrom!);
        });
      }

      if (query.dateTo) {
        logs = logs.filter(log => {
          const logDate = log.review_date || log.created_at;
          return new Date(logDate) <= new Date(query.dateTo!);
        });
      }

      // 标签过滤
      if (query.tags && query.tags.length > 0) {
        logs = logs.filter(log => 
          log.tags && query.tags!.some(tag => log.tags!.includes(tag))
        );
      }

      // 排序
      if (query.sortBy) {
        logs.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (query.sortBy) {
            case 'date':
              aValue = new Date(a.review_date || a.created_at).getTime();
              bValue = new Date(b.review_date || b.created_at).getTime();
              break;
            case 'profit':
              aValue = a.profit || 0;
              bValue = b.profit || 0;
              break;
            case 'emotion_score':
              aValue = a.emotion_score || 0;
              bValue = b.emotion_score || 0;
              break;
            default:
              return 0;
          }

          const order = query.sortOrder === 'asc' ? 1 : -1;
          return aValue > bValue ? order : aValue < bValue ? -order : 0;
        });
      }

      // 分页
      if (query.offset || query.limit) {
        const start = query.offset || 0;
        const end = query.limit ? start + query.limit : undefined;
        logs = logs.slice(start, end);
      }

      return logs;
    } catch (error) {
      console.error('查询复盘日志失败:', error);
      return [];
    }
  }

  // 根据ID获取复盘日志
  async getReviewLogById(id: number): Promise<ReviewLog | null> {
    try {
      const logs = await this.getAllReviewLogs();
      return logs.find(log => log.id === id) || null;
    } catch (error) {
      console.error('获取复盘日志失败:', error);
      return null;
    }
  }

  // 创建复盘日志
  async createReviewLog(data: CreateReviewLogData): Promise<ReviewLog> {
    try {
      const now = new Date().toISOString();
      const newLog: ReviewLog = {
        id: Date.now(), // 临时ID，实际应该使用UUID
        user_id: 'current_user', // 实际应该从认证状态获取
        title: data.title,
        content: data.content,
        review_date: data.review_date,
        mood: data.mood,
        emotion_score: data.emotion_score,
        profit: data.profit,
        profit_rate: data.profit_rate,
        tags: data.tags || [],
        lessons_learned: data.lessons_learned,
        next_plan: data.next_plan,
        related_transactions: data.related_transactions || [],
        created_at: now,
        updated_at: now
      };

      // 保存到本地存储
      await localStorageService.saveDataItem('reviews', newLog as any);

      // 添加到同步队列
      await localStorageService.addToSyncQueue('reviews', String(newLog.id), 'create');

      // 触发自动同步
      this.triggerAutoSync();

      return newLog;
    } catch (error) {
      console.error('创建复盘日志失败:', error);
      throw error;
    }
  }

  // 更新复盘日志
  async updateReviewLog(data: UpdateReviewLogData): Promise<ReviewLog> {
    try {
      const existingLog = await this.getReviewLogById(data.id);
      if (!existingLog) {
        throw new Error('复盘日志不存在');
      }

      const updatedLog: ReviewLog = {
        ...existingLog,
        ...data,
        updated_at: new Date().toISOString()
      };

      // 保存到本地存储
      await localStorageService.saveDataItem('reviews', updatedLog as any);

      // 添加到同步队列
      await localStorageService.addToSyncQueue('reviews', String(updatedLog.id), 'update');

      // 触发自动同步
      this.triggerAutoSync();

      return updatedLog;
    } catch (error) {
      console.error('更新复盘日志失败:', error);
      throw error;
    }
  }

  // 删除复盘日志
  async deleteReviewLog(id: number): Promise<void> {
    try {
      // 从本地存储删除
      await localStorageService.deleteDataItem('reviews', String(id));

      // 添加到同步队列
      await localStorageService.addToSyncQueue('reviews', String(id), 'delete');

      // 触发自动同步
      this.triggerAutoSync();
    } catch (error) {
      console.error('删除复盘日志失败:', error);
      throw error;
    }
  }

  // 批量删除复盘日志
  async deleteReviewLogs(ids: number[]): Promise<void> {
    try {
      for (const id of ids) {
        await this.deleteReviewLog(id);
      }
    } catch (error) {
      console.error('批量删除复盘日志失败:', error);
      throw error;
    }
  }

  // 获取复盘统计数据
  async getReviewStats(): Promise<{
    total: number;
    thisMonth: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    totalProfit: number;
    averageEmotionScore: number;
    topTags: { tag: string; count: number }[];
  }> {
    try {
      const logs = await this.getAllReviewLogs();
      const now = new Date();
      const thisMonth = logs.filter(log => {
        const logDate = new Date(log.review_date || log.created_at);
        return logDate.getMonth() === now.getMonth() && 
               logDate.getFullYear() === now.getFullYear();
      });

      // 统计情绪分布
      const positiveCount = logs.filter(log => log.mood === 'positive').length;
      const negativeCount = logs.filter(log => log.mood === 'negative').length;
      const neutralCount = logs.filter(log => log.mood === 'neutral').length;

      // 计算总盈亏
      const totalProfit = logs.reduce((sum, log) => sum + (log.profit || 0), 0);

      // 计算平均情绪评分
      const emotionScores = logs.filter(log => log.emotion_score).map(log => log.emotion_score!);
      const averageEmotionScore = emotionScores.length > 0 ? 
        emotionScores.reduce((sum, score) => sum + score, 0) / emotionScores.length : 0;

      // 统计标签使用频率
      const tagCounts = new Map<string, number>();
      logs.forEach(log => {
        if (log.tags) {
          log.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        }
      });

      const topTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        total: logs.length,
        thisMonth: thisMonth.length,
        positiveCount,
        negativeCount,
        neutralCount,
        totalProfit,
        averageEmotionScore,
        topTags
      };
    } catch (error) {
      console.error('获取复盘统计失败:', error);
      return {
        total: 0,
        thisMonth: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalProfit: 0,
        averageEmotionScore: 0,
        topTags: []
      };
    }
  }

  // 获取所有标签
  async getAllTags(): Promise<string[]> {
    try {
      const logs = await this.getAllReviewLogs();
      const tags = new Set<string>();
      
      logs.forEach(log => {
        if (log.tags) {
          log.tags.forEach(tag => tags.add(tag));
        }
      });

      return Array.from(tags).sort();
    } catch (error) {
      console.error('获取标签列表失败:', error);
      return [];
    }
  }

  // 同步复盘日志到云端
  async syncToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await syncService.syncData({ 
        dataTypes: ['reviews'],
        conflictResolution: 'merge'
      });

      if (result.success) {
        return {
          success: true,
          message: `同步成功，已同步 ${result.synced_count} 条记录`
        };
      } else {
        return {
          success: false,
          message: `同步失败：${result.errors.join(', ')}`
        };
      }
    } catch (error) {
      console.error('同步复盘日志失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '同步失败'
      };
    }
  }

  // 从云端拉取复盘日志
  async pullFromCloud(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await syncService.syncData({ 
        dataTypes: ['reviews'],
        forceSync: true,
        conflictResolution: 'remote_wins'
      });

      if (result.success) {
        return {
          success: true,
          message: `拉取成功，已获取 ${result.synced_count} 条记录`
        };
      } else {
        return {
          success: false,
          message: `拉取失败：${result.errors.join(', ')}`
        };
      }
    } catch (error) {
      console.error('拉取复盘日志失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '拉取失败'
      };
    }
  }

  // 获取同步状态
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    pendingCount: number;
    hasPermission: boolean;
  }> {
    try {
      const stats = await syncService.getSyncStats();
      const pendingReviews = localStorageService.getSyncQueue()
        .filter(item => item.data_type === 'reviews').length;

      return {
        isOnline: syncService.isNetworkAvailable(),
        isSyncing: syncService.isSyncInProgress(),
        lastSyncTime: syncService.getLastSyncTime(),
        pendingCount: pendingReviews,
        hasPermission: stats.sync_enabled
      };
    } catch (error) {
      console.error('获取同步状态失败:', error);
      return {
        isOnline: false,
        isSyncing: false,
        lastSyncTime: null,
        pendingCount: 0,
        hasPermission: false
      };
    }
  }

  // 触发自动同步
  private triggerAutoSync(): void {
    // 延迟触发同步，避免频繁同步
    setTimeout(async () => {
      try {
        const syncStatus = await this.getSyncStatus();
        if (syncStatus.isOnline && !syncStatus.isSyncing && syncStatus.hasPermission) {
          await this.syncToCloud();
        }
      } catch (error) {
        console.error('自动同步失败:', error);
      }
    }, 2000);
  }

  // 导出复盘日志数据
  async exportReviewLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const logs = await this.getAllReviewLogs();
      
      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else {
        // CSV格式
        const headers = [
          'ID', '标题', '内容', '复盘日期', '情绪', '情绪评分', 
          '盈亏', '盈亏率', '标签', '经验教训', '下一步计划', '创建时间'
        ];
        
        const csvRows = [
          headers.join(','),
          ...logs.map(log => [
            log.id,
            `"${log.title.replace(/"/g, '""')}"`,
            `"${log.content.replace(/"/g, '""')}"`,
            log.review_date || log.created_at,
            log.mood,
            log.emotion_score || '',
            log.profit || '',
            log.profit_rate || '',
            `"${(log.tags || []).join(';')}"`,
            `"${(log.lessons_learned || '').replace(/"/g, '""')}"`,
            `"${(log.next_plan || '').replace(/"/g, '""')}"`,
            log.created_at
          ].join(','))
        ];
        
        return csvRows.join('\n');
      }
    } catch (error) {
      console.error('导出复盘日志失败:', error);
      throw error;
    }
  }

  // 导入复盘日志数据
  async importReviewLogs(data: string, format: 'json' | 'csv' = 'json'): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }> {
    const result = {
      success: true,
      imported: 0,
      errors: [] as string[]
    };

    try {
      let logsToImport: any[] = [];

      if (format === 'json') {
        logsToImport = JSON.parse(data);
      } else {
        // 解析CSV格式
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= headers.length) {
            const log: any = {};
            headers.forEach((header, index) => {
              log[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
            });
            logsToImport.push(log);
          }
        }
      }

      // 导入每条记录
      for (const logData of logsToImport) {
        try {
          await this.createReviewLog({
            title: logData.title || logData['标题'] || '导入的复盘',
            content: logData.content || logData['内容'] || '',
            review_date: logData.review_date || logData['复盘日期'] || new Date().toISOString(),
            mood: logData.mood || logData['情绪'] || 'neutral',
            emotion_score: logData.emotion_score || logData['情绪评分'] || undefined,
            profit: logData.profit || logData['盈亏'] || undefined,
            profit_rate: logData.profit_rate || logData['盈亏率'] || undefined,
            tags: logData.tags ? (Array.isArray(logData.tags) ? logData.tags : logData.tags.split(';')) : [],
            lessons_learned: logData.lessons_learned || logData['经验教训'] || undefined,
            next_plan: logData.next_plan || logData['下一步计划'] || undefined
          });
          result.imported++;
        } catch (error) {
          result.errors.push(`导入记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      console.error('导入复盘日志失败:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '导入失败');
      return result;
    }
  }
}

// 导出单例实例
export const reviewLogService = new ReviewLogService();