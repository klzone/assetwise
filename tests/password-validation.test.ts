import { test, expect } from '@playwright/test';

/**
 * 密码强度验证测试套件
 * 测试修复后的密码强度验证功能
 */
test.describe('密码强度验证测试', () => {
  // 访问注册页面
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('前端应拒绝弱密码', async ({ page }) => {
    // 填写注册表单，使用弱密码
    await page.fill('input[name="name"]', '测试用户');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', '123456'); // 弱密码
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 验证表单未提交，仍在注册页面
    await expect(page).toHaveURL(/\/register/);
    
    // 验证显示密码强度错误提示
    await expect(page.locator('.password-error')).toBeVisible();
    await expect(page.locator('.password-error')).toContainText('密码长度至少为8个字符');
  });

  test('前端应显示密码强度指示器', async ({ page }) => {
    // 输入不同强度的密码，验证强度指示器变化
    
    // 1. 空密码
    await page.fill('input[name="password"]', '');
    await expect(page.locator('.password-strength')).toHaveText('');
    
    // 2. 非常弱密码
    await page.fill('input[name="password"]', '123456');
    await expect(page.locator('.password-strength')).toContainText('非常弱');
    await expect(page.locator('.password-strength')).toHaveCSS('color', 'rgb(255, 77, 79)');
    
    // 3. 弱密码
    await page.fill('input[name="password"]', '12345678');
    await expect(page.locator('.password-strength')).toContainText('弱');
    await expect(page.locator('.password-strength')).toHaveCSS('color', 'rgb(255, 122, 69)');
    
    // 4. 中等强度密码
    await page.fill('input[name="password"]', '12345678Aa');
    await expect(page.locator('.password-strength')).toContainText('中等');
    await expect(page.locator('.password-strength')).toHaveCSS('color', 'rgb(255, 197, 61)');
    
    // 5. 强密码
    await page.fill('input[name="password"]', '12345678Aa!');
    await expect(page.locator('.password-strength')).toContainText('强');
    await expect(page.locator('.password-strength')).toHaveCSS('color', 'rgb(115, 209, 61)');
    
    // 6. 非常强密码
    await page.fill('input[name="password"]', 'C0mpl3x!P@ssw0rd123');
    await expect(page.locator('.password-strength')).toContainText('非常强');
    await expect(page.locator('.password-strength')).toHaveCSS('color', 'rgb(82, 196, 26)');
  });

  test('后端应拒绝弱密码', async ({ request }) => {
    // 直接调用注册API，尝试使用弱密码
    const response = await request.post('http://localhost:3000/api/auth', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'dummy-token' // 实际测试需要有效的CSRF令牌
      },
      data: {
        name: '测试用户',
        email: `test-${Date.now()}@example.com`,
        password: '123456' // 弱密码
      }
    });
    
    // 验证请求被拒绝
    expect(response.status()).toBe(400);
    
    // 验证错误消息
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('输入验证失败');
    expect(responseBody.details).toContain('密码长度至少为8个字符');
  });

  test('后端应拒绝常见密码', async ({ request }) => {
    // 获取CSRF令牌
    const csrfResponse = await request.get('http://localhost:3000/api/auth?action=csrf-token');
    const csrfToken = (await csrfResponse.json()).token;
    
    // 直接调用注册API，尝试使用常见密码
    const response = await request.post('http://localhost:3000/api/auth', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      data: {
        name: '测试用户',
        email: `test-${Date.now()}@example.com`,
        password: 'password123' // 常见密码
      }
    });
    
    // 验证请求被拒绝
    expect(response.status()).toBe(400);
    
    // 验证错误消息
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('输入验证失败');
    expect(responseBody.details).toContain('密码过于常见');
  });

  test('后端应接受强密码', async ({ request }) => {
    // 获取CSRF令牌
    const csrfResponse = await request.get('http://localhost:3000/api/auth?action=csrf-token');
    const csrfToken = (await csrfResponse.json()).token;
    
    // 生成随机邮箱，避免冲突
    const email = `test-${Date.now()}@example.com`;
    
    // 直接调用注册API，使用强密码
    const response = await request.post('http://localhost:3000/api/auth', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      data: {
        name: '测试用户',
        email: email,
        password: 'C0mpl3x!P@ssw0rd123' // 强密码
      }
    });
    
    // 验证请求被接受
    expect(response.status()).toBe(201);
    
    // 验证用户创建成功
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('id');
    expect(responseBody).toHaveProperty('email', email);
  });

  test('密码强度验证应检查多种规则', async ({ page }) => {
    // 测试各种密码规则
    
    // 1. 长度规则
    await page.fill('input[name="password"]', '123');
    await expect(page.locator('.password-error')).toContainText('密码长度至少为8个字符');
    
    // 2. 大写字母规则
    await page.fill('input[name="password"]', '12345678');
    await expect(page.locator('.password-error')).toContainText('密码必须包含至少一个大写字母');
    
    // 3. 小写字母规则
    await page.fill('input[name="password"]', '12345678A');
    await expect(page.locator('.password-error')).toContainText('密码必须包含至少一个小写字母');
    
    // 4. 数字规则
    await page.fill('input[name="password"]', 'ABCDEFGHij');
    await expect(page.locator('.password-error')).toContainText('密码必须包含至少一个数字');
    
    // 5. 特殊字符规则
    await page.fill('input[name="password"]', 'ABCDEFGHij123');
    await expect(page.locator('.password-error')).toContainText('密码必须包含至少一个特殊字符');
    
    // 6. 满足所有规则
    await page.fill('input[name="password"]', 'ABCDEFGHij123!');
    await expect(page.locator('.password-error')).not.toBeVisible();
  });
});