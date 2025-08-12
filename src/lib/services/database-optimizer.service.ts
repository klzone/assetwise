import { supabase } from '@/lib/supabase';

// 数据库性能指标
interface DatabaseMetrics {
  tableStats: TableStats[];
  indexUsage: IndexUsage[];
  queryPerformance: QueryPerformance[];
  connectionStats: ConnectionStats;
  cacheHitRatio: number;
  slowQueries: SlowQuery[];
}

interface TableStats {
  table_name: string;
  row_count: number;
  table_size: string;
  index_size: string;
  total_size: string;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  idx_tup_fetch: number;
  n_tup_ins: number;
  n_tup_upd: number;
  n_tup_del: number;
  last_vacuum: string | null;
  last_analyze: string | null;
}

interface IndexUsage {
  table_name: string;
  index_name: string;
  index_size: string;
  index_scans: number;
  tuples_read: number;
  tuples_fetched: number;
  usage_ratio: number;
  is_unique: boolean;
  definition: string;
}

interface QueryPerformance {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  min_time: number;
  max_time: number;
  stddev_time: number;
  rows: number;
}

interface ConnectionStats {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  max_connections: number;
  connection_utilization: number;
}

interface SlowQuery {
  query: string;
  duration: number;
  timestamp: string;
  user_name: string;
  database_name: string;
}

// 优化建议
interface OptimizationRecommendation {
  type: 'index' | 'query' | 'table' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  sql?: string;
  estimated_improvement: string;
}

class DatabaseOptimizerService {
  // 获取数据库性能指标
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      const [
        tableStats,
        indexUsage,
        queryPerformance,
        connectionStats,
        cacheHitRatio,
        slowQueries
      ] = await Promise.all([
        this.getTableStats(),
        this.getIndexUsage(),
        this.getQueryPerformance(),
        this.getConnectionStats(),
        this.getCacheHitRatio(),
        this.getSlowQueries()
      ]);

