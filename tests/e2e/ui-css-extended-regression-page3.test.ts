import { test, expect } from '@playwright/test';

test.describe('UI CSS 进阶回归 - 页面扩展 3', () => {
  test('全局变量在 Light 模式下存在且有值（资产页）', async ({ page }) => {
    await page.goto('/assets');
    const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(lightBg).toBeTruthy();
  });

  test('暗黑模式下背景变量存在且可用（仪表盘）', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const darkBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(darkBg).toBeTruthy();
  });
});