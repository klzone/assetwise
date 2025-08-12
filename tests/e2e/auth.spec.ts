import { test, expect } from '@playwright/test';

test.describe('认证流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除本地存储和cookies
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('用户注册流程', async ({ page }) => {
    await page.goto('/auth/register');
    
    // 填写注册表单
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="name-input"]', '测试用户');
    
    // 提交注册
    await page.click('[data-testid="register-button"]');
    
    // 验证注册成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page).toHaveURL('/auth/verify-email');
  });

  test('用户登录流程', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 填写登录表单
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    
    // 提交登录
    await page.click('[data-testid="login-button"]');
    
    // 验证登录成功
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('密码重置流程', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // 填写邮箱
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    
    // 提交重置请求
    await page.click('[data-testid="reset-button"]');
    
    // 验证重置邮件发送成功
    await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible();
  });

  test('登录表单验证', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 测试空表单提交
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // 测试无效邮箱格式
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('邮箱格式不正确');
    
    // 测试密码长度验证
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('密码长度至少8位');
  });

  test('注册表单验证', async ({ page }) => {
    await page.goto('/auth/register');
    
    // 测试密码确认不匹配
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('密码确认不匹配');
    
    // 测试密码强度验证
    await page.fill('[data-testid="password-input"]', 'weak');
    await page.fill('[data-testid="confirm-password-input"]', 'weak');
    await page.click('[data-testid="register-button"]');
    
    await expect(page.locator('[data-testid="password-error"]')).toContainText('密码强度不足');
  });

  test('会话管理和自动登出', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // 测试手动登出
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('记住我功能', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 勾选记住我
    await page.check('[data-testid="remember-me-checkbox"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // 关闭浏览器重新打开，验证是否保持登录状态
    await page.context().close();
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();
    
    if (newPage) {
      await newPage.goto('/dashboard');
      await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();
    }
  });

  test('多设备登录检测', async ({ page, browser }) => {
    // 第一个设备登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // 模拟第二个设备登录
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/auth/login');
    await page2.fill('[data-testid="email-input"]', 'test@example.com');
    await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page2.click('[data-testid="login-button"]');
    
    // 验证多设备登录警告
    await expect(page2.locator('[data-testid="multi-device-warning"]')).toBeVisible();
  });

  test('账户锁定机制', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 连续输入错误密码
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
      await page.click('[data-testid="login-button"]');
      
      if (i < 4) {
        await expect(page.locator('[data-testid="login-error"]')).toContainText('用户名或密码错误');
      }
    }
    
    // 验证账户被锁定
    await expect(page.locator('[data-testid="account-locked"]')).toBeVisible();
    await expect(page.locator('[data-testid="account-locked"]')).toContainText('账户已被锁定');
  });

  test('社交登录集成', async ({ page }) => {
    await page.goto('/auth/login');
    
    // 测试Google登录按钮
    await expect(page.locator('[data-testid="google-login-button"]')).toBeVisible();
    
    // 点击Google登录（模拟）
    await page.click('[data-testid="google-login-button"]');
    
    // 验证重定向到Google OAuth
    await page.waitForURL(/accounts\.google\.com/);
  });

  test('邮箱验证流程', async ({ page }) => {
    // 模拟用户点击邮箱验证链接
    await page.goto('/auth/verify-email?token=mock-verification-token');
    
    // 验证邮箱验证成功
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="verification-success"]')).toContainText('邮箱验证成功');
    
    // 验证自动跳转到登录页面
    await expect(page).toHaveURL('/auth/login');
  });

  test('两步验证设置', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // 进入安全设置
    await page.goto('/settings/security');
    
    // 启用两步验证
    await page.click('[data-testid="enable-2fa-button"]');
    
    // 验证二维码显示
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    
    // 输入验证码
    await page.fill('[data-testid="verification-code-input"]', '123456');
    await page.click('[data-testid="verify-2fa-button"]');
    
    // 验证两步验证启用成功
    await expect(page.locator('[data-testid="2fa-enabled"]')).toBeVisible();
  });

  test('安全问题设置和验证', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // 进入安全设置
    await page.goto('/settings/security');
    
    // 设置安全问题
    await page.selectOption('[data-testid="security-question-1"]', '您的出生地是？');
    await page.fill('[data-testid="security-answer-1"]', '北京');
    
    await page.selectOption('[data-testid="security-question-2"]', '您的第一个宠物叫什么？');
    await page.fill('[data-testid="security-answer-2"]', '小白');
    
    await page.click('[data-testid="save-security-questions"]');
    
    // 验证保存成功
    await expect(page.locator('[data-testid="security-questions-saved"]')).toBeVisible();
  });
});