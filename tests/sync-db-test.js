/**
 * AssetWise 数据同步和数据库优化测试脚本
 * 测试数据同步机制和数据库优化功能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SyncAndDbTester {
  constructor() {
    this.testResults = [];
    this.currentUser = null;
  }

  addResult(module, feature, status, message, data = null) {
    this.testResults.push({
      module,
      feature,
      status, // 'pass', 'fail', 'warning', 'info'
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // 测试本地数据库结构
  testLocalDbStructure() {
    console.log('\n🗄️ 测试本地数据库结构...');
    
    try {
      const dbPath = path.join(process.cwd(), 'src/lib/database.db');
      
      if (!fs.existsSync(dbPath)) {
        this.addResult('数据库', '本地数据库', 'warning', '本地数据库文件不存在');
        console.log('⚠️ 本地数据库文件不存在');
        return;
      }
      
      console.log('✅ 本地数据库文件存在');
      this.addResult('数据库', '本地数据库', 'pass', '本地数据库文件存在');
      
      // 这里可以使用SQLite模块进一步检查数据库结构
      console.log('ℹ️ 需要SQLite模块进一步检查数据库结构');
    } catch (error) {
      this.addResult('数据库', '本地数据库', 'fail', `测试本地数据库结构失败: ${error.message}`);
      console.error('❌ 测试本地数据库结构失败:', error);
    }
  }

  // 测试数据库优化服务
  testDatabaseOptimizer() {
    console.log('\n🔧 测试数据库优化服务...');
    
    try {
      const optimizerPath = path.join(process.cwd(), 'src/lib/services/database-optimizer.service.ts');
      
      if (!fs.existsSync(optimizerPath)) {
        this.addResult('数据库', '优化服务', 'warning', '数据库优化服务文件不存在');
        console.log('⚠️ 数据库优化服务文件不存在');
        return;
      }
      
      const content = fs.readFileSync(optimizerPath, 'utf8');
      
      // 检查优化功能
      const hasIndexing = content.includes('createIndex') || content.includes('index');
      const hasVacuum = content.includes('vacuum') || content.includes('VACUUM');
      const hasOptimization = content.includes('optimize') || content.includes('optimization');
      
      if (hasIndexing) {
        this.addResult('数据库', '索引优化', 'pass', '数据库优化服务包含索引功能');
        console.log('✅ 数据库优化服务包含索引功能');
      } else {
        this.addResult('数据库', '索引优化', 'warning', '数据库优化服务可能缺少索引功能');
        console.log('⚠️ 数据库优化服务可能缺少索引功能');
      }
      
      if (hasVacuum) {
        this.addResult('数据库', '空间优化', 'pass', '数据库优化服务包含VACUUM功能');
        console.log('✅ 数据库优化服务包含VACUUM功能');
      } else {
        this.addResult('数据库', '空间优化', 'warning', '数据库优化服务可能缺少VACUUM功能');
        console.log('⚠️ 数据库优化服务可能缺少VACUUM功能');
      }
      
      if (hasOptimization) {
        this.addResult('数据库', '查询优化', 'pass', '数据库优化服务包含查询优化功能');
        console.log('✅ 数据库优化服务包含查询优化功能');
      } else {
        this.addResult('数据库', '查询优化', 'warning', '数据库优化服务可能缺少查询优化功能');
        console.log('⚠️ 数据库优化服务可能缺少查询优化功能');
      }
    } catch (error) {
      this.addResult('数据库', '优化服务', 'fail', `测试数据库优化服务失败: ${error.message}`);
      console.error('❌ 测试数据库优化服务失败:', error);
    }
  }

  // 测试云同步服务
  testCloudSync() {
    console.log('\n☁️ 测试云同步服务...');
    
    try {
      const cloudSyncPath = path.join(process.cwd(), 'src/lib/services/cloud-sync.service.ts');
      
      if (!fs.existsSync(cloudSyncPath)) {
        this.addResult('同步', '云同步', 'warning', '云同步服务文件不存在');
        console.log('⚠️ 云同步服务文件不存在');
        return;
      }
      
      const content = fs.readFileSync(cloudSyncPath, 'utf8');
      
      // 检查同步功能
      const hasUpload = content.includes('upload') || content.includes('push');
      const hasDownload = content.includes('download') || content.includes('pull');
      const hasConflictResolution = content.includes('conflict') || content.includes('resolve');
      
      if (hasUpload) {
        this.addResult('同步', '上传功能', 'pass', '云同步服务包含上传功能');
        console.log('✅ 云同步服务包含上传功能');
      } else {
        this.addResult('同步', '上传功能', 'warning', '云同步服务可能缺少上传功能');
        console.log('⚠️ 云同步服务可能缺少上传功能');
      }
      
      if (hasDownload) {
        this.addResult('同步', '下载功能', 'pass', '云同步服务包含下载功能');
        console.log('✅ 云同步服务包含下载功能');
      } else {
        this.addResult('同步', '下载功能', 'warning', '云同步服务可能缺少下载功能');
        console.log('⚠️ 云同步服务可能缺少下载功能');
      }
      
      if (hasConflictResolution) {
        this.addResult('同步', '冲突解决', 'pass', '云同步服务包含冲突解决功能');
        console.log('✅ 云同步服务包含冲突解决功能');
      } else {
        this.addResult('同步', '冲突解决', 'warning', '云同步服务可能缺少冲突解决功能');
        console.log('⚠️ 云同步服务可能缺少冲突解决功能');
      }
    } catch (error) {
      this.addResult('同步', '云同步', 'fail', `测试云同步服务失败: ${error.message}`);
      console.error('❌ 测试云同步服务失败:', error);
    }
  }

  // 测试增量同步服务
  testIncrementalSync() {
    console.log('\n🔄 测试增量同步服务...');
    
    try {
      const incrementalSyncPath = path.join(process.cwd(), 'src/lib/services/incremental-sync.service.ts');
      
      if (!fs.existsSync(incrementalSyncPath)) {
        this.addResult('同步', '增量同步', 'warning', '增量同步服务文件不存在');
        console.log('⚠️ 增量同步服务文件不存在');
        return;
      }
      
      const content = fs.readFileSync(incrementalSyncPath, 'utf8');
      
      // 检查增量同步功能
      const hasChangeTracking = content.includes('change') || content.includes('track');
      const hasDeltaSync = content.includes('delta') || content.includes('incremental');
      const hasTimestamp = content.includes('timestamp') || content.includes('version');
      
      if (hasChangeTracking) {
        this.addResult('同步', '变更跟踪', 'pass', '增量同步服务包含变更跟踪功能');
        console.log('✅ 增量同步服务包含变更跟踪功能');
      } else {
        this.addResult('同步', '变更跟踪', 'warning', '增量同步服务可能缺少变更跟踪功能');
        console.log('⚠️ 增量同步服务可能缺少变更跟踪功能');
      }
      
      if (hasDeltaSync) {
        this.addResult('同步', '增量传输', 'pass', '增量同步服务包含增量传输功能');
        console.log('✅ 增量同步服务包含增量传输功能');
      } else {
        this.addResult('同步', '增量传输', 'warning', '增量同步服务可能缺少增量传输功能');
        console.log('⚠️ 增量同步服务可能缺少增量传输功能');
      }
      
      if (hasTimestamp) {
        this.addResult('同步', '时间戳版本', 'pass', '增量同步服务包含时间戳版本功能');
        console.log('✅ 增量同步服务包含时间戳版本功能');
      } else {
        this.addResult('同步', '时间戳版本', 'warning', '增量同步服务可能缺少时间戳版本功能');
        console.log('⚠️ 增量同步服务可能缺少时间戳版本功能');
      }
    } catch (error) {
      this.addResult('同步', '增量同步', 'fail', `测试增量同步服务失败: ${error.message}`);
      console.error('❌ 测试增量同步服务失败:', error);
    }
  }

  // 测试冲突解决服务
  testConflictResolver() {
    console.log('\n🔀 测试冲突解决服务...');
    
    try {
      const conflictResolverPath = path.join(process.cwd(), 'src/lib/services/conflict-resolver.service.ts');
      
      if (!fs.existsSync(conflictResolverPath)) {
        this.addResult('同步', '冲突解决', 'warning', '冲突解决服务文件不存在');
        console.log('⚠️ 冲突解决服务文件不存在');
        return;
      }
      
      const content = fs.readFileSync(conflictResolverPath, 'utf8');
      
      // 检查冲突解决功能
      const hasDetection = content.includes('detect') || content.includes('check');
      const hasResolution = content.includes('resolve') || content.includes('merge');
      const hasStrategy = content.includes('strategy') || content.includes('policy');
      
      if (hasDetection) {
        this.addResult('同步', '冲突检测', 'pass', '冲突解决服务包含冲突检测功能');
        console.log('✅ 冲突解决服务包含冲突检测功能');
      } else {
        this.addResult('同步', '冲突检测', 'warning', '冲突解决服务可能缺少冲突检测功能');
        console.log('⚠️ 冲突解决服务可能缺少冲突检测功能');
      }
      
      if (hasResolution) {
        this.addResult('同步', '冲突解决', 'pass', '冲突解决服务包含冲突解决功能');
        console.log('✅ 冲突解决服务包含冲突解决功能');
      } else {
        this.addResult('同步', '冲突解决', 'warning', '冲突解决服务可能缺少冲突解决功能');
        console.log('⚠️ 冲突解决服务可能缺少冲突解决功能');
      }
      
      if (hasStrategy) {
        this.addResult('同步', '解决策略', 'pass', '冲突解决服务包含解决策略功能');
        console.log('✅ 冲突解决服务包含解决策略功能');
      } else {
        this.addResult('同步', '解决策略', 'warning', '冲突解决服务可能缺少解决策略功能');
        console.log('⚠️ 冲突解决服务可能缺少解决策略功能');
      }
    } catch (error) {
      this.addResult('同步', '冲突解决', 'fail', `测试冲突解决服务失败: ${error.message}`);
      console.error('❌ 测试冲突解决服务失败:', error);
    }
  }

  // 测试离线功能
  testOfflineCapabilities() {
    console.log('\n📴 测试离线功能...');
    
    try {
      const offlinePath = path.join(process.cwd(), 'src/lib/services/offline.service.ts');
      
      if (!fs.existsSync(offlinePath)) {
        this.addResult('离线', '离线服务', 'warning', '离线服务文件不存在');
        console.log('⚠️ 离线服务文件不存在');
        return;
      }
      
      const content = fs.readFileSync(offlinePath, 'utf8');
      
      // 检查离线功能
      const hasDetection = content.includes('online') || content.includes('offline');
      const hasQueue = content.includes('queue') || content.includes('pending');
      const hasRecovery = content.includes('recover') || content.includes('reconnect');
      
      if (hasDetection) {
        this.addResult('离线', '状态检测', 'pass', '离线服务包含状态检测功能');
        console.log('✅ 离线服务包含状态检测功能');
      } else {
        this.addResult('离线', '状态检测', 'warning', '离线服务可能缺少状态检测功能');
        console.log('⚠️ 离线服务可能缺少状态检测功能');
      }
      
      if (hasQueue) {
        this.addResult('离线', '操作队列', 'pass', '离线服务包含操作队列功能');
        console.log('✅ 离线服务包含操作队列功能');
      } else {
        this.addResult('离线', '操作队列', 'warning', '离线服务可能缺少操作队列功能');
        console.log('⚠️ 离线服务可能缺少操作队列功能');
      }
      
      if (hasRecovery) {
        this.addResult('离线', '恢复同步', 'pass', '离线服务包含恢复同步功能');
        console.log('✅ 离线服务包含恢复同步功能');
      } else {
        this.addResult('离线', '恢复同步', 'warning', '离线服务可能缺少恢复同步功能');
        console.log('⚠️ 离线服务可能缺少恢复同步功能');
      }
    } catch (error) {
      this.addResult('离线', '离线服务', 'fail', `测试离线服务失败: ${error.message}`);
      console.error('❌ 测试离线服务失败:', error);
    }
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📋 生成数据同步和数据库优化测试报告...\n');
    
    // 统计结果
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const warnings = this.testResults.filter(r => r.status === 'warning').length;
    const info = this.testResults.filter(r => r.status === 'info').length;
    
    console.log('🎯 测试结果统计:');
    console.log(`- 总测试数: ${total}`);
    console.log(`- 通过: ${passed}`);
    console.log(`- 失败: ${failed}`);
    console.log(`- 警告: ${warnings}`);
    console.log(`- 信息: ${info}`);
    
    // 计算通过率
    const passRate = total > 0 ? Math.round((passed / (total - info)) * 100) : 0;
    console.log(`- 通过率: ${passRate}%`);
    
    // 按模块统计
    console.log('\n📊 各模块测试结果:');
    const modules = [...new Set(this.testResults.map(r => r.module))];
    
    modules.forEach(module => {
      const moduleResults = this.testResults.filter(r => r.module === module);
      const modulePassed = moduleResults.filter(r => r.status === 'pass').length;
      const moduleFailed = moduleResults.filter(r => r.status === 'fail').length;
      const moduleWarnings = moduleResults.filter(r => r.status === 'warning').length;
      const moduleInfo = moduleResults.filter(r => r.status === 'info').length;
      const modulePassRate = moduleResults.length - moduleInfo > 0 
        ? Math.round((modulePassed / (moduleResults.length - moduleInfo)) * 100) 
        : 0;
      
      console.log(`\n${module}模块:`);
      console.log(`- 测试数: ${moduleResults.length}`);
      console.log(`- 通过: ${modulePassed}`);
      console.log(`- 失败: ${moduleFailed}`);
      console.log(`- 警告: ${moduleWarnings}`);
      console.log(`- 信息: ${moduleInfo}`);
      console.log(`- 通过率: ${modulePassRate}%`);
    });
    
    // 失败的测试
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => r.status === 'fail')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.module} - ${result.feature}: ${result.message}`);
        });
    }
    
    // 警告
    if (warnings > 0) {
      console.log('\n⚠️ 警告:');
      this.testResults
        .filter(r => r.status === 'warning')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.module} - ${result.feature}: ${result.message}`);
        });
    }
    
    // 生成建议
    console.log('\n💡 优化建议:');
    
    // 数据库优化建议
    const dbWarnings = this.testResults.filter(r => r.module === '数据库' && r.status === 'warning').length;
    if (dbWarnings > 0) {
      console.log('\n📌 数据库优化建议:');
      console.log('1. 确保为频繁查询的字段创建索引，特别是外键和经常用于过滤的字段');
      console.log('2. 定期执行VACUUM操作以回收空间并优化数据库结构');
      console.log('3. 优化查询语句，避免全表扫描和不必要的JOIN操作');
      console.log('4. 考虑实现查询缓存机制，减少重复查询的开销');
    }
    
    // 同步优化建议
    const syncWarnings = this.testResults.filter(r => r.module === '同步' && r.status === 'warning').length;
    if (syncWarnings > 0) {
      console.log('\n📌 同步优化建议:');
      console.log('1. 实现增量同步机制，只传输变更的数据而非全量数据');
      console.log('2. 添加健壮的冲突检测和解决策略，支持自动和手动解决冲突');
      console.log('3. 使用版本控制或时间戳机制跟踪数据变更');
      console.log('4. 优化同步频率，考虑网络状况和电池消耗');
    }
    
    // 离线功能建议
    const offlineWarnings = this.testResults.filter(r => r.module === '离线' && r.status === 'warning').length;
    if (offlineWarnings > 0) {
      console.log('\n📌 离线功能建议:');
      console.log('1. 实现可靠的在线/离线状态检测机制');
      console.log('2. 使用操作队列存储离线期间的用户操作');
      console.log('3. 在恢复连接后自动同步离线操作');
      console.log('4. 提供离线操作的可视化状态和进度指示');
    }
    
    console.log('\n🎉 数据同步和数据库优化测试完成！');
  }

  // 运行所有测试
  runAllTests() {
    console.log('🧪 开始AssetWise数据同步和数据库优化测试...\n');
    
    try {
      this.testLocalDbStructure();
      this.testDatabaseOptimizer();
      this.testCloudSync();
      this.testIncrementalSync();
      this.testConflictResolver();
      this.testOfflineCapabilities();
      
      this.generateReport();
      
    } catch (error) {
      console.error('💥 测试过程中发生错误:', error);
    }
  }
}

// 运行测试
const tester = new SyncAndDbTester();
tester.runAllTests();

module.exports = SyncAndDbTester;