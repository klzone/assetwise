import { test, expect } from '@playwright/test';

test.describe('UI CSS 跨浏览器回归 - 基线检查（简化版）', () => {
  test('登录页 Light/Dark 下全局变量存在性', async ({ page }) => {
    await page.goto('/auth/login');
const light = await page.evaluate(() => { const v = getComputedStyle(document.documentElement).getPropertyValue('--background'); return v || getComputedStyle(document.documentElement).getPropertyValue('--bg'); });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
const dark = await page.evaluate(() => { const v = getComputedStyle(document.documentElement).getPropertyValue('--background'); return v || getComputedStyle(document.documentElement).getPropertyValue('--bg'); });
    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();
  });

  test('资产页 Light/Dark 下全局变量存在性', async ({ page }) => {
    await page.goto('/assets');
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();
  });

  test('仪表盘 Light/Dark 下全局变量存在性', async ({ page }) => {
    await page.goto('/dashboard');
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    await page.evaluate(() => document.documentElement.classList.toggle('dark'));
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();
  });
});