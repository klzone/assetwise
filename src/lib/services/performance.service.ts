'use client';

export interface PerformanceMetrics {
  syncDuration: number;
  dataTransferred: number;
  conflictsDetected: number;
  conflictsResolved: number;
  networkLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
  deviceInfo: DeviceInfo;
  syncType: 'manual' | 'auto' | 'scheduled';
  success: boolean;
  errorCount: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;
  networkType: string;
  isOnline: boolean;
}

export interface SyncPerformanceReport {
  totalSyncs: number;
  successRate: number;
  avgSyncDuration: number;
  avgDataTransferred: number;
  avgNetworkLatency: number;
  peakMemoryUsage: number;
  totalConflicts: number;
  conflictResolutionRate: number;
  devicePerformance: Record<string, DevicePerformanceStats>;
  timeRangeStats: TimeRangeStats[];
  recommendations: PerformanceRecommendation[];
}

export interface DevicePerformanceStats {
  deviceId: string;
  deviceName: string;
  syncCount: number;
  avgDuration: number;
  successRate: number;
  avgLatency: number;
  lastSync: Date;
  issues: string[];
}

export interface TimeRangeStats {
  period: string;
  syncCount: number;
  avgDuration: number;
  successRate: number;
  dataVolume: number;
}

export interface PerformanceRecommendation {
  type: 'optimization' | 'warning' | 'error';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: string;
}

