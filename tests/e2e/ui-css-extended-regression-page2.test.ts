import { test, expect } from '@playwright/test';

test.describe('UI CSS 进阶回归 - 页面扩展2', () => {
  test('全局变量在 Light 与 Dark 模式下存在且有值（综合测试）', async ({ page }) => {
    await page.goto('/login');
    // Light 模式下的变量
    const light = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    // 切换到 Dark 模式
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const dark = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    // 回到 Light 模式
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    const light2 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));

    expect(light).toBeTruthy();
    expect(dark).toBeTruthy();
    expect(light2).toBeTruthy();
    // 光暗模式变量都存在时，且在理论上可能有差异
    expect(light).not.toBeNull();
    expect(dark).not.toBeNull();
  });
});