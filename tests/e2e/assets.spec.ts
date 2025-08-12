import { test, expect } from '@playwright/test';

test.describe('资产管理测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到系统
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('添加新资产', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击添加资产按钮
    await page.click('[data-testid="add-asset-button"]');
    
    // 填写资产信息
    await page.fill('[data-testid="asset-name-input"]', '苹果股票');
    await page.selectOption('[data-testid="asset-type-select"]', 'stock');
    await page.fill('[data-testid="asset-symbol-input"]', 'AAPL');
    await page.fill('[data-testid="asset-quantity-input"]', '100');
    await page.fill('[data-testid="asset-price-input"]', '150.50');
    await page.fill('[data-testid="asset-purchase-date-input"]', '2024-01-15');
    
    // 提交表单
    await page.click('[data-testid="save-asset-button"]');
    
    // 验证资产添加成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-list"]')).toContainText('苹果股票');
  });

  test('编辑现有资产', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击编辑按钮
    await page.click('[data-testid="edit-asset-button"]:first-child');
    
    // 修改资产信息
    await page.fill('[data-testid="asset-quantity-input"]', '150');
    await page.fill('[data-testid="asset-price-input"]', '155.75');
    
    // 保存修改
    await page.click('[data-testid="save-asset-button"]');
    
    // 验证修改成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-quantity"]')).toContainText('150');
  });

  test('删除资产', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击删除按钮
    await page.click('[data-testid="delete-asset-button"]:first-child');
    
    // 确认删除
    await page.click('[data-testid="confirm-delete-button"]');
    
    // 验证删除成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('资产删除成功');
  });

  test('资产搜索功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 在搜索框中输入关键词
    await page.fill('[data-testid="asset-search-input"]', 'AAPL');
    
    // 验证搜索结果
    await expect(page.locator('[data-testid="asset-list"] [data-testid="asset-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="asset-list"]')).toContainText('AAPL');
    
    // 清空搜索
    await page.fill('[data-testid="asset-search-input"]', '');
    await expect(page.locator('[data-testid="asset-list"] [data-testid="asset-item"]')).toHaveCount(3);
  });

  test('资产筛选功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 按资产类型筛选
    await page.selectOption('[data-testid="asset-type-filter"]', 'stock');
    
    // 验证筛选结果
    const stockAssets = page.locator('[data-testid="asset-item"][data-asset-type="stock"]');
    await expect(stockAssets).toHaveCount(2);
    
    // 按价值范围筛选
    await page.fill('[data-testid="min-value-filter"]', '1000');
    await page.fill('[data-testid="max-value-filter"]', '20000');
    await page.click('[data-testid="apply-filter-button"]');
    
    // 验证价值范围筛选结果
    const filteredAssets = page.locator('[data-testid="asset-item"]');
    await expect(filteredAssets).toHaveCount(1);
  });

  test('资产排序功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 按价值降序排序
    await page.selectOption('[data-testid="sort-select"]', 'value-desc');
    
    // 验证排序结果
    const firstAssetValue = await page.locator('[data-testid="asset-item"]:first-child [data-testid="asset-value"]').textContent();
    const secondAssetValue = await page.locator('[data-testid="asset-item"]:nth-child(2) [data-testid="asset-value"]').textContent();
    
    const firstValue = parseFloat(firstAssetValue?.replace(/[^\d.]/g, '') || '0');
    const secondValue = parseFloat(secondAssetValue?.replace(/[^\d.]/g, '') || '0');
    
    expect(firstValue).toBeGreaterThanOrEqual(secondValue);
  });

  test('资产详情查看', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击资产名称查看详情
    await page.click('[data-testid="asset-name"]:first-child');
    
    // 验证详情页面
    await expect(page).toHaveURL(/\/assets\/\d+/);
    await expect(page.locator('[data-testid="asset-detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-detail-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-detail-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-price-chart"]')).toBeVisible();
  });

  test('批量操作功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 选择多个资产
    await page.check('[data-testid="asset-checkbox"]:first-child');
    await page.check('[data-testid="asset-checkbox"]:nth-child(2)');
    
    // 验证批量操作按钮显示
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    
    // 执行批量删除
    await page.click('[data-testid="bulk-delete-button"]');
    await page.click('[data-testid="confirm-bulk-delete-button"]');
    
    // 验证批量删除成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('批量删除成功');
  });

  test('资产导入功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击导入按钮
    await page.click('[data-testid="import-assets-button"]');
    
    // 上传CSV文件
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('tests/fixtures/assets.csv');
    
    // 确认导入
    await page.click('[data-testid="confirm-import-button"]');
    
    // 验证导入成功
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-success-message"]')).toContainText('成功导入 5 个资产');
  });

  test('资产导出功能', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击导出按钮
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-assets-button"]');
    
    // 选择导出格式
    await page.click('[data-testid="export-csv-button"]');
    
    // 验证文件下载
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('assets.csv');
  });

  test('资产价格更新', async ({ page }) => {
    await page.goto('/assets');
    
    // 点击刷新价格按钮
    await page.click('[data-testid="refresh-prices-button"]');
    
    // 验证价格更新中状态
    await expect(page.locator('[data-testid="price-updating"]')).toBeVisible();
    
    // 等待价格更新完成
    await expect(page.locator('[data-testid="price-updated"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="last-updated-time"]')).toBeVisible();
  });

  test('资产分组管理', async ({ page }) => {
    await page.goto('/assets');
    
    // 创建新分组
    await page.click('[data-testid="create-group-button"]');
    await page.fill('[data-testid="group-name-input"]', '科技股');
    await page.click('[data-testid="save-group-button"]');
    
    // 将资产添加到分组
    await page.dragAndDrop('[data-testid="asset-item"]:first-child', '[data-testid="group-科技股"]');
    
    // 验证资产分组成功
    await expect(page.locator('[data-testid="group-科技股"] [data-testid="asset-item"]')).toHaveCount(1);
  });

  test('资产性能分析', async ({ page }) => {
    await page.goto('/assets/1');
    
    // 查看性能图表
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    
    // 切换时间范围
    await page.click('[data-testid="time-range-1m"]');
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    
    await page.click('[data-testid="time-range-1y"]');
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    
    // 查看收益率
    await expect(page.locator('[data-testid="return-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-return"]')).toBeVisible();
  });

  test('资产警报设置', async ({ page }) => {
    await page.goto('/assets/1');
    
    // 设置价格警报
    await page.click('[data-testid="set-alert-button"]');
    await page.selectOption('[data-testid="alert-type-select"]', 'price');
    await page.selectOption('[data-testid="alert-condition-select"]', 'above');
    await page.fill('[data-testid="alert-value-input"]', '160');
    await page.click('[data-testid="save-alert-button"]');
    
    // 验证警报设置成功
    await expect(page.locator('[data-testid="alert-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-alerts"]')).toContainText('价格高于 $160');
  });

  test('资产历史记录', async ({ page }) => {
    await page.goto('/assets/1');
    
    // 查看历史记录标签
    await page.click('[data-testid="history-tab"]');
    
    // 验证历史记录显示
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-item"]')).toHaveCount(5);
    
    // 筛选历史记录
    await page.selectOption('[data-testid="history-filter"]', 'buy');
    await expect(page.locator('[data-testid="history-item"][data-action="buy"]')).toHaveCount(3);
  });
});