#!/usr/bin/env node

/**
 * 清除AssetWise应用的所有本地数据
 * 包括localStorage、sessionStorage等
 */

console.log('🧹 开始清除AssetWise本地数据...');

// 模拟浏览器localStorage清理
const localStorageKeys = [
  'assetwise_accounts',
  'assetwise_transactions', 
  'assetwise_reviews',
  'assetwise_investment_plans',
  'assetwise_users',
  'assetwise_sync_queue',
  'assetwise_sync_queue_direct',
  'assetwise_last_sync',
  'demo-user',
  'test-user',
  'current-user',
  'auth-token',
  'user-preferences',
  'app-settings',
  'language-preference',
  'theme-preference'
];

console.log('📋 需要清除的localStorage键:');
localStorageKeys.forEach(key => {
  console.log(`  - ${key}`);
});

// 创建清理脚本内容
const clearScript = `
// AssetWise 本地数据清理脚本
console.log('🧹 清理AssetWise本地数据...');

const keysToRemove = ${JSON.stringify(localStorageKeys, null, 2)};

let removedCount = 0;
keysToRemove.forEach(key => {
  if (localStorage.getItem(key) !== null) {
    localStorage.removeItem(key);
    removedCount++;
    console.log('✅ 已清除:', key);
  }
});

// 清理sessionStorage
sessionStorage.clear();
console.log('✅ 已清除 sessionStorage');

// 清理IndexedDB（如果有）
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name && db.name.includes('assetwise')) {
        indexedDB.deleteDatabase(db.name);
        console.log('✅ 已清除 IndexedDB:', db.name);
      }
    });
  }).catch(err => {
    console.log('⚠️ IndexedDB清理失败:', err);
  });
}

console.log(\`🎉 本地数据清理完成！共清除 \${removedCount} 个localStorage项目\`);
console.log('🔄 请刷新页面以确保清理生效');
`;

console.log('\n📝 生成的清理脚本:');
console.log('='.repeat(50));
console.log(clearScript);
console.log('='.repeat(50));

console.log('\n📋 使用说明:');
console.log('1. 打开浏览器开发者工具 (F12)');
console.log('2. 切换到 Console 标签页');
console.log('3. 复制上面的脚本代码');
console.log('4. 粘贴到控制台并按回车执行');
console.log('5. 刷新页面');

console.log('\n✅ 清理脚本生成完成！');
