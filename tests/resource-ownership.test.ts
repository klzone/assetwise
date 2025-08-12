import { test, expect } from '@playwright/test';

/**
 * 资源所有权验证测试套件
 * 测试修复后的资源所有权验证功能
 */
test.describe('资源所有权验证测试', () => {
  // 测试用户A的凭据
  const userA = {
    email: 'user-a@example.com',
    password: 'SecurePassword123!',
    name: '用户A'
  };
  
  // 测试用户B的凭据
  const userB = {
    email: 'user-b@example.com',
    password: 'SecurePassword123!',
    name: '用户B'
  };
  
  // 测试资产ID
  let assetId: string;
  
  // 用户A登录并创建资产
  test('用户A应能创建资产', async ({ page }) => {
    // 访问登录页面
    await page.goto('http://localhost:3000/login');
    
    // 填写登录表单
    await page.fill('input[name="email"]', userA.email);
    await page.fill('input[name="password"]', userA.password);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航完成
    await page.waitForNavigation();
    
    // 验证已成功登录
    await expect(page.locator('.user-profile')).toBeVisible();
    
    // 访问资产创建页面
    await page.goto('http://localhost:3000/assets/new');
    
    // 填写资产表单
    await page.fill('input[name="name"]', '测试资产');
    await page.fill('textarea[name="description"]', '这是用户A创建的测试资产');
    await page.fill('input[name="value"]', '1000');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待创建完成并重定向到资产详情页
    await page.waitForNavigation();
    
    // 从URL中提取资产ID
    const url = page.url();
    assetId = url.split('/').pop() || '';
    
    // 验证资产创建成功
    await expect(page.locator('.asset-name')).toContainText('测试资产');
    await expect(page.locator('.asset-description')).toContainText('这是用户A创建的测试资产');
    
    console.log(`用户A创建的资产ID: ${assetId}`);
  });
  
  // 用户B尝试访问用户A的资产
  test('用户B不应能访问用户A的资产', async ({ page }) => {
    // 访问登录页面
    await page.goto('http://localhost:3000/login');
    
    // 填写登录表单
    await page.fill('input[name="email"]', userB.email);
    await page.fill('input[name="password"]', userB.password);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航完成
    await page.waitForNavigation();
    
    // 验证已成功登录
    await expect(page.locator('.user-profile')).toBeVisible();
    
    // 尝试直接访问用户A的资产
    await page.goto(`http://localhost:3000/assets/${assetId}`);
    
    // 验证访问被拒绝
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('无权访问');
    
    // 验证未显示资产详情
    await expect(page.locator('.asset-name')).not.toBeVisible();
  });
  
  // 用户B尝试通过API访问用户A的资产
  test('用户B不应能通过API访问用户A的资产', async ({ page, request }) => {
    // 访问登录页面
    await page.goto('http://localhost:3000/login');
    
    // 填写登录表单
    await page.fill('input[name="email"]', userB.email);
    await page.fill('input[name="password"]', userB.password);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航完成
    await page.waitForNavigation();
    
    // 获取认证令牌
    const token = await page.evaluate(() => {
      const authData = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      return authData.currentSession?.access_token || '';
    });
    
    // 使用API尝试获取用户A的资产
    const response = await request.get(`http://localhost:3000/api/assets/${assetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 验证API返回403错误
    expect(response.status()).toBe(403);
    
    // 验证错误消息
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('无权访问此资源');
  });
  
  // 用户A应能访问自己的资产
  test('用户A应能访问自己的资产', async ({ page }) => {
    // 访问登录页面
    await page.goto('http://localhost:3000/login');
    
    // 填写登录表单
    await page.fill('input[name="email"]', userA.email);
    await page.fill('input[name="password"]', userA.password);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航完成
    await page.waitForNavigation();
    
    // 访问自己的资产
    await page.goto(`http://localhost:3000/assets/${assetId}`);
    
    // 验证可以访问资产详情
    await expect(page.locator('.asset-name')).toBeVisible();
    await expect(page.locator('.asset-name')).toContainText('测试资产');
    await expect(page.locator('.asset-description')).toContainText('这是用户A创建的测试资产');
  });
});