      return {
        tableStats,
        indexUsage,
        queryPerformance,
        connectionStats,
        cacheHitRatio,
        slowQueries
      };
    } catch (error) {
      console.error('获取数据库指标失败:', error);
      throw error;
    }
  }

  // 获取表统计信息
  private async getTableStats(): Promise<TableStats[]> {
    const { data, error } = await supabase.rpc('get_table_stats');
    
    if (error) {
      console.error('获取表统计信息失败:', error);
      return [];
    }

    return data || [];
  }

  // 获取索引使用情况
  private async getIndexUsage(): Promise<IndexUsage[]> {
    const { data, error } = await supabase.rpc('get_index_usage');
    
    if (error) {
      console.error('获取索引使用情况失败:', error);
      return [];
    }

    return data || [];
  }

  // 获取查询性能
  private async getQueryPerformance(): Promise<QueryPerformance[]> {
    const { data, error } = await supabase.rpc('get_query_performance');
    
    if (error) {
      console.error('获取查询性能失败:', error);
      return [];
    }

    return data || [];
  }

  // 获取连接统计
  private async getConnectionStats(): Promise<ConnectionStats> {
    const { data, error } = await supabase.rpc('get_connection_stats');
    
    if (error) {
      console.error('获取连接统计失败:', error);
      return {
        total_connections: 0,
        active_connections: 0,
        idle_connections: 0,
        max_connections: 100,
        connection_utilization: 0
      };
    }

    return data || {
      total_connections: 0,
      active_connections: 0,
      idle_connections: 0,
      max_connections: 100,
      connection_utilization: 0
    };
  }

  // 获取缓存命中率
  private async getCacheHitRatio(): Promise<number> {
    const { data, error } = await supabase.rpc('get_cache_hit_ratio');
    
    if (error) {
      console.error('获取缓存命中率失败:', error);
      return 0;
    }

    return data || 0;
  }

  // 获取慢查询
  private async getSlowQueries(): Promise<SlowQuery[]> {
    const { data, error } = await supabase.rpc('get_slow_queries');
    
    if (error) {
      console.error('获取慢查询失败:', error);
      return [];
    }

    return data || [];
  }

  // 生成优化建议
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const recommendations: OptimizationRecommendation[] = [];

      // 分析表统计信息
      recommendations.push(...this.analyzeTableStats(metrics.tableStats));

      // 分析索引使用情况
      recommendations.push(...this.analyzeIndexUsage(metrics.indexUsage));

      // 分析查询性能
      recommendations.push(...this.analyzeQueryPerformance(metrics.queryPerformance));

      // 分析缓存命中率
      recommendations.push(...this.analyzeCacheHitRatio(metrics.cacheHitRatio));

      // 分析慢查询
      recommendations.push(...this.analyzeSlowQueries(metrics.slowQueries));

      // 按优先级排序
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('生成优化建议失败:', error);
      return [];
    }
  }

  // 分析表统计信息
  private analyzeTableStats(tableStats: TableStats[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const table of tableStats) {
      // 检查是否需要VACUUM
      if (table.last_vacuum === null || 
          new Date(table.last_vacuum).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000) {
        recommendations.push({
          type: 'table',
          priority: 'medium',
          title: `表 ${table.table_name} 需要VACUUM`,
          description: `表 ${table.table_name} 超过7天未进行VACUUM操作，可能存在死元组影响性能`,
          impact: '提高查询性能，减少存储空间',
          sql: `VACUUM ANALYZE ${table.table_name};`,
          estimated_improvement: '查询性能提升5-15%'
        });
      }

      // 检查是否需要ANALYZE
      if (table.last_analyze === null || 
          new Date(table.last_analyze).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        recommendations.push({
          type: 'table',
          priority: 'low',
          title: `表 ${table.table_name} 需要ANALYZE`,
          description: `表 ${table.table_name} 统计信息过期，可能影响查询计划优化`,
          impact: '优化查询执行计划',
          sql: `ANALYZE ${table.table_name};`,
          estimated_improvement: '查询计划优化'
        });
      }

      // 检查顺序扫描比例
      const totalScans = table.seq_scan + table.idx_scan;
      if (totalScans > 0 && table.seq_scan / totalScans > 0.8 && table.row_count > 1000) {
        recommendations.push({
          type: 'index',
          priority: 'high',
          title: `表 ${table.table_name} 顺序扫描过多`,
          description: `表 ${table.table_name} 有${((table.seq_scan / totalScans) * 100).toFixed(1)}%的查询使用顺序扫描，建议添加索引`,
          impact: '大幅提高查询性能',
          estimated_improvement: '查询性能提升50-90%'
        });
      }
    }

    return recommendations;
  }

  // 分析索引使用情况
  private analyzeIndexUsage(indexUsage: IndexUsage[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const index of indexUsage) {
      // 检查未使用的索引
      if (index.index_scans === 0 && !index.is_unique) {
        recommendations.push({
          type: 'index',
          priority: 'medium',
          title: `删除未使用的索引 ${index.index_name}`,
          description: `索引 ${index.index_name} 从未被使用，占用存储空间 ${index.index_size}`,
          impact: '减少存储空间，提高写入性能',
          sql: `DROP INDEX IF EXISTS ${index.index_name};`,
          estimated_improvement: '写入性能提升5-10%'
        });
      }

      // 检查低效索引
      if (index.index_scans > 0 && index.usage_ratio < 0.1) {
        recommendations.push({
          type: 'index',
          priority: 'low',
          title: `索引 ${index.index_name} 使用率低`,
          description: `索引 ${index.index_name} 使用率仅为 ${(index.usage_ratio * 100).toFixed(1)}%，考虑优化或删除`,
          impact: '优化索引策略',
          estimated_improvement: '存储空间优化'
        });
      }
    }

    return recommendations;
  }

  // 分析查询性能
  private analyzeQueryPerformance(queryPerformance: QueryPerformance[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const query of queryPerformance) {
      // 检查慢查询
      if (query.mean_time > 1000) { // 超过1秒
        recommendations.push({
          type: 'query',
          priority: 'high',
          title: '优化慢查询',
          description: `查询平均执行时间 ${query.mean_time.toFixed(2)}ms，需要优化`,
          impact: '显著提高响应速度',
          estimated_improvement: '响应时间减少50-80%'
        });
      }

      // 检查高频查询
      if (query.calls > 10000 && query.mean_time > 100) {
        recommendations.push({
          type: 'query',
          priority: 'medium',
          title: '优化高频查询',
          description: `查询执行次数 ${query.calls} 次，平均时间 ${query.mean_time.toFixed(2)}ms，建议优化`,
          impact: '整体性能提升',
          estimated_improvement: '系统吞吐量提升20-40%'
        });
      }
    }

    return recommendations;
  }

  // 分析缓存命中率
  private analyzeCacheHitRatio(cacheHitRatio: number): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (cacheHitRatio < 0.95) { // 缓存命中率低于95%
      recommendations.push({
        type: 'configuration',
        priority: 'high',
        title: '提高缓存命中率',
        description: `当前缓存命中率为 ${(cacheHitRatio * 100).toFixed(2)}%，建议增加shared_buffers配置`,
        impact: '显著提高查询性能',
        estimated_improvement: '查询性能提升20-50%'
      });
    }

    return recommendations;
  }

  // 分析慢查询
  private analyzeSlowQueries(slowQueries: SlowQuery[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (slowQueries.length > 0) {
      recommendations.push({
        type: 'query',
        priority: 'high',
        title: `发现 ${slowQueries.length} 个慢查询`,
        description: '系统中存在执行时间过长的查询，需要优化',
        impact: '提高系统响应速度',
        estimated_improvement: '平均响应时间减少30-70%'
      });
    }

    return recommendations;
  }

  // 执行数据库优化
  async executeOptimization(recommendation: OptimizationRecommendation): Promise<{
    success: boolean;
    message: string;
    executionTime?: number;
  }> {
    if (!recommendation.sql) {
      return {
        success: false,
        message: '该建议不包含可执行的SQL语句'
      };
    }

    try {
      const startTime = Date.now();
      
      const { error } = await supabase.rpc('execute_sql', {
        sql_statement: recommendation.sql
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        return {
          success: false,
          message: `执行失败: ${error.message}`,
          executionTime
        };
      }

      return {
        success: true,
        message: '优化执行成功',
        executionTime
      };
    } catch (error) {
      return {
        success: false,
        message: `执行异常: ${error}`
      };
    }
  }

  // 批量执行优化
  async batchExecuteOptimizations(
    recommendations: OptimizationRecommendation[],
    onProgress?: (completed: number, total: number, current: OptimizationRecommendation) => void
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{
      recommendation: OptimizationRecommendation;
      result: { success: boolean; message: string; executionTime?: number };
    }>;
  }> {
    const results: Array<{
      recommendation: OptimizationRecommendation;
      result: { success: boolean; message: string; executionTime?: number };
    }> = [];

    let successful = 0;
    let failed = 0;

    for (let i = 0; i < recommendations.length; i++) {
      const recommendation = recommendations[i];
      
      if (onProgress) {
        onProgress(i, recommendations.length, recommendation);
      }

      const result = await this.executeOptimization(recommendation);
      
      results.push({ recommendation, result });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // 添加延迟避免过于频繁的操作
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (onProgress) {
      onProgress(recommendations.length, recommendations.length, recommendations[recommendations.length - 1]);
    }

    return { successful, failed, results };
  }

  // 获取数据库健康评分
  async getDatabaseHealthScore(): Promise<{
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    factors: Array<{
      name: string;
      score: number;
      weight: number;
      description: string;
    }>;
  }> {
    try {
      const metrics = await this.getDatabaseMetrics();
      
      const factors = [
        {
          name: '缓存命中率',
          score: Math.min(metrics.cacheHitRatio * 100, 100),
          weight: 0.3,
          description: '数据库缓存的有效性'
        },
        {
          name: '索引使用率',
          score: this.calculateIndexUsageScore(metrics.indexUsage),
          weight: 0.25,
          description: '索引的使用效率'
        },
        {
          name: '查询性能',
          score: this.calculateQueryPerformanceScore(metrics.queryPerformance),
          weight: 0.25,
          description: '查询执行效率'
        },
        {
          name: '表维护状态',
          score: this.calculateTableMaintenanceScore(metrics.tableStats),
          weight: 0.1,
          description: '表的维护状态'
        },
        {
          name: '连接使用率',
          score: Math.max(0, 100 - metrics.connectionStats.connection_utilization),
          weight: 0.1,
          description: '数据库连接的使用情况'
        }
      ];

      const totalScore = factors.reduce((sum, factor) => 
        sum + (factor.score * factor.weight), 0
      );

      let grade: 'A' | 'B' | 'C' | 'D' | 'F';
      if (totalScore >= 90) grade = 'A';
      else if (totalScore >= 80) grade = 'B';
      else if (totalScore >= 70) grade = 'C';
      else if (totalScore >= 60) grade = 'D';
      else grade = 'F';

      return {
        score: Math.round(totalScore),
        grade,
        factors
      };
    } catch (error) {
      console.error('获取数据库健康评分失败:', error);
      return {
        score: 0,
        grade: 'F',
        factors: []
      };
    }
  }

  // 计算索引使用率评分
  private calculateIndexUsageScore(indexUsage: IndexUsage[]): number {
    if (indexUsage.length === 0) return 100;

    const usedIndexes = indexUsage.filter(idx => idx.index_scans > 0 || idx.is_unique);
    return (usedIndexes.length / indexUsage.length) * 100;
  }

  // 计算查询性能评分
  private calculateQueryPerformanceScore(queryPerformance: QueryPerformance[]): number {
    if (queryPerformance.length === 0) return 100;

    const slowQueries = queryPerformance.filter(q => q.mean_time > 1000);
    const slowQueryRatio = slowQueries.length / queryPerformance.length;
    
    return Math.max(0, 100 - (slowQueryRatio * 100));
  }

  // 计算表维护状态评分
  private calculateTableMaintenanceScore(tableStats: TableStats[]): number {
    if (tableStats.length === 0) return 100;

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const wellMaintainedTables = tableStats.filter(table => {
      const lastVacuum = table.last_vacuum ? new Date(table.last_vacuum).getTime() : 0;
      const lastAnalyze = table.last_analyze ? new Date(table.last_analyze).getTime() : 0;
      
      return lastVacuum > weekAgo && lastAnalyze > weekAgo;
    });

    return (wellMaintainedTables.length / tableStats.length) * 100;
  }

  // 生成性能报告
  async generatePerformanceReport(): Promise<{
    summary: {
      healthScore: number;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      totalTables: number;
      totalIndexes: number;
      slowQueries: number;
      recommendations: number;
    };
    metrics: DatabaseMetrics;
    recommendations: OptimizationRecommendation[];
    healthFactors: Array<{
      name: string;
      score: number;
      weight: number;
      description: string;
    }>;
    generatedAt: string;
  }> {
    try {
      const [metrics, recommendations, healthData] = await Promise.all([
        this.getDatabaseMetrics(),
        this.generateOptimizationRecommendations(),
        this.getDatabaseHealthScore()
      ]);

      return {
        summary: {
          healthScore: healthData.score,
          grade: healthData.grade,
          totalTables: metrics.tableStats.length,
          totalIndexes: metrics.indexUsage.length,
          slowQueries: metrics.slowQueries.length,
          recommendations: recommendations.length
        },
        metrics,
        recommendations,
        healthFactors: healthData.factors,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('生成性能报告失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const databaseOptimizerService = new DatabaseOptimizerService();

// 导出类型
export type {
  DatabaseMetrics,
  TableStats,
  IndexUsage,
  QueryPerformance,
  ConnectionStats,
  SlowQuery,
  OptimizationRecommendation
};