// 云端同步调试脚本
// 在浏览器控制台中运行此脚本来测试云端下载功能

console.log('🚀 开始云端同步调试...');

// 测试用户ID（从数据库查询得到）
const TEST_USER_ID = '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37';

// 检查本地存储状态
function checkLocalStorage() {
    console.log('📊 检查本地存储状态...');
    
    const keys = [
        'assetwise_accounts',
        'assetwise_accounts_direct', 
        'assetwise_transactions',
        'assetwise_transactions_direct',
        'assetwise_reviews',
        'assetwise_reviews_direct',
        'assetwise_assets',
        'assetwise_investment_plans'
    ];
    
    const status = {};
    keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                status[key] = Array.isArray(parsed) ? parsed.length : 'exists';
            } catch (e) {
                status[key] = 'invalid';
            }
        } else {
            status[key] = 'empty';
        }
    });
    
    console.table(status);
    return status;
}

// 清空本地存储
function clearLocalStorage() {
    console.log('🗑️ 清空本地存储...');
    
    const keys = [
        'assetwise_accounts',
        'assetwise_accounts_direct', 
        'assetwise_transactions',
        'assetwise_transactions_direct',
        'assetwise_reviews',
        'assetwise_reviews_direct',
        'assetwise_assets',
        'assetwise_investment_plans'
    ];
    
    keys.forEach(key => {
        localStorage.removeItem(key);
    });
    
    console.log('✅ 本地存储已清空');
}

// 测试云端下载
async function testCloudDownload() {
    console.log('☁️ 开始测试云端下载...');
    
    try {
        // 动态导入服务
        const { unifiedDataService } = await import('/src/lib/services/unified-data.service.js');
        
        console.log('📦 服务导入成功');
        console.log('👤 使用用户ID:', TEST_USER_ID);
        
        // 执行云端下载
        const result = await unifiedDataService.syncFromCloud(TEST_USER_ID);
        
        if (result) {
            console.log('✅ 云端下载成功！');
            
            // 检查下载后的数据
            setTimeout(() => {
                console.log('📊 下载后的存储状态:');
                checkLocalStorage();
            }, 1000);
            
        } else {
            console.log('❌ 云端下载失败');
        }
        
        return result;
        
    } catch (error) {
        console.error('💥 云端下载异常:', error);
        return false;
    }
}

// 测试直接调用云端同步服务
async function testDirectCloudSync() {
    console.log('🔧 直接测试云端同步服务...');
    
    try {
        // 动态导入云端同步服务
        const { cloudSyncService } = await import('/src/lib/services/cloud-sync.service.js');
        
        console.log('📦 云端同步服务导入成功');
        
        // 直接调用pullFromCloud方法
        const result = await cloudSyncService.pullFromCloud(TEST_USER_ID);
        
        console.log('☁️ 云端数据获取结果:', result);
        
        return result;
        
    } catch (error) {
        console.error('💥 直接云端同步异常:', error);
        return null;
    }
}

// 主测试函数
async function runFullTest() {
    console.log('🎯 开始完整测试流程...');
    
    // 1. 检查初始状态
    console.log('\n1️⃣ 检查初始本地存储状态:');
    checkLocalStorage();
    
    // 2. 清空本地存储
    console.log('\n2️⃣ 清空本地存储:');
    clearLocalStorage();
    
    // 3. 验证清空后状态
    console.log('\n3️⃣ 验证清空后状态:');
    checkLocalStorage();
    
    // 4. 测试云端下载
    console.log('\n4️⃣ 测试云端下载:');
    const downloadResult = await testCloudDownload();
    
    // 5. 检查最终状态
    console.log('\n5️⃣ 检查最终状态:');
    setTimeout(() => {
        checkLocalStorage();
        
        if (downloadResult) {
            console.log('🎉 测试完成！云端下载功能正常工作。');
        } else {
            console.log('⚠️ 测试完成，但云端下载可能存在问题。');
        }
    }, 2000);
}

// 导出函数供控制台使用
window.debugCloudSync = {
    checkLocalStorage,
    clearLocalStorage,
    testCloudDownload,
    testDirectCloudSync,
    runFullTest,
    TEST_USER_ID
};

console.log('✅ 调试脚本加载完成！');
console.log('💡 使用方法:');
console.log('  - debugCloudSync.checkLocalStorage() - 检查本地存储');
console.log('  - debugCloudSync.clearLocalStorage() - 清空本地存储');
console.log('  - debugCloudSync.testCloudDownload() - 测试云端下载');
console.log('  - debugCloudSync.runFullTest() - 运行完整测试');
console.log('  - debugCloudSync.TEST_USER_ID - 测试用户ID');
