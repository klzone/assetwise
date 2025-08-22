#!/usr/bin/env node

/**
 * 数据同步测试启动脚本
 * 用于在开发环境中快速运行同步功能测试
 */

import { syncIntegrationTest } from '../lib/tests/sync-integration-test';

async function main() {
  console.log('🚀 开始运行AssetWise数据同步集成测试...\n');

  try {
    // 运行所有测试
    const testSuite = await syncIntegrationTest.runAllTests();
    
    // 生成测试报告
    const report = syncIntegrationTest.generateReport(testSuite);
    
    // 输出测试结果摘要
    console.log('\n📊 测试结果摘要:');
    console.log(`总测试数: ${testSuite.totalTests}`);
    console.log(`✅ 通过: ${testSuite.passedTests}`);
    console.log(`❌ 失败: ${testSuite.failedTests}`);
    console.log(`⏭️ 跳过: ${testSuite.skippedTests}`);
    console.log(`🎯 成功率: ${((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(1)}%`);
    console.log(`⏱️ 总耗时: ${testSuite.totalDuration}ms`);
    
    // 保存测试报告
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'sync-test-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 测试报告已保存到: ${reportPath}`);
    
    // 根据测试结果设置退出码
    if (testSuite.failedTests > 0) {
      console.log('\n❌ 部分测试失败，请检查测试报告');
      process.exit(1);
    } else {
      console.log('\n✅ 所有测试通过！');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 测试运行失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

export { main };