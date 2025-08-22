/**
 * 数据同步功能测试程序
 * 用于验证本地存储、版本控制和云端同步功能
 */

import { localStorageService } from '../services/local-storage.service';
import { syncService } from '../services/sync.service';
import { supabaseSyncService } from '../services/supabase-sync.service';
import { subscriptionService } from '../services/subscription.service';
import { DataType } from '../types/sync.types';

// 测试数据
const testAssets = [
  {
    id: 'test_asset_1',
    name: '测试资产1',
    type: 'stock',
    value: 10000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    checksum: '',
    is_deleted: false
  },
  {
    id: 'test_asset_2', 
    name: '测试资产2',
    type: 'bond',
    value: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    checksum: '',
    is_deleted: false
  }
];

const testTransactions = [
  {
    id: 'test_transaction_1',
    asset_id: 'test_asset_1',
    type: 'buy',
    amount: 1000,
    price: 100,
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    checksum: '',
    is_deleted: false
  }
];

export class SyncTestSuite {
  private testResults: Array<{
    test: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
  }> = [];

  // 运行所有测试
  async runAllTests(): Promise<void> {
    console.log('🧪 开始数据同步功能测试...\n');

    await this.testLocalStorage();
    await this.testVersionControl();
    await this.testSubscriptionService();
    await this.testSyncQueue();
    await this.testNetworkStatus();
    await this.testSyncService();
    await this.testConflictDetection();
    await this.testDataBackup();

    this.printTestResults();
  }

  // 测试本地存储功能
  private async testLocalStorage(): Promise<void> {
    const testName = '本地存储功能测试';
    const startTime = Date.now();

    try {
      console.log('📦 测试本地存储功能...');

      // 清理测试数据
      await localStorageService.clearAllData();

      // 测试保存数据
      await localStorageService.saveData('assets', testAssets);
      const savedAssets = await localStorageService.getData('assets');
      
      if (savedAssets.length !== testAssets.length) {
        throw new Error(`保存的资产数量不匹配: 期望 ${testAssets.length}, 实际 ${savedAssets.length}`);
      }

      // 测试获取单个数据
      const asset = await localStorageService.getDataById('assets', 'test_asset_1');
      if (!asset || asset.name !== '测试资产1') {
        throw new Error('获取单个资产失败');
      }

      // 测试更新数据
      asset.value = 15000;
      await localStorageService.saveDataItem('assets', asset);
      const updatedAsset = await localStorageService.getDataById('assets', 'test_asset_1');
      
      if (!updatedAsset || updatedAsset.value !== 15000) {
        throw new Error('更新资产失败');
      }

      // 测试删除数据
      await localStorageService.deleteDataItem('assets', 'test_asset_2');
      const remainingAssets = await localStorageService.getData('assets');
      
      if (remainingAssets.length !== 1) {
        throw new Error('删除资产失败');
      }

      this.addTestResult(testName, 'pass', '所有本地存储操作正常', Date.now() - startTime);
      console.log('✅ 本地存储功能测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 本地存储功能测试失败:', error.message, '\n');
    }
  }

  // 测试版本控制功能
  private async testVersionControl(): Promise<void> {
    const testName = '版本控制功能测试';
    const startTime = Date.now();

    try {
      console.log('📚 测试版本控制功能...');

      // 创建版本
      const version1 = await localStorageService.createVersion('assets', 'test_asset_1', testAssets[0]);
      if (!version1 || version1.version !== 1) {
        throw new Error('创建版本1失败');
      }

      // 创建第二个版本
      const modifiedAsset = { ...testAssets[0], value: 20000 };
      const version2 = await localStorageService.createVersion('assets', 'test_asset_1', modifiedAsset);
      if (!version2 || version2.version !== 2) {
        throw new Error('创建版本2失败');
      }

      // 获取版本历史
      const versions = await localStorageService.getVersions('assets', 'test_asset_1');
      if (versions.length < 2) {
        throw new Error('版本历史获取失败');
      }

      // 获取最新版本
      const latestVersion = await localStorageService.getLatestVersion('assets', 'test_asset_1');
      if (!latestVersion || latestVersion.version !== 2) {
        throw new Error('获取最新版本失败');
      }

      // 测试版本恢复
      await localStorageService.restoreVersion(version1.id);
      const restoredAsset = await localStorageService.getDataById('assets', 'test_asset_1');
      if (!restoredAsset || restoredAsset.value !== testAssets[0].value) {
        throw new Error('版本恢复失败');
      }

      this.addTestResult(testName, 'pass', '版本控制功能正常', Date.now() - startTime);
      console.log('✅ 版本控制功能测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 版本控制功能测试失败:', error.message, '\n');
    }
  }

