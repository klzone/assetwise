// 数据同步集成测试
import { supabase } from '@/lib/supabase';
import { SyncService } from '@/lib/services/sync.service';
import { SupabaseSyncService } from '@/lib/services/supabase-sync.service';

export interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
}

export class SyncIntegrationTest {
  private syncService: SyncService;
  private supabaseSyncService: SupabaseSyncService;
  private testResults: TestResult[] = [];

  constructor() {
    this.syncService = new SyncService();
    this.supabaseSyncService = new SupabaseSyncService();
  }

  // 运行所有集成测试
  async runAllTests(): Promise<TestSuite> {
    console.log('开始运行数据同步集成测试...');
    this.testResults = [];

    const tests = [
      { name: '数据库连接测试', fn: this.testDatabaseConnection },
      { name: '基本数据同步测试', fn: this.testBasicSync },
      { name: '离线数据队列测试', fn: this.testOfflineQueue },
      { name: '数据冲突解决测试', fn: this.testConflictResolution },
      { name: '实时同步测试', fn: this.testRealTimeSync },
      { name: '数据一致性检查测试', fn: this.testDataConsistency },
      { name: '错误处理测试', fn: this.testErrorHandling },
      { name: '性能压力测试', fn: this.testPerformance },
      { name: '网络中断恢复测试', fn: this.testNetworkRecovery },
      { name: '大数据量同步测试', fn: this.testLargeDataSync }
    ];

    for (const test of tests) {
      await this.runSingleTest(test.name, test.fn.bind(this));
    }

    return this.generateTestSuite();
  }