export interface SyncTestCase {
  id: string;
  name: string;
  description: string;
  dataSize: 'small' | 'medium' | 'large';
  conflictLevel: 'none' | 'low' | 'medium' | 'high';
  networkCondition: 'fast' | 'slow' | 'unstable';
  expectedDuration: number;
  maxAcceptableDuration: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private listeners: ((report: SyncPerformanceReport) => void)[] = [];
  private readonly STORAGE_KEY = 'assetwise_performance_metrics';
  private readonly MAX_METRICS = 1000; // 最多保存1000条记录

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadMetrics();
      this.startPerformanceMonitoring();
    }
  }

  private loadMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.metrics = parsed.map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        }));
      }
    } catch (error) {
      console.error('加载性能指标失败:', error);
    }
  }

  private saveMetrics(): void {
    try {
      // 只保存最新的记录
      const metricsToSave = this.metrics.slice(-this.MAX_METRICS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metricsToSave));
    } catch (error) {
      console.error('保存性能指标失败:', error);
    }
  }

  private startPerformanceMonitoring(): void {
    // 监控内存使用情况
    if ('memory' in performance) {
      setInterval(() => {
        this.updateSystemMetrics();
      }, 30000); // 每30秒更新一次
    }

    // 监控网络状态
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  private updateSystemMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      // 这里可以记录系统性能指标
    }
  }

  private handleNetworkChange(isOnline: boolean): void {
    // 网络状态变化时的处理
    console.log(`网络状态变化: ${isOnline ? '在线' : '离线'}`);
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      id: this.getDeviceId(),
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      os: this.getOS(),
      browser: this.getBrowser(),
      version: this.getBrowserVersion(),
      networkType: connection?.effectiveType || 'unknown',
      isOnline: navigator.onLine
    };
  }

  private getDeviceId(): string {
    // 生成或获取设备唯一标识
    let deviceId = localStorage.getItem('assetwise_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('assetwise_device_id', deviceId);
    }
    return deviceId;
  }

  private getDeviceName(): string {
    // 尝试获取设备名称
    return `${this.getBrowser()} on ${this.getOS()}`;
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Win') !== -1) return 'Windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('iOS') !== -1) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
    if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
    if (userAgent.indexOf('Safari') !== -1) return 'Safari';
    if (userAgent.indexOf('Edge') !== -1) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }

  private measureNetworkLatency(): Promise<number> {
    return new Promise((resolve) => {
      const start = performance.now();
      
      // 使用一个小的网络请求来测量延迟
      fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
        .then(() => {
          const latency = performance.now() - start;
          resolve(latency);
        })
        .catch(() => {
          resolve(-1); // 网络错误
        });
    });
  }

  public async recordSyncMetrics(
    syncDuration: number,
    dataTransferred: number,
    conflictsDetected: number,
    conflictsResolved: number,
    syncType: 'manual' | 'auto' | 'scheduled',
    success: boolean,
    errorCount: number = 0
  ): Promise<void> {
    const networkLatency = await this.measureNetworkLatency();
    const memoryUsage = this.getMemoryUsage();
    
    const metrics: PerformanceMetrics = {
      syncDuration,
      dataTransferred,
      conflictsDetected,
      conflictsResolved,
      networkLatency,
      memoryUsage,
      cpuUsage: 0, // CPU使用率在浏览器中难以准确测量
      timestamp: new Date(),
      deviceInfo: this.getDeviceInfo(),
      syncType,
      success,
      errorCount
    };

    this.metrics.push(metrics);
    this.saveMetrics();
    this.notifyListeners();
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private notifyListeners(): void {
    const report = this.generateReport();
    this.listeners.forEach(listener => listener(report));
  }

  public subscribe(listener: (report: SyncPerformanceReport) => void): () => void {
    this.listeners.push(listener);
    listener(this.generateReport());
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public generateReport(timeRange?: { start: Date; end: Date }): SyncPerformanceReport {
    let filteredMetrics = this.metrics;
    
    if (timeRange) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return this.getEmptyReport();
    }

    const totalSyncs = filteredMetrics.length;
    const successfulSyncs = filteredMetrics.filter(m => m.success).length;
    const successRate = (successfulSyncs / totalSyncs) * 100;

    const avgSyncDuration = filteredMetrics.reduce((sum, m) => sum + m.syncDuration, 0) / totalSyncs;
    const avgDataTransferred = filteredMetrics.reduce((sum, m) => sum + m.dataTransferred, 0) / totalSyncs;
    const avgNetworkLatency = filteredMetrics.filter(m => m.networkLatency > 0)
      .reduce((sum, m) => sum + m.networkLatency, 0) / filteredMetrics.filter(m => m.networkLatency > 0).length || 0;
    
    const peakMemoryUsage = Math.max(...filteredMetrics.map(m => m.memoryUsage));
    const totalConflicts = filteredMetrics.reduce((sum, m) => sum + m.conflictsDetected, 0);
    const totalResolved = filteredMetrics.reduce((sum, m) => sum + m.conflictsResolved, 0);
    const conflictResolutionRate = totalConflicts > 0 ? (totalResolved / totalConflicts) * 100 : 100;

    return {
      totalSyncs,
      successRate,
      avgSyncDuration,
      avgDataTransferred,
      avgNetworkLatency,
      peakMemoryUsage,
      totalConflicts,
      conflictResolutionRate,
      devicePerformance: this.generateDeviceStats(filteredMetrics),
      timeRangeStats: this.generateTimeRangeStats(filteredMetrics),
      recommendations: this.generateRecommendations(filteredMetrics)
    };
  }

  private getEmptyReport(): SyncPerformanceReport {
    return {
      totalSyncs: 0,
      successRate: 0,
      avgSyncDuration: 0,
      avgDataTransferred: 0,
      avgNetworkLatency: 0,
      peakMemoryUsage: 0,
      totalConflicts: 0,
      conflictResolutionRate: 0,
      devicePerformance: {},
      timeRangeStats: [],
      recommendations: []
    };
  }

  private generateDeviceStats(metrics: PerformanceMetrics[]): Record<string, DevicePerformanceStats> {
    const deviceStats: Record<string, DevicePerformanceStats> = {};

    metrics.forEach(metric => {
      const deviceId = metric.deviceInfo.id;
      
      if (!deviceStats[deviceId]) {
        deviceStats[deviceId] = {
          deviceId,
          deviceName: metric.deviceInfo.name,
          syncCount: 0,
          avgDuration: 0,
          successRate: 0,
          avgLatency: 0,
          lastSync: metric.timestamp,
          issues: []
        };
      }

      const stats = deviceStats[deviceId];
      stats.syncCount++;
      stats.avgDuration = (stats.avgDuration * (stats.syncCount - 1) + metric.syncDuration) / stats.syncCount;
      stats.avgLatency = (stats.avgLatency * (stats.syncCount - 1) + metric.networkLatency) / stats.syncCount;
      
      if (metric.timestamp > stats.lastSync) {
        stats.lastSync = metric.timestamp;
      }

      // 检测问题
      if (metric.syncDuration > 10000) { // 超过10秒
        stats.issues.push('同步时间过长');
      }
      if (metric.networkLatency > 1000) { // 超过1秒
        stats.issues.push('网络延迟高');
      }
      if (!metric.success) {
        stats.issues.push('同步失败');
      }
    });

    // 计算成功率
    Object.values(deviceStats).forEach(stats => {
      const deviceMetrics = metrics.filter(m => m.deviceInfo.id === stats.deviceId);
      const successfulSyncs = deviceMetrics.filter(m => m.success).length;
      stats.successRate = (successfulSyncs / deviceMetrics.length) * 100;
      stats.issues = [...new Set(stats.issues)]; // 去重
    });

    return deviceStats;
  }

  private generateTimeRangeStats(metrics: PerformanceMetrics[]): TimeRangeStats[] {
    const now = new Date();
    const ranges = [
      { name: '最近1小时', hours: 1 },
      { name: '最近6小时', hours: 6 },
      { name: '最近24小时', hours: 24 },
      { name: '最近7天', hours: 24 * 7 }
    ];

    return ranges.map(range => {
      const startTime = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
      const rangeMetrics = metrics.filter(m => m.timestamp >= startTime);
      
      const syncCount = rangeMetrics.length;
      const successfulSyncs = rangeMetrics.filter(m => m.success).length;
      const avgDuration = syncCount > 0 ? 
        rangeMetrics.reduce((sum, m) => sum + m.syncDuration, 0) / syncCount : 0;
      const successRate = syncCount > 0 ? (successfulSyncs / syncCount) * 100 : 0;
      const dataVolume = rangeMetrics.reduce((sum, m) => sum + m.dataTransferred, 0);

      return {
        period: range.name,
        syncCount,
        avgDuration,
        successRate,
        dataVolume
      };
    });
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    if (metrics.length === 0) return recommendations;

    const avgDuration = metrics.reduce((sum, m) => sum + m.syncDuration, 0) / metrics.length;
    const successRate = (metrics.filter(m => m.success).length / metrics.length) * 100;
    const avgLatency = metrics.filter(m => m.networkLatency > 0)
      .reduce((sum, m) => sum + m.networkLatency, 0) / metrics.filter(m => m.networkLatency > 0).length || 0;

    // 性能优化建议
    if (avgDuration > 5000) {
      recommendations.push({
        type: 'optimization',
        title: '同步时间过长',
        description: `平均同步时间为 ${(avgDuration / 1000).toFixed(1)} 秒，建议优化`,
        impact: 'high',
        action: '考虑减少单次同步的数据量或优化网络连接'
      });
    }

    if (successRate < 90) {
      recommendations.push({
        type: 'warning',
        title: '同步成功率偏低',
        description: `当前成功率为 ${successRate.toFixed(1)}%，需要关注`,
        impact: 'high',
        action: '检查网络连接稳定性和错误处理机制'
      });
    }

    if (avgLatency > 500) {
      recommendations.push({
        type: 'optimization',
        title: '网络延迟较高',
        description: `平均网络延迟为 ${avgLatency.toFixed(0)} 毫秒`,
        impact: 'medium',
        action: '考虑使用CDN或优化服务器位置'
      });
    }

    const conflictRate = metrics.reduce((sum, m) => sum + m.conflictsDetected, 0) / metrics.length;
    if (conflictRate > 2) {
      recommendations.push({
        type: 'warning',
        title: '冲突频率较高',
        description: `平均每次同步检测到 ${conflictRate.toFixed(1)} 个冲突`,
        impact: 'medium',
        action: '优化同步策略或增加冲突预防机制'
      });
    }

    return recommendations;
  }

  public getTestCases(): SyncTestCase[] {
    return [
      {
        id: 'small_data_fast_network',
        name: '小数据量 + 快速网络',
        description: '测试在理想条件下的同步性能',
        dataSize: 'small',
        conflictLevel: 'none',
        networkCondition: 'fast',
        expectedDuration: 1000,
        maxAcceptableDuration: 2000
      },
      {
        id: 'medium_data_normal_network',
        name: '中等数据量 + 正常网络',
        description: '测试日常使用场景的同步性能',
        dataSize: 'medium',
        conflictLevel: 'low',
        networkCondition: 'fast',
        expectedDuration: 3000,
        maxAcceptableDuration: 5000
      },
      {
        id: 'large_data_slow_network',
        name: '大数据量 + 慢速网络',
        description: '测试极端条件下的同步性能',
        dataSize: 'large',
        conflictLevel: 'medium',
        networkCondition: 'slow',
        expectedDuration: 10000,
        maxAcceptableDuration: 15000
      },
      {
        id: 'high_conflict_scenario',
        name: '高冲突场景',
        description: '测试大量冲突情况下的处理性能',
        dataSize: 'medium',
        conflictLevel: 'high',
        networkCondition: 'fast',
        expectedDuration: 5000,
        maxAcceptableDuration: 8000
      },
      {
        id: 'unstable_network',
        name: '不稳定网络',
        description: '测试网络不稳定情况下的同步表现',
        dataSize: 'small',
        conflictLevel: 'low',
        networkCondition: 'unstable',
        expectedDuration: 3000,
        maxAcceptableDuration: 10000
      }
    ];
  }

  public async runPerformanceTest(testCase: SyncTestCase): Promise<{
    success: boolean;
    duration: number;
    passed: boolean;
    details: string;
  }> {
    const startTime = performance.now();
    
    try {
      // 模拟同步过程
      await this.simulateSync(testCase);
      
      const duration = performance.now() - startTime;
      const passed = duration <= testCase.maxAcceptableDuration;
      
      // 记录测试结果
      await this.recordSyncMetrics(
        duration,
        this.getDataSizeBytes(testCase.dataSize),
        this.getConflictCount(testCase.conflictLevel),
        this.getConflictCount(testCase.conflictLevel),
        'manual',
        true,
        0
      );

      return {
        success: true,
        duration,
        passed,
        details: `测试完成，耗时 ${duration.toFixed(0)}ms，${passed ? '通过' : '未通过'}性能要求`
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      await this.recordSyncMetrics(
        duration,
        this.getDataSizeBytes(testCase.dataSize),
        this.getConflictCount(testCase.conflictLevel),
        0,
        'manual',
        false,
        1
      );

      return {
        success: false,
        duration,
        passed: false,
        details: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  private async simulateSync(testCase: SyncTestCase): Promise<void> {
    // 模拟网络延迟
    const networkDelay = this.getNetworkDelay(testCase.networkCondition);
    await new Promise(resolve => setTimeout(resolve, networkDelay));

    // 模拟数据处理时间
    const processingTime = this.getProcessingTime(testCase.dataSize);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // 模拟冲突处理时间
    const conflictTime = this.getConflictProcessingTime(testCase.conflictLevel);
    await new Promise(resolve => setTimeout(resolve, conflictTime));

    // 模拟网络不稳定
    if (testCase.networkCondition === 'unstable' && Math.random() < 0.3) {
      throw new Error('网络连接不稳定');
    }
  }

  private getNetworkDelay(condition: string): number {
    switch (condition) {
      case 'fast': return 50;
      case 'slow': return 500;
      case 'unstable': return 100 + Math.random() * 400;
      default: return 100;
    }
  }

  private getProcessingTime(dataSize: string): number {
    switch (dataSize) {
      case 'small': return 100;
      case 'medium': return 500;
      case 'large': return 2000;
      default: return 200;
    }
  }

  private getConflictProcessingTime(conflictLevel: string): number {
    switch (conflictLevel) {
      case 'none': return 0;
      case 'low': return 200;
      case 'medium': return 500;
      case 'high': return 1000;
      default: return 100;
    }
  }

  private getDataSizeBytes(dataSize: string): number {
    switch (dataSize) {
      case 'small': return 1024; // 1KB
      case 'medium': return 10240; // 10KB
      case 'large': return 102400; // 100KB
      default: return 5120; // 5KB
    }
  }

  private getConflictCount(conflictLevel: string): number {
    switch (conflictLevel) {
      case 'none': return 0;
      case 'low': return 1;
      case 'medium': return 3;
      case 'high': return 8;
      default: return 0;
    }
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.saveMetrics();
    this.notifyListeners();
  }

  public exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  public importMetrics(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      this.metrics = imported.map((metric: any) => ({
        ...metric,
        timestamp: new Date(metric.timestamp)
      }));
      this.saveMetrics();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('导入性能数据失败:', error);
      return false;
    }
  }
}

export const performanceService = new PerformanceService();