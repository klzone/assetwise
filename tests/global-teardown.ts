import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始全局测试清理...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 登录测试用户
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('**/dashboard');
    
    // 清理测试数据（可选）
    console.log('🗑️ 清理测试数据...');
    
    // 清理资产数据
    await page.goto('http://localhost:3000/assets');
    const assetItems = await page.locator('[data-testid="asset-item"]').count();
    
    if (assetItems > 0) {
      // 选择所有资产
      await page.check('[data-testid="select-all-assets"]');
      
      // 批量删除
      await page.click('[data-testid="bulk-delete-button"]');
      await page.click('[data-testid="confirm-bulk-delete-button"]');
      
      console.log('✅ 测试资产数据已清理');
    }
    
    // 清理交易记录
    await page.goto('http://localhost:3000/transactions');
    const transactionItems = await page.locator('[data-testid="transaction-item"]').count();
    
    if (transactionItems > 0) {
      await page.check('[data-testid="select-all-transactions"]');
      await page.click('[data-testid="bulk-delete-button"]');
      await page.click('[data-testid="confirm-bulk-delete-button"]');
      
      console.log('✅ 测试交易记录已清理');
    }
    
    // 登出用户
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    console.log('🎉 全局测试清理完成');
    
  } catch (error) {
    console.error('❌ 全局测试清理失败:', error);
    // 不抛出错误，避免影响测试结果
  } finally {
    await browser.close();
  }
}

export default globalTeardown;