  // 运行单个测试
  private async runSingleTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`运行测试: ${testName}`);
      await testFn();
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        status: 'pass',
        duration,
        message: '测试通过'
      });
      
      console.log(`✅ ${testName} - 通过 (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : '未知错误';
      
      this.testResults.push({
        testName,
        status: 'fail',
        duration,
        message: `测试失败: ${message}`,
        details: error
      });
      
      console.error(`❌ ${testName} - 失败: ${message}`);
    }
  }

  // 测试数据库连接
  private async testDatabaseConnection(): Promise<void> {
    const { data, error } = await supabase
      .from('assets')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`数据库连接失败: ${error.message}`);
    }

    if (!data) {
      throw new Error('数据库连接返回空数据');
    }
  }

  // 测试基本数据同步
  private async testBasicSync(): Promise<void> {
    // 创建测试数据
    const testAsset = {
      id: `test_${Date.now()}`,
      name: '测试资产',
      value: 1000,
      category: '测试分类',
      description: '集成测试创建的资产'
    };

    // 本地创建
    await this.syncService.createAsset(testAsset);

    // 等待同步
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 验证云端数据
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', testAsset.id)
      .single();

    if (error) {
      throw new Error(`同步验证失败: ${error.message}`);
    }

    if (!data || data.name !== testAsset.name) {
      throw new Error('数据同步不一致');
    }

    // 清理测试数据
    await supabase.from('assets').delete().eq('id', testAsset.id);
  }

  // 测试离线数据队列
  private async testOfflineQueue(): Promise<void> {
    // 模拟离线状态
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    try {
      const testAsset = {
        id: `offline_test_${Date.now()}`,
        name: '离线测试资产',
        value: 2000,
        category: '离线测试'
      };

      // 离线时创建数据
      await this.syncService.createAsset(testAsset);

      // 检查是否加入队列
      const queueSize = await this.syncService.getQueueSize();
      if (queueSize === 0) {
        throw new Error('离线数据未加入同步队列');
      }

      // 恢复在线状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // 触发同步
      await this.syncService.syncPendingOperations();

      // 等待同步完成
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 验证数据已同步
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', testAsset.id)
        .single();

      if (error || !data) {
        throw new Error('离线数据同步失败');
      }

      // 清理测试数据
      await supabase.from('assets').delete().eq('id', testAsset.id);

    } finally {
      // 恢复原始网络状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      });
    }
  }

  // 测试数据冲突解决
  private async testConflictResolution(): Promise<void> {
    const testAsset = {
      id: `conflict_test_${Date.now()}`,
      name: '冲突测试资产',
      value: 3000,
      category: '冲突测试'
    };

    // 先在云端创建数据
    const { error: createError } = await supabase
      .from('assets')
      .insert(testAsset);

    if (createError) {
      throw new Error(`创建测试数据失败: ${createError.message}`);
    }

    // 本地修改数据
    const localUpdate = { ...testAsset, value: 3500, name: '本地修改' };
    await this.syncService.updateAsset(localUpdate);

    // 云端同时修改数据
    const { error: updateError } = await supabase
      .from('assets')
      .update({ value: 4000, name: '云端修改' })
      .eq('id', testAsset.id);

    if (updateError) {
      throw new Error(`云端更新失败: ${updateError.message}`);
    }

    // 触发同步，应该检测到冲突
    try {
      await this.syncService.syncPendingOperations();
      
      // 检查冲突是否被正确处理
      const conflicts = await this.syncService.getConflicts();
      const hasConflict = conflicts.some(c => c.recordId === testAsset.id);
      
      if (!hasConflict) {
        throw new Error('数据冲突未被检测到');
      }

    } finally {
      // 清理测试数据
      await supabase.from('assets').delete().eq('id', testAsset.id);
    }
  }

  // 测试实时同步
  private async testRealTimeSync(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const testAsset = {
        id: `realtime_test_${Date.now()}`,
        name: '实时同步测试',
        value: 5000,
        category: '实时测试'
      };

      let realtimeReceived = false;

      // 监听实时更新
      const subscription = supabase
        .channel('test_channel')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'assets',
            filter: `id=eq.${testAsset.id}`
          }, 
          (payload) => {
            console.log('收到实时更新:', payload);
            realtimeReceived = true;
          }
        )
        .subscribe();

      try {
        // 等待订阅建立
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 在云端插入数据
        const { error } = await supabase
          .from('assets')
          .insert(testAsset);

        if (error) {
          throw new Error(`插入测试数据失败: ${error.message}`);
        }

        // 等待实时通知
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (!realtimeReceived) {
          throw new Error('未收到实时同步通知');
        }

        resolve();

      } catch (error) {
        reject(error);
      } finally {
        // 清理
        subscription.unsubscribe();
        await supabase.from('assets').delete().eq('id', testAsset.id);
      }
    });
  }

  // 测试数据一致性检查
  private async testDataConsistency(): Promise<void> {
    const testAssets = [
      { id: `consistency_1_${Date.now()}`, name: '一致性测试1', value: 1000 },
      { id: `consistency_2_${Date.now()}`, name: '一致性测试2', value: 2000 },
      { id: `consistency_3_${Date.now()}`, name: '一致性测试3', value: 3000 }
    ];

    try {
      // 创建测试数据
      for (const asset of testAssets) {
        await this.syncService.createAsset(asset);
      }

      // 等待同步
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 执行一致性检查
      const inconsistencies = await this.supabaseSyncService.checkDataConsistency();

      // 验证一致性检查结果
      if (inconsistencies.length > 0) {
        console.warn('发现数据不一致:', inconsistencies);
      }

      // 检查特定测试数据的一致性
      for (const asset of testAssets) {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('id', asset.id)
          .single();

        if (error || !data) {
          throw new Error(`数据一致性检查失败: ${asset.id}`);
        }

        if (data.name !== asset.name || data.value !== asset.value) {
          throw new Error(`数据不一致: ${asset.id}`);
        }
      }

    } finally {
      // 清理测试数据
      for (const asset of testAssets) {
        await supabase.from('assets').delete().eq('id', asset.id);
      }
    }
  }

  // 测试错误处理
  private async testErrorHandling(): Promise<void> {
    // 测试无效数据处理
    try {
      await this.syncService.createAsset({
        id: '', // 无效ID
        name: '',
        value: -1
      });
      throw new Error('应该抛出验证错误');
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('验证')) {
        throw new Error('错误处理不正确');
      }
    }

    // 测试网络错误处理
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('网络错误'));

    try {
      await this.syncService.syncPendingOperations();
      // 应该优雅处理网络错误，不抛出异常
    } catch (error) {
      throw new Error('网络错误处理不当');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // 测试性能
  private async testPerformance(): Promise<void> {
    const batchSize = 100;
    const testAssets = Array.from({ length: batchSize }, (_, i) => ({
      id: `perf_test_${Date.now()}_${i}`,
      name: `性能测试资产${i}`,
      value: Math.random() * 10000,
      category: '性能测试'
    }));

    const startTime = Date.now();

    try {
      // 批量创建数据
      await Promise.all(
        testAssets.map(asset => this.syncService.createAsset(asset))
      );

      // 等待同步完成
      await new Promise(resolve => setTimeout(resolve, 5000));

      const duration = Date.now() - startTime;
      const throughput = batchSize / (duration / 1000);

      console.log(`性能测试结果: ${batchSize}条记录，耗时${duration}ms，吞吐量${throughput.toFixed(2)}条/秒`);

      // 验证性能标准
      if (throughput < 10) {
        throw new Error(`同步性能不达标: ${throughput.toFixed(2)}条/秒 < 10条/秒`);
      }

    } finally {
      // 清理测试数据
      await Promise.all(
        testAssets.map(asset => 
          supabase.from('assets').delete().eq('id', asset.id)
        )
      );
    }
  }

  // 测试网络中断恢复
  private async testNetworkRecovery(): Promise<void> {
    const testAsset = {
      id: `recovery_test_${Date.now()}`,
      name: '网络恢复测试',
      value: 6000,
      category: '恢复测试'
    };

    // 模拟网络中断
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    try {
      // 离线时创建数据
      await this.syncService.createAsset(testAsset);

      // 模拟网络恢复
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // 触发网络恢复事件
      window.dispatchEvent(new Event('online'));

      // 等待自动同步
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 验证数据已同步
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', testAsset.id)
        .single();

      if (error || !data) {
        throw new Error('网络恢复后数据同步失败');
      }

    } finally {
      // 恢复网络状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      });

      // 清理测试数据
      await supabase.from('assets').delete().eq('id', testAsset.id);
    }
  }

  // 测试大数据量同步
  private async testLargeDataSync(): Promise<void> {
    const largeDataSize = 1000;
    const testAssets = Array.from({ length: largeDataSize }, (_, i) => ({
      id: `large_test_${Date.now()}_${i}`,
      name: `大数据测试${i}`,
      value: Math.random() * 100000,
      category: '大数据测试',
      description: `这是第${i}个大数据测试资产，用于测试系统在处理大量数据时的性能表现`
    }));

    const startTime = Date.now();

    try {
      // 分批创建数据
      const batchSize = 50;
      for (let i = 0; i < testAssets.length; i += batchSize) {
        const batch = testAssets.slice(i, i + batchSize);
        await Promise.all(
          batch.map(asset => this.syncService.createAsset(asset))
        );
        
        // 短暂延迟避免过载
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 等待所有数据同步完成
      await new Promise(resolve => setTimeout(resolve, 10000));

      const duration = Date.now() - startTime;
      const throughput = largeDataSize / (duration / 1000);

      console.log(`大数据同步测试: ${largeDataSize}条记录，耗时${duration}ms，吞吐量${throughput.toFixed(2)}条/秒`);

      // 验证数据完整性
      const { data, error } = await supabase
        .from('assets')
        .select('id')
        .in('id', testAssets.map(a => a.id));

      if (error) {
        throw new Error(`大数据验证失败: ${error.message}`);
      }

      if (!data || data.length !== largeDataSize) {
        throw new Error(`数据同步不完整: 期望${largeDataSize}条，实际${data?.length || 0}条`);
      }

    } finally {
      // 清理测试数据
      console.log('清理大数据测试数据...');
      const batchSize = 100;
      for (let i = 0; i < testAssets.length; i += batchSize) {
        const batch = testAssets.slice(i, i + batchSize);
        await supabase
          .from('assets')
          .delete()
          .in('id', batch.map(a => a.id));
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // 生成测试套件报告
  private generateTestSuite(): TestSuite {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'pass').length;
    const failedTests = this.testResults.filter(r => r.status === 'fail').length;
    const skippedTests = this.testResults.filter(r => r.status === 'skip').length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      name: '数据同步集成测试套件',
      tests: this.testResults,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration
    };
  }

  // 生成测试报告
  generateReport(testSuite: TestSuite): string {
    const successRate = (testSuite.passedTests / testSuite.totalTests * 100).toFixed(1);
    
    let report = `
# 数据同步集成测试报告

## 测试概览
- 测试套件: ${testSuite.name}
- 总测试数: ${testSuite.totalTests}
- 通过: ${testSuite.passedTests}
- 失败: ${testSuite.failedTests}
- 跳过: ${testSuite.skippedTests}
- 成功率: ${successRate}%
- 总耗时: ${testSuite.totalDuration}ms

## 测试详情
`;

    testSuite.tests.forEach(test => {
      const status = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
      report += `
### ${status} ${test.testName}
- 状态: ${test.status}
- 耗时: ${test.duration}ms
- 消息: ${test.message}
`;
      
      if (test.details) {
        report += `- 详情: ${JSON.stringify(test.details, null, 2)}\n`;
      }
    });

    return report;
  }
}

// 导出测试实例
export const syncIntegrationTest = new SyncIntegrationTest();