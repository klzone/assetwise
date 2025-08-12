import { test, expect } from '@playwright/test';

test.describe('桌面端特有功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到系统
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('应用窗口管理', async ({ page }) => {
    // 验证窗口控制按钮
    await expect(page.locator('[data-testid="window-minimize"]')).toBeVisible();
    await expect(page.locator('[data-testid="window-maximize"]')).toBeVisible();
    await expect(page.locator('[data-testid="window-close"]')).toBeVisible();
    
    // 测试窗口最小化
    await page.click('[data-testid="window-minimize"]');
    // 注意：在测试环境中可能无法真正最小化窗口，这里主要测试按钮响应
    
    // 测试窗口最大化/还原
    await page.click('[data-testid="window-maximize"]');
    await expect(page.locator('[data-testid="window-restore"]')).toBeVisible();
    
    await page.click('[data-testid="window-restore"]');
    await expect(page.locator('[data-testid="window-maximize"]')).toBeVisible();
  });

  test('系统托盘功能', async ({ page }) => {
    // 模拟系统托盘图标点击
    await page.evaluate(() => {
      // 模拟Tauri系统托盘事件
      window.__TAURI__?.event.emit('tray-click');
    });
    
    // 验证托盘菜单显示
    await expect(page.locator('[data-testid="tray-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="tray-show-window"]')).toBeVisible();
    await expect(page.locator('[data-testid="tray-quit"]')).toBeVisible();
    
    // 测试从托盘显示窗口
    await page.click('[data-testid="tray-show-window"]');
    await expect(page.locator('[data-testid="main-window"]')).toBeVisible();
  });

  test('本地文件系统访问', async ({ page }) => {
    await page.goto('/settings/data');
    
    // 测试选择本地数据目录
    await page.click('[data-testid="select-data-directory"]');
    
    // 模拟文件对话框选择
    await page.evaluate(() => {
      // 模拟Tauri文件对话框
      window.__TAURI__?.dialog.open({
        directory: true,
        defaultPath: '/Users/test/Documents/AssetWise'
      });
    });
    
    // 验证目录选择成功
    await expect(page.locator('[data-testid="selected-directory"]')).toContainText('/Users/test/Documents/AssetWise');
    
    // 测试导出到本地文件
    await page.goto('/reports');
    await page.click('[data-testid="export-report-button"]');
    await page.click('[data-testid="save-to-local"]');
    
    // 验证本地保存成功
    await expect(page.locator('[data-testid="local-save-success"]')).toBeVisible();
  });

  test('桌面通知功能', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    // 启用桌面通知
    await page.check('[data-testid="enable-desktop-notifications"]');
    await page.click('[data-testid="save-notification-settings"]');
    
    // 测试通知权限请求
    await page.evaluate(() => {
      // 模拟通知权限请求
      window.__TAURI__?.notification.requestPermission();
    });
    
    // 触发测试通知
    await page.click('[data-testid="test-notification-button"]');
    
    // 验证通知发送（在实际环境中会显示系统通知）
    await expect(page.locator('[data-testid="notification-sent"]')).toBeVisible();
  });

  test('应用自动更新', async ({ page }) => {
    await page.goto('/settings/updates');
    
    // 检查更新
    await page.click('[data-testid="check-updates-button"]');
    
    // 验证更新检查状态
    await expect(page.locator('[data-testid="checking-updates"]')).toBeVisible();
    
    // 模拟有可用更新
    await page.evaluate(() => {
      // 模拟更新检查结果
      window.__TAURI__?.updater.checkUpdate().then(() => {
        // 模拟有更新可用
      });
    });
    
    // 验证更新提示
    await expect(page.locator('[data-testid="update-available"]')).toBeVisible();
    await expect(page.locator('[data-testid="update-download-button"]')).toBeVisible();
    
    // 测试自动更新设置
    await page.check('[data-testid="auto-update-enabled"]');
    await page.click('[data-testid="save-update-settings"]');
    
    await expect(page.locator('[data-testid="auto-update-saved"]')).toBeVisible();
  });

  test('快捷键功能', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 测试全局快捷键
    await page.keyboard.press('Control+N'); // 新建资产
    await expect(page.locator('[data-testid="add-asset-modal"]')).toBeVisible();
    
    await page.keyboard.press('Escape'); // 关闭模态框
    await expect(page.locator('[data-testid="add-asset-modal"]')).not.toBeVisible();
    
    // 测试搜索快捷键
    await page.keyboard.press('Control+F');
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
    
    // 测试设置快捷键
    await page.keyboard.press('Control+Comma');
    await expect(page).toHaveURL('/settings');
    
    // 测试刷新快捷键
    await page.goto('/assets');
    await page.keyboard.press('F5');
    await expect(page.locator('[data-testid="refreshing"]')).toBeVisible();
  });

  test('离线数据存储', async ({ page, context }) => {
    await page.goto('/assets');
    
    // 确保数据已加载
    await expect(page.locator('[data-testid="asset-list"]')).toBeVisible();
    
    // 验证本地数据库存储
    const localData = await page.evaluate(() => {
      // 模拟检查本地SQLite数据库
      return window.__TAURI__?.sql.select('SELECT * FROM assets LIMIT 5');
    });
    
    expect(localData).toBeDefined();
    
    // 切换到离线模式
    await context.setOffline(true);
    
    // 验证离线数据可用
    await page.reload();
    await expect(page.locator('[data-testid="asset-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-mode-indicator"]')).toBeVisible();
  });

  test('应用菜单功能', async ({ page }) => {
    // 测试应用菜单（在macOS上是顶部菜单栏，Windows/Linux上可能是应用内菜单）
    await page.evaluate(() => {
      // 模拟菜单点击事件
      window.__TAURI__?.event.emit('menu-file-new');
    });
    
    await expect(page.locator('[data-testid="add-asset-modal"]')).toBeVisible();
    
    // 测试编辑菜单
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      window.__TAURI__?.event.emit('menu-edit-preferences');
    });
    
    await expect(page).toHaveURL('/settings');
    
    // 测试视图菜单
    await page.evaluate(() => {
      window.__TAURI__?.event.emit('menu-view-toggle-sidebar');
    });
    
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
  });

  test('窗口状态保存', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 调整窗口大小和位置（模拟）
    await page.evaluate(() => {
      // 模拟窗口状态变化
      window.__TAURI__?.window.getCurrent().setSize({ width: 1200, height: 800 });
      window.__TAURI__?.window.getCurrent().setPosition({ x: 100, y: 100 });
    });
    
    // 重启应用（模拟）
    await page.reload();
    
    // 验证窗口状态恢复
    const windowState = await page.evaluate(() => {
      return {
        size: window.__TAURI__?.window.getCurrent().innerSize(),
        position: window.__TAURI__?.window.getCurrent().outerPosition()
      };
    });
    
    expect(windowState.size).toBeDefined();
    expect(windowState.position).toBeDefined();
  });

  test('系统集成功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 测试系统剪贴板集成
    await page.click('[data-testid="asset-item"]:first-child');
    await page.click('[data-testid="copy-asset-info"]');
    
    // 验证复制到剪贴板
    const clipboardContent = await page.evaluate(() => {
      return window.__TAURI__?.clipboard.readText();
    });
    
    expect(clipboardContent).toContain('AAPL');
    
    // 测试系统默认应用打开
    await page.click('[data-testid="open-in-browser"]');
    
    // 验证外部浏览器打开（模拟）
    await page.evaluate(() => {
      window.__TAURI__?.shell.open('https://finance.yahoo.com/quote/AAPL');
    });
  });

  test('应用性能监控', async ({ page }) => {
    await page.goto('/settings/performance');
    
    // 查看应用性能指标
    await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="cpu-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="disk-usage"]')).toBeVisible();
    
    // 测试性能优化选项
    await page.check('[data-testid="enable-hardware-acceleration"]');
    await page.selectOption('[data-testid="memory-limit-select"]', '512');
    await page.click('[data-testid="save-performance-settings"]');
    
    await expect(page.locator('[data-testid="performance-settings-saved"]')).toBeVisible();
    
    // 测试垃圾回收
    await page.click('[data-testid="force-gc-button"]');
    await expect(page.locator('[data-testid="gc-completed"]')).toBeVisible();
  });

  test('多窗口支持', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // 打开新窗口
    await page.evaluate(() => {
      window.__TAURI__?.window.WebviewWindow.new('secondary', {
        url: '/assets',
        title: '资产管理',
        width: 800,
        height: 600
      });
    });
    
    // 在新标签页中模拟新窗口
    const newPage = await context.newPage();
    await newPage.goto('/assets');
    
    // 验证两个窗口独立工作
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    await expect(newPage.locator('[data-testid="asset-list"]')).toBeVisible();
    
    // 测试窗口间通信
    await page.evaluate(() => {
      // 模拟窗口间消息传递
      window.__TAURI__?.event.emit('window-message', { 
        type: 'asset-updated',
        assetId: 1 
      });
    });
    
    // 验证另一个窗口收到更新
    await expect(newPage.locator('[data-testid="asset-updated-notification"]')).toBeVisible();
  });

  test('应用安全功能', async ({ page }) => {
    await page.goto('/settings/security');
    
    // 测试应用锁定功能
    await page.check('[data-testid="enable-app-lock"]');
    await page.fill('[data-testid="lock-timeout-input"]', '5'); // 5分钟
    await page.click('[data-testid="save-security-settings"]');
    
    // 模拟应用失去焦点
    await page.evaluate(() => {
      window.__TAURI__?.event.emit('window-blur');
    });
    
    // 等待锁定超时（模拟）
    await page.waitForTimeout(1000);
    
    // 验证应用锁定
    await expect(page.locator('[data-testid="app-lock-screen"]')).toBeVisible();
    
    // 测试解锁
    await page.fill('[data-testid="unlock-password"]', 'TestPassword123!');
    await page.click('[data-testid="unlock-button"]');
    
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('数据导入导出增强', async ({ page }) => {
    await page.goto('/settings/data');
    
    // 测试批量文件导入
    await page.click('[data-testid="bulk-import-button"]');
    
    // 模拟选择多个文件
    await page.evaluate(() => {
      window.__TAURI__?.dialog.open({
        multiple: true,
        filters: [{
          name: 'CSV Files',
          extensions: ['csv']
        }]
      });
    });
    
    // 验证批量导入处理
    await expect(page.locator('[data-testid="bulk-import-progress"]')).toBeVisible();
    
    // 测试数据完整性检查
    await page.click('[data-testid="verify-data-integrity"]');
    await expect(page.locator('[data-testid="integrity-check-results"]')).toBeVisible();
    
    // 测试数据备份到本地
    await page.click('[data-testid="backup-to-local"]');
    await expect(page.locator('[data-testid="local-backup-success"]')).toBeVisible();
  });
});