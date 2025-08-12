import { test, expect } from '@playwright/test';

/**
 * CSRF保护测试套件
 * 测试修复后的CSRF保护功能
 */
test.describe('CSRF保护测试', () => {
  // 测试用户凭据
  const testUser = {
    email: 'csrf-test@example.com',
    password: 'SecurePassword123!',
    name: 'CSRF测试用户'
  };
  
  // 每个测试前登录用户
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto('http://localhost:3000/login');
    
    // 填写登录表单
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待导航完成
    await page.waitForNavigation();
    
    // 验证已成功登录
    await expect(page.locator('.user-profile')).toBeVisible();
  });

  test('正常请求应包含CSRF令牌', async ({ page }) => {
    // 访问资产创建页面
    await page.goto('http://localhost:3000/assets/new');
    
    // 开始监听网络请求
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/api/assets') && 
      request.method() === 'POST'
    );
    
    // 填写资产表单
    await page.fill('input[name="name"]', 'CSRF测试资产');
    await page.fill('textarea[name="description"]', '这是CSRF测试资产');
    await page.fill('input[name="value"]', '1000');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 获取请求
    const request = await requestPromise;
    
    // 验证请求包含CSRF令牌
    expect(request.headers()['x-csrf-token']).toBeDefined();
    expect(request.headers()['x-csrf-token'].length).toBeGreaterThan(10);
  });

  test('缺少CSRF令牌的请求应被拒绝', async ({ page, request }) => {
    // 获取认证令牌
    const token = await page.evaluate(() => {
      const authData = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      return authData.currentSession?.access_token || '';
    });
    
    // 不带CSRF令牌直接发送POST请求
    const response = await request.post('http://localhost:3000/api/assets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'CSRF测试资产',
        description: '这是CSRF测试资产',
        value: 1000
      }
    });
    
    // 验证请求被拒绝
    expect(response.status()).toBe(403);
    
    // 验证错误消息
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('CSRF令牌验证失败');
  });

  test('应能获取有效的CSRF令牌', async ({ page, request }) => {
    // 访问获取CSRF令牌的API
    const response = await request.get('http://localhost:3000/api/auth?action=csrf-token');
    
    // 验证响应成功
    expect(response.status()).toBe(200);
    
    // 验证返回了有效的CSRF令牌
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('token');
    expect(responseBody.token.length).toBeGreaterThan(10);
    
    // 验证设置了CSRF Cookie
    const cookies = await page.context().cookies();
    const csrfCookie = cookies.find(cookie => cookie.name === 'assetwise-csrf-token');
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie?.value.length).toBeGreaterThan(10);
  });

  test('使用有效CSRF令牌的请求应被接受', async ({ page, request }) => {
    // 获取认证令牌
    const token = await page.evaluate(() => {
      const authData = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      return authData.currentSession?.access_token || '';
    });
    
    // 获取CSRF令牌
    const csrfResponse = await request.get('http://localhost:3000/api/auth?action=csrf-token');
    const csrfToken = (await csrfResponse.json()).token;
    
    // 使用CSRF令牌发送POST请求
    const response = await request.post('http://localhost:3000/api/assets', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      data: {
        name: 'CSRF测试资产',
        description: '这是CSRF测试资产',
        value: 1000
      }
    });
    
    // 验证请求被接受
    expect(response.status()).toBe(201);
    
    // 验证资产创建成功
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('id');
    expect(responseBody).toHaveProperty('name', 'CSRF测试资产');
  });

  test('模拟CSRF攻击应被阻止', async ({ page, context }) => {
    // 创建模拟攻击页面
    const attackPage = await context.newPage();
    
    // 创建一个模拟的CSRF攻击页面
    await attackPage.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CSRF攻击模拟</title>
      </head>
      <body>
        <h1>CSRF攻击模拟</h1>
        <form id="csrf-form" action="http://localhost:3000/api/assets" method="POST">
          <input type="hidden" name="name" value="攻击资产">
          <input type="hidden" name="description" value="这是通过CSRF攻击创建的资产">
          <input type="hidden" name="value" value="9999">
        </form>
        <script>
          document.getElementById('csrf-form').submit();
        </script>
      </body>
      </html>
    `);
    
    // 等待表单提交
    const responsePromise = attackPage.waitForResponse(response => 
      response.url().includes('/api/assets') && 
      response.request().method() === 'POST'
    );
    
    // 获取响应
    const response = await responsePromise;
    
    // 验证攻击被阻止
    expect(response.status()).toBe(403);
    
    // 验证错误消息
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('CSRF令牌验证失败');
  });
});