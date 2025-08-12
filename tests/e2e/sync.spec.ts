import { test, expect } from '@playwright/test';

test.describe('数据同步和离线功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到系统
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('在线数据同步功能', async ({ page }) => {
    await page.goto('/settings/sync');
    
    // 检查同步状态
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();
    
    // 手动触发同步
    await page.click('[data-testid="manual-sync-button"]');
    
    // 验证同步进行中状态
    await expect(page.locator('[data-testid="sync-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-progress-bar"]')).toBeVisible();
    
    // 等待同步完成
    await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="sync-success-message"]')).toContainText('数据同步成功');
  });

  test('自动同步设置', async ({ page }) => {
    await page.goto('/settings/sync');
    
    // 启用自动同步
    await page.check('[data-testid="auto-sync-enabled"]');
    
    // 设置同步间隔
    await page.selectOption('[data-testid="sync-interval-select"]', '300'); // 5分钟
    
    // 保存设置
    await page.click('[data-testid="save-sync-settings"]');
    
    // 验证设置保存成功
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
    await expect(page.locator('[data-testid="auto-sync-status"]')).toContainText('自动同步已启用');
  });

  test('离线模式切换', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // 模拟网络断开
    await context.setOffline(true);
    
    // 验证离线模式提示
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('当前处于离线模式');
    
    // 验证离线功能可用
    await page.goto('/assets');
    await expect(page.locator('[data-testid="asset-list"]')).toBeVisible();
    
    // 恢复网络连接
    await context.setOffline(false);
    
    // 验证在线模式恢复
    await expect(page.locator('[data-testid="online-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-pending"]')).toBeVisible();
  });

  test('离线数据缓存', async ({ page, context }) => {
    await page.goto('/assets');
    
    // 确保数据已加载
    await expect(page.locator('[data-testid="asset-list"]')).toBeVisible();
    const assetCount = await page.locator('[data-testid="asset-item"]').count();
    
    // 切换到离线模式
    await context.setOffline(true);
    
    // 刷新页面，验证缓存数据可用
    await page.reload();
    await expect(page.locator('[data-testid="asset-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-item"]')).toHaveCount(assetCount);
    
    // 验证离线缓存提示
    await expect(page.locator('[data-testid="cached-data-indicator"]')).toBeVisible();
  });

  test('离线数据修改和同步', async ({ page, context }) => {
    await page.goto('/assets');
    
    // 切换到离线模式
    await context.setOffline(true);
    
    // 在离线模式下修改数据
    await page.click('[data-testid="edit-asset-button"]:first-child');
    await page.fill('[data-testid="asset-quantity-input"]', '200');
    await page.click('[data-testid="save-asset-button"]');
    
    // 验证离线修改成功
    await expect(page.locator('[data-testid="offline-change-saved"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-sync-indicator"]')).toBeVisible();
    
    // 恢复网络连接
    await context.setOffline(false);
    
    // 验证自动同步离线修改
    await expect(page.locator('[data-testid="sync-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-changes-synced"]')).toBeVisible({ timeout: 10000 });
  });

  test('同步冲突处理', async ({ page, browser }) => {
    // 第一个客户端修改数据
    await page.goto('/assets');
    await page.click('[data-testid="edit-asset-button"]:first-child');
    await page.fill('[data-testid="asset-quantity-input"]', '150');
    await page.click('[data-testid="save-asset-button"]');
    
    // 第二个客户端同时修改相同数据
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/auth/login');
    await page2.fill('[data-testid="email-input"]', 'test@example.com');
    await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page2.click('[data-testid="login-button"]');
    
    await page2.goto('/assets');
    await page2.click('[data-testid="edit-asset-button"]:first-child');
    await page2.fill('[data-testid="asset-quantity-input"]', '175');
    await page2.click('[data-testid="save-asset-button"]');
    
    // 验证冲突检测和解决
    await expect(page2.locator('[data-testid="sync-conflict-dialog"]')).toBeVisible();
    await expect(page2.locator('[data-testid="conflict-resolution-options"]')).toBeVisible();
    
    // 选择解决方案
    await page2.click('[data-testid="use-server-version"]');
    await expect(page2.locator('[data-testid="conflict-resolved"]')).toBeVisible();
  });

  test('增量同步功能', async ({ page }) => {
    await page.goto('/settings/sync');
    
    // 启用增量同步
    await page.check('[data-testid="incremental-sync-enabled"]');
    await page.click('[data-testid="save-sync-settings"]');
    
    // 添加新数据
    await page.goto('/assets');
    await page.click('[data-testid="add-asset-button"]');
    await page.fill('[data-testid="asset-name-input"]', '微软股票');
    await page.selectOption('[data-testid="asset-type-select"]', 'stock');
    await page.fill('[data-testid="asset-symbol-input"]', 'MSFT');
    await page.click('[data-testid="save-asset-button"]');
    
    // 触发增量同步
    await page.click('[data-testid="sync-button"]');
    
    // 验证只同步新增数据
    await expect(page.locator('[data-testid="incremental-sync-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-items-count"]')).toContainText('1 项更新');
  });

  test('同步历史记录', async ({ page }) => {
    await page.goto('/settings/sync');
    
    // 查看同步历史
    await page.click('[data-testid="sync-history-tab"]');
    
    // 验证同步历史列表
    await expect(page.locator('[data-testid="sync-history-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-history-item"]')).toHaveCount(5);
    
    // 查看同步详情
    await page.click('[data-testid="sync-history-item"]:first-child');
    await expect(page.locator('[data-testid="sync-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-detail-timestamp"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-detail-changes"]')).toBeVisible();
  });

  test('数据备份和恢复', async ({ page }) => {
    await page.goto('/settings/backup');
    
    // 创建数据备份
    await page.click('[data-testid="create-backup-button"]');
    await page.fill('[data-testid="backup-name-input"]', '测试备份_' + Date.now());
    await page.click('[data-testid="confirm-backup-button"]');
    
    // 验证备份创建成功
    await expect(page.locator('[data-testid="backup-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="backup-list"]')).toContainText('测试备份');
    
    // 测试数据恢复
    await page.click('[data-testid="restore-backup-button"]:first-child');
    await page.click('[data-testid="confirm-restore-button"]');
    
    // 验证恢复成功
    await expect(page.locator('[data-testid="restore-success"]')).toBeVisible();
  });

  test('同步错误处理', async ({ page }) => {
    await page.goto('/settings/sync');
    
    // 模拟同步错误（通过拦截网络请求）
    await page.route('**/api/sync', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '服务器错误' })
      });
    });
    
    // 触发同步
    await page.click('[data-testid="manual-sync-button"]');
    
    // 验证错误处理
    await expect(page.locator('[data-testid="sync-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-error-message"]')).toContainText('同步失败');
    await expect(page.locator('[data-testid="retry-sync-button"]')).toBeVisible();
    
    // 测试重试功能
    await page.unroute('**/api/sync');
    await page.click('[data-testid="retry-sync-button"]');
    await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible();
  });

  test('多设备同步状态', async ({ page, browser }) => {
    // 第一个设备
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('已同步');
    
    // 第二个设备
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    await page2.goto('/auth/login');
    await page2.fill('[data-testid="email-input"]', 'test@example.com');
    await page2.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page2.click('[data-testid="login-button"]');
    
    await page2.goto('/dashboard');
    
    // 在第二个设备上修改数据
    await page2.goto('/assets');
    await page2.click('[data-testid="add-asset-button"]');
    await page2.fill('[data-testid="asset-name-input"]', '谷歌股票');
    await page2.selectOption('[data-testid="asset-type-select"]', 'stock');
    await page2.click('[data-testid="save-asset-button"]');
    
    // 验证第一个设备收到同步通知
    await expect(page.locator('[data-testid="sync-notification"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="sync-notification"]')).toContainText('数据已更新');
  });

  test('离线队列管理', async ({ page, context }) => {
    await page.goto('/assets');
    
    // 切换到离线模式
    await context.setOffline(true);
    
    // 执行多个离线操作
    await page.click('[data-testid="add-asset-button"]');
    await page.fill('[data-testid="asset-name-input"]', '离线资产1');
    await page.selectOption('[data-testid="asset-type-select"]', 'stock');
    await page.click('[data-testid="save-asset-button"]');
    
    await page.click('[data-testid="add-asset-button"]');
    await page.fill('[data-testid="asset-name-input"]', '离线资产2');
    await page.selectOption('[data-testid="asset-type-select"]', 'bond');
    await page.click('[data-testid="save-asset-button"]');
    
    // 查看离线队列
    await page.goto('/settings/sync');
    await expect(page.locator('[data-testid="offline-queue"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(2);
    
    // 恢复网络并验证队列处理
    await context.setOffline(false);
    await expect(page.locator('[data-testid="queue-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-empty"]')).toBeVisible({ timeout: 15000 });
  });

  test('同步性能监控', async ({ page }) => {
    await page.goto('/settings/sync');
    
    // 查看同步性能统计
    await page.click('[data-testid="sync-performance-tab"]');
    
    // 验证性能指标显示
    await expect(page.locator('[data-testid="sync-speed-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-sync-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-success-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-transfer-volume"]')).toBeVisible();
    
    // 测试性能优化建议
    await expect(page.locator('[data-testid="performance-recommendations"]')).toBeVisible();
  });
});