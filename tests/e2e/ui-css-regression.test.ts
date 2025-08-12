import { test, expect } from '@playwright/test';

test.describe('UI CSS 回归基线测试', () => {
  test('全局变量存在且有值', async ({ page }) => {
    await page.goto('/assets');
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background'));
    expect(bg).toBeTruthy();
  });

  test('全局边框变量应用到核心页面', async ({ page }) => {
    await page.goto('/dashboard');
    const border = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--border'));
    expect(border).toBeTruthy();
  });
});