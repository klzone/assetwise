/**
 * 测试运行脚本
 * 在浏览器控制台中运行同步功能测试
 */

import { runSyncTest, syncTestSuite } from './sync-test';

// 在浏览器控制台中可用的全局测试函数
declare global {
  interface Window {
    runSyncTest: () => Promise<void>;
    syncTestSuite: typeof syncTestSuite;
    testSync: {
      run: () => Promise<void>;
      cleanup: () => Promise<void>;
      stats: () => Promise<void>;
    };
  }
}

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.runSyncTest = runSyncTest;
  window.syncTestSuite = syncTestSuite;
  
  window.testSync = {
    // 运行完整测试
    run: async () => {
      console.log('🚀 启动数据同步功能测试...');
      await runSyncTest();
    },
    
    // 清理测试数据
    cleanup: async () => {
      console.log('🧹 清理测试数据...');
      await syncTestSuite.cleanup();
    },
    
    // 显示存储统计
    stats: async () => {
      console.log('📊 显示存储统计...');
      await syncTestSuite.getStorageStats();
    }
  };
  
  console.log(`
🧪 数据同步测试工具已加载！

使用方法:
- window.testSync.run()     // 运行完整测试
- window.testSync.cleanup() // 清理测试数据  
- window.testSync.stats()   // 显示存储统计
- window.runSyncTest()      // 快速测试
- window.syncTestSuite      // 访问测试套件

或者访问 /test-sync 页面进行可视化测试
  `);
}

export { runSyncTest, syncTestSuite };