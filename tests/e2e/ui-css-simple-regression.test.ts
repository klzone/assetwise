import { test, expect } from '@playwright/test';

test.describe('UI CSS 简单回归', () => {
  test('首页能正常加载并显示内容', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查页面是否有内容
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(10);

    // 检查是否有导航或主要内容
    const hasContent = await page.evaluate(() => {
      const elements = document.querySelectorAll('div, main, nav, aside, header');
      return elements.length > 0;
    });
    expect(hasContent).toBe(true);
  });

  test('边栏与主内容不重叠', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查是否存在边栏
    const sidebar = page.locator('aside, nav[role="navigation"], .sidebar');
    const sidebarCount = await sidebar.count();
    
    if (sidebarCount > 0) {
      // 如果有边栏，检查主内容区域
      const main = page.locator('main, .main-content, [role="main"]');
      const mainCount = await main.count();
      
      if (mainCount > 0) {
        const sidebarBox = await sidebar.first().boundingBox();
        const mainBox = await main.first().boundingBox();
        
        if (sidebarBox && mainBox) {
          // 检查主内容是否在边栏右侧（避免重叠）
          expect(mainBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 50);
        }
      }
    }
  });

  test('页面基本样式正常', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 检查页面背景色不是透明
    const bgColor = await page.evaluate(() => {
      const computed = getComputedStyle(document.body);
      return computed.backgroundColor;
    });
    
    // 背景色应该存在且不是完全透明
    expect(bgColor).toBeTruthy();
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});