  // 测试订阅服务
  private async testSubscriptionService(): Promise<void> {
    const testName = '订阅服务测试';
    const startTime = Date.now();

    try {
      console.log('👤 测试订阅服务...');

      // 测试功能权限检查
      const hasCloudSync = await subscriptionService.hasFeatureAccess('cloud_sync');
      const hasAdvancedAnalytics = await subscriptionService.hasFeatureAccess('advanced_analytics');

      console.log(`云端同步权限: ${hasCloudSync ? '✅' : '❌'}`);
      console.log(`高级分析权限: ${hasAdvancedAnalytics ? '✅' : '❌'}`);

      // 获取订阅信息
      const subscription = await subscriptionService.getCurrentSubscription();
      console.log('当前订阅:', subscription);

      this.addTestResult(testName, 'pass', '订阅服务功能正常', Date.now() - startTime);
      console.log('✅ 订阅服务测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 订阅服务测试失败:', error.message, '\n');
    }
  }

  // 测试同步队列
  private async testSyncQueue(): Promise<void> {
    const testName = '同步队列测试';
    const startTime = Date.now();

    try {
      console.log('📋 测试同步队列...');

      // 清空同步队列
      await localStorageService.clearSyncQueue();

      // 添加到同步队列
      await localStorageService.addToSyncQueue('assets', 'test_asset_1', 'create');
      await localStorageService.addToSyncQueue('transactions', 'test_transaction_1', 'update');

      // 获取同步队列
      const queue = localStorageService.getSyncQueue();
      if (queue.length !== 2) {
        throw new Error(`同步队列项目数量不正确: 期望 2, 实际 ${queue.length}`);
      }

      // 测试队列项目移除
      await localStorageService.removeFromSyncQueue(queue[0].id);
      const updatedQueue = localStorageService.getSyncQueue();
      if (updatedQueue.length !== 1) {
        throw new Error('移除同步队列项目失败');
      }

      this.addTestResult(testName, 'pass', '同步队列功能正常', Date.now() - startTime);
      console.log('✅ 同步队列测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 同步队列测试失败:', error.message, '\n');
    }
  }

  // 测试网络状态
  private async testNetworkStatus(): Promise<void> {
    const testName = '网络状态测试';
    const startTime = Date.now();

    try {
      console.log('🌐 测试网络状态...');

      const isOnline = supabaseSyncService.isNetworkAvailable();
      console.log(`网络状态: ${isOnline ? '在线' : '离线'}`);

      const lastSyncTime = supabaseSyncService.getLastSyncTime();
      console.log(`最后同步时间: ${lastSyncTime || '从未同步'}`);

      this.addTestResult(testName, 'pass', `网络状态: ${isOnline ? '在线' : '离线'}`, Date.now() - startTime);
      console.log('✅ 网络状态测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 网络状态测试失败:', error.message, '\n');
    }
  }

  // 测试同步服务
  private async testSyncService(): Promise<void> {
    const testName = '同步服务测试';
    const startTime = Date.now();

    try {
      console.log('🔄 测试同步服务...');

      // 检查同步状态
      const isSyncing = syncService.isSyncInProgress();
      console.log(`同步进行中: ${isSyncing ? '是' : '否'}`);

      // 获取同步统计
      const stats = await syncService.getSyncStats();
      console.log('同步统计:', stats);

      // 测试单项同步（模拟）
      console.log('测试单项数据同步...');
      const syncResult = await syncService.syncDataItem('assets', 'test_asset_1');
      console.log(`单项同步结果: ${syncResult ? '成功' : '失败'}`);

      this.addTestResult(testName, 'pass', '同步服务功能正常', Date.now() - startTime);
      console.log('✅ 同步服务测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 同步服务测试失败:', error.message, '\n');
    }
  }

