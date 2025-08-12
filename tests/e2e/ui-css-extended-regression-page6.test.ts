import { test, expect } from '@playwright/test';

test.describe('UI CSS 进阶回归 - 页面扩展 6', () => {
  test('全局变量在 Light/Dark 模式下存在性 - 登录页', async ({ page }) => {
    await page.goto('/auth/login');
    const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const darkBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    // 断言存在且均有值
    expect(lightBg).toBeTruthy();
    expect(darkBg).toBeTruthy();
  });

  test('全局变量在 Light/Dark 模式下存在性 - 资产页', async ({ page }) => {
    await page.goto('/assets');
    const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const darkBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    expect(lightBg).toBeTruthy();
    expect(darkBg).toBeTruthy();
  });
});