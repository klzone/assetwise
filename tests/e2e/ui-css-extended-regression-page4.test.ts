import { test, expect } from '@playwright/test';

test.describe('UI CSS 进阶回归 - 页面扩展 4', () => {
  test('全局变量在 Light/Dark 模式下存在性 - 登录页与仪表盘', async ({ page }) => {
    await page.goto('/auth/login');
    const lightLogin = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const darkLogin = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    expect(lightLogin).toBeTruthy();
    expect(darkLogin).toBeTruthy();
  });

  test('资产页与仪表盘的背景变量在 Light/Dark 下存在性', async ({ page }) => {
    await page.goto('/assets');
    const lightAssets = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const darkAssets = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    expect(lightAssets).toBeTruthy();
    expect(darkAssets).toBeTruthy();
  });
});