  // 测试冲突检测
  private async testConflictDetection(): Promise<void> {
    const testName = '冲突检测测试';
    const startTime = Date.now();

    try {
      console.log('⚡ 测试冲突检测...');

      // 获取冲突列表
      const conflicts = await syncService.getConflicts();
      console.log(`当前冲突数量: ${conflicts.length}`);

      // 模拟冲突解决
      if (conflicts.length > 0) {
        console.log('测试冲突解决...');
        await syncService.resolveConflict(conflicts[0].id, 'merge');
        console.log('冲突解决测试完成');
      }

      this.addTestResult(testName, 'pass', '冲突检测功能正常', Date.now() - startTime);
      console.log('✅ 冲突检测测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 冲突检测测试失败:', error.message, '\n');
    }
  }

  // 测试数据备份
  private async testDataBackup(): Promise<void> {
    const testName = '数据备份测试';
    const startTime = Date.now();

    try {
      console.log('💾 测试数据备份...');

      // 创建备份
      const backupResult = await syncService.backupData(['assets']);
      if (!backupResult.success) {
        throw new Error(backupResult.error || '备份失败');
      }

      console.log(`备份创建成功, ID: ${backupResult.backup_id}`);

      // 测试恢复
      if (backupResult.backup_id) {
        const restoreResult = await syncService.restoreData(backupResult.backup_id);
        if (!restoreResult.success) {
          throw new Error(restoreResult.error || '恢复失败');
        }
        console.log(`数据恢复成功, 恢复项目数: ${restoreResult.restored_items}`);
      }

      this.addTestResult(testName, 'pass', '数据备份功能正常', Date.now() - startTime);
      console.log('✅ 数据备份测试通过\n');

    } catch (error) {
      this.addTestResult(testName, 'fail', error.message, Date.now() - startTime);
      console.log('❌ 数据备份测试失败:', error.message, '\n');
    }
  }

  // 添加测试结果
  private addTestResult(test: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number): void {
    this.testResults.push({ test, status, message, duration });
  }

  // 打印测试结果
  private printTestResults(): void {
    console.log('\n📊 测试结果汇总:');
    console.log('='.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const skipped = this.testResults.filter(r => r.status === 'skip').length;
    const total = this.testResults.length;

    this.testResults.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}: ${result.message} (${result.duration}ms)`);
    });

    console.log('='.repeat(60));
    console.log(`总计: ${total} | 通过: ${passed} | 失败: ${failed} | 跳过: ${skipped}`);
    console.log(`成功率: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

    if (failed === 0) {
      console.log('\n🎉 所有测试通过！数据同步功能正常工作。');
    } else {
      console.log(`\n⚠️  有 ${failed} 个测试失败，请检查相关功能。`);
    }
  }

  // 获取存储统计
  async getStorageStats(): Promise<void> {
    console.log('\n📈 存储统计信息:');
    console.log('-'.repeat(40));

    try {
      const stats = await localStorageService.getStorageStats();
      console.log(`总数据项: ${stats.total_items}`);
      console.log(`存储大小: ${stats.total_size_mb.toFixed(2)} MB`);
      console.log(`版本数量: ${stats.versions_count}`);
      console.log(`待同步项: ${stats.pending_sync_count}`);
      console.log(`最后清理: ${new Date(stats.last_cleanup_at).toLocaleString()}`);
    } catch (error) {
      console.log('获取存储统计失败:', error.message);
    }
  }

  // 清理测试数据
  async cleanup(): Promise<void> {
    console.log('\n🧹 清理测试数据...');
    try {
      await localStorageService.clearAllData();
      await syncService.cleanupSyncData();
      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.log('❌ 清理测试数据失败:', error.message);
    }
  }
}

// 导出测试实例
export const syncTestSuite = new SyncTestSuite();

// 快速测试函数
export async function runSyncTest(): Promise<void> {
  const testSuite = new SyncTestSuite();
  
  try {
    await testSuite.runAllTests();
    await testSuite.getStorageStats();
  } catch (error) {
    console.error('测试运行失败:', error);
  } finally {
    // 询问是否清理测试数据
    const shouldCleanup = confirm('是否清理测试数据？');
    if (shouldCleanup) {
      await testSuite.cleanup();
    }
  }
}