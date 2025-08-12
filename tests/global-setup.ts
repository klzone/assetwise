import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始全局测试设置...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 等待应用启动
    console.log('⏳ 等待应用启动...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // 检查应用是否正常运行
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 30000 });
    console.log('✅ 应用启动成功');
    
    // 创建测试用户（如果需要）
    console.log('👤 创建测试用户...');
    await page.goto('http://localhost:3000/auth/register');
    
    // 检查是否已存在测试用户
    const userExists = await page.locator('[data-testid="user-exists"]').isVisible().catch(() => false);
    
    if (!userExists) {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="name-input"]', '测试用户');
      await page.click('[data-testid="register-button"]');
      
      // 等待注册完成
      await page.waitForSelector('[data-testid="registration-success"]', { timeout: 10000 });
      console.log('✅ 测试用户创建成功');
    } else {
      console.log('ℹ️ 测试用户已存在');
    }
    
    // 初始化测试数据
    console.log('📊 初始化测试数据...');
    await setupTestData(page);
    
    console.log('🎉 全局测试设置完成');
    
  } catch (error) {
    console.error('❌ 全局测试设置失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // 登录测试用户
  await page.goto('http://localhost:3000/auth/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'TestPassword123!');
  await page.click('[data-testid="login-button"]');
  
  await page.waitForURL('**/dashboard');
  
  // 创建测试资产数据
  const testAssets = [
    { name: '苹果股票', type: 'stock', symbol: 'AAPL', quantity: 100, price: 150.50 },
    { name: '微软股票', type: 'stock', symbol: 'MSFT', quantity: 50, price: 280.75 },
    { name: '国债基金', type: 'bond', symbol: 'TLT', quantity: 200, price: 95.25 },
  ];
  
  for (const asset of testAssets) {
    try {
      await page.goto('http://localhost:3000/assets');
      await page.click('[data-testid="add-asset-button"]');
      
      await page.fill('[data-testid="asset-name-input"]', asset.name);
      await page.selectOption('[data-testid="asset-type-select"]', asset.type);
      await page.fill('[data-testid="asset-symbol-input"]', asset.symbol);
      await page.fill('[data-testid="asset-quantity-input"]', asset.quantity.toString());
      await page.fill('[data-testid="asset-price-input"]', asset.price.toString());
      
      await page.click('[data-testid="save-asset-button"]');
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 5000 });
      
      console.log(`✅ 创建测试资产: ${asset.name}`);
    } catch (error) {
      console.log(`⚠️ 测试资产可能已存在: ${asset.name}`);
    }
  }
}

export default globalSetup;