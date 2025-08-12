import { test, expect } from '@playwright/test';

/**
 * 认证状态管理测试套件
 * 测试修复后的认证状态管理功能
 */
test.describe('认证状态管理测试', () => {
  // 每个测试前登录用户
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto('http://localhost:3000/login');
    
    // 填写登录表单
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航完成
    await page.waitForNavigation();
    
    // 验证已成功登录
    await expect(page.locator('.user-profile')).toBeVisible();
  });

  test('页面刷新后应保持登录状态', async ({ page }) => {
    // 验证当前已登录
    await expect(page.locator('.user-profile')).toBeVisible();
    
    // 刷新页面
    await page.reload();
    
    // 验证仍然保持登录状态
    await expect(page.locator('.user-profile')).toBeVisible();
    await expect(page.locator('h1')).toContainText('欢迎回来');
    
    // 验证用户信息正确
    const userName = await page.locator('.user-name').textContent();
    expect(userName).toContain('测试用户');
  });

  test('长时间不活动后应自动刷新令牌', async ({ page }) => {
    // 模拟令牌过期
    await page.evaluate(() => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      // 修改localStorage中的令牌
      const authData = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      if (authData && authData.currentSession) {
        authData.currentSession.access_token = expiredToken;
        authData.currentSession.expires_at = Math.floor(Date.now() / 1000) - 3600; // 过期1小时
        localStorage.setItem('supabase.auth.token', JSON.stringify(authData));
      }
    });
    
    // 尝试访问需要认证的页面
    await page.goto('http://localhost:3000/dashboard');
    
    // 验证自动刷新令牌并保持登录状态
    await expect(page.locator('.dashboard-title')).toBeVisible();
    
    // 验证API请求成功
    const response = await page.waitForResponse(response => 
      response.url().includes('/api/user/profile') && response.status() === 200
    );
    
    expect(response.ok()).toBeTruthy();
  });

  test('从本地存储恢复认证状态', async ({ page, context }) => {
    // 验证当前已登录
    await expect(page.locator('.user-profile')).toBeVisible();
    
    // 模拟关闭浏览器并重新打开
    const cookies = await context.cookies();
    await context.clearCookies();
    
    // 打开新页面
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3000/dashboard');
    
    // 验证从本地存储恢复认证状态
    await expect(newPage.locator('.user-profile')).toBeVisible();
    await expect(newPage.locator('.dashboard-title')).toBeVisible();
  });

  test('网络中断后恢复认证状态', async ({ page, context }) => {
    // 验证当前已登录
    await expect(page.locator('.user-profile')).toBeVisible();
    
    // 模拟网络中断
    await context.setOffline(true);
    
    // 等待一段时间
    await page.waitForTimeout(2000);
    
    // 恢复网络连接
    await context.setOffline(false);
    
    // 刷新页面
    await page.reload();
    
    // 验证恢复认证状态
    await expect(page.locator('.user-profile')).toBeVisible();
    await expect(page.locator('h1')).toContainText('欢迎回来');
  });
});