import { test, expect } from '@playwright/test';

test.describe('UI CSS 进阶回归', () => {
  test('页面布局与边栏显示正常', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 检查页面是否正常加载
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查边栏是否存在（桌面端）
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 检查主内容区域是否存在
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // 检查边栏宽度是否正确
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeGreaterThan(200);

    // 检查主内容是否有正确的左边距（避免与边栏重叠）
    const mainBox = await main.boundingBox();
    expect(mainBox?.x).toBeGreaterThan(200);
  });

  test('暗黑模式切换正常', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 获取初始背景色
    const initialBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    
    // 切换到暗黑模式
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(100);
    
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    
    // 验证背景色发生了变化
    expect(initialBg).not.toBe(darkBg);
    expect(darkBg).not.toBe('rgba(0, 0, 0, 0)');
  });
});
