import { test, expect } from '@playwright/test';

test.describe('交易记录测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到系统
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('添加买入交易记录', async ({ page }) => {
    await page.goto('/transactions');
    
    // 点击添加交易按钮
    await page.click('[data-testid="add-transaction-button"]');
    
    // 填写买入交易信息
    await page.selectOption('[data-testid="transaction-type-select"]', 'buy');
    await page.selectOption('[data-testid="asset-select"]', 'AAPL');
    await page.fill('[data-testid="quantity-input"]', '50');
    await page.fill('[data-testid="price-input"]', '150.25');
    await page.fill('[data-testid="transaction-date-input"]', '2024-01-20');
    await page.fill('[data-testid="fees-input"]', '9.99');
    await page.fill('[data-testid="notes-input"]', '定期投资计划');
    
    // 提交表单
    await page.click('[data-testid="save-transaction-button"]');
    
    // 验证交易添加成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('买入');
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('AAPL');
  });

  test('添加卖出交易记录', async ({ page }) => {
    await page.goto('/transactions');
    
    // 点击添加交易按钮
    await page.click('[data-testid="add-transaction-button"]');
    
    // 填写卖出交易信息
    await page.selectOption('[data-testid="transaction-type-select"]', 'sell');
    await page.selectOption('[data-testid="asset-select"]', 'AAPL');
    await page.fill('[data-testid="quantity-input"]', '25');
    await page.fill('[data-testid="price-input"]', '155.75');
    await page.fill('[data-testid="transaction-date-input"]', '2024-02-15');
    await page.fill('[data-testid="fees-input"]', '9.99');
    
    // 提交表单
    await page.click('[data-testid="save-transaction-button"]');
    
    // 验证交易添加成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('卖出');
  });

  test('编辑交易记录', async ({ page }) => {
    await page.goto('/transactions');
    
    // 点击编辑按钮
    await page.click('[data-testid="edit-transaction-button"]:first-child');
    
    // 修改交易信息
    await page.fill('[data-testid="quantity-input"]', '60');
    await page.fill('[data-testid="price-input"]', '152.00');
    await page.fill('[data-testid="notes-input"]', '修改后的备注');
    
    // 保存修改
    await page.click('[data-testid="save-transaction-button"]');
    
    // 验证修改成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-quantity"]')).toContainText('60');
  });

  test('删除交易记录', async ({ page }) => {
    await page.goto('/transactions');
    
    // 点击删除按钮
    await page.click('[data-testid="delete-transaction-button"]:first-child');
    
    // 确认删除
    await page.click('[data-testid="confirm-delete-button"]');
    
    // 验证删除成功
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('交易记录删除成功');
  });

  test('交易记录搜索功能', async ({ page }) => {
    await page.goto('/transactions');
    
    // 按资产代码搜索
    await page.fill('[data-testid="transaction-search-input"]', 'AAPL');
    
    // 验证搜索结果
    const searchResults = page.locator('[data-testid="transaction-item"]');
    await expect(searchResults).toHaveCount(2);
    await expect(page.locator('[data-testid="transaction-list"]')).toContainText('AAPL');
    
    // 清空搜索
    await page.fill('[data-testid="transaction-search-input"]', '');
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(5);
  });

  test('交易记录筛选功能', async ({ page }) => {
    await page.goto('/transactions');
    
    // 按交易类型筛选
    await page.selectOption('[data-testid="transaction-type-filter"]', 'buy');
    
    // 验证筛选结果
    const buyTransactions = page.locator('[data-testid="transaction-item"][data-type="buy"]');
    await expect(buyTransactions).toHaveCount(3);
    
    // 按日期范围筛选
    await page.fill('[data-testid="start-date-filter"]', '2024-01-01');
    await page.fill('[data-testid="end-date-filter"]', '2024-01-31');
    await page.click('[data-testid="apply-filter-button"]');
    
    // 验证日期筛选结果
    const filteredTransactions = page.locator('[data-testid="transaction-item"]');
    await expect(filteredTransactions).toHaveCount(2);
  });

  test('交易记录排序功能', async ({ page }) => {
    await page.goto('/transactions');
    
    // 按日期降序排序
    await page.selectOption('[data-testid="sort-select"]', 'date-desc');
    
    // 验证排序结果
    const firstTransactionDate = await page.locator('[data-testid="transaction-item"]:first-child [data-testid="transaction-date"]').textContent();
    const secondTransactionDate = await page.locator('[data-testid="transaction-item"]:nth-child(2) [data-testid="transaction-date"]').textContent();
    
    const firstDate = new Date(firstTransactionDate || '');
    const secondDate = new Date(secondTransactionDate || '');
    
    expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
  });

  test('交易记录详情查看', async ({ page }) => {
    await page.goto('/transactions');
    
    // 点击交易记录查看详情
    await page.click('[data-testid="transaction-item"]:first-child');
    
    // 验证详情弹窗
    await expect(page.locator('[data-testid="transaction-detail-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-detail-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-detail-asset"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-detail-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-detail-fees"]')).toBeVisible();
  });

  test('批量删除交易记录', async ({ page }) => {
    await page.goto('/transactions');
    
    // 选择多个交易记录
    await page.check('[data-testid="transaction-checkbox"]:first-child');
    await page.check('[data-testid="transaction-checkbox"]:nth-child(2)');
    
    // 验证批量操作按钮显示
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    
    // 执行批量删除
    await page.click('[data-testid="bulk-delete-button"]');
    await page.click('[data-testid="confirm-bulk-delete-button"]');
    
    // 验证批量删除成功
    await expect(page.locator('[data-testid="success-message"]')).toContainText('批量删除成功');
  });

  test('交易记录导入功能', async ({ page }) => {
    await page.goto('/transactions');
    
    // 点击导入按钮
    await page.click('[data-testid="import-transactions-button"]');
    
    // 上传CSV文件
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('tests/fixtures/transactions.csv');
    
    // 预览导入数据
    await expect(page.locator('[data-testid="import-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-preview-row"]')).toHaveCount(10);
    
    // 确认导入
    await page.click('[data-testid="confirm-import-button"]');
    
    // 验证导入成功
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-success-message"]')).toContainText('成功导入 10 条交易记录');
  });

  test('交易记录导出功能', async ({ page }) => {
    await page.goto('/transactions');
    
    // 设置导出筛选条件
    await page.fill('[data-testid="start-date-filter"]', '2024-01-01');
    await page.fill('[data-testid="end-date-filter"]', '2024-12-31');
    
    // 点击导出按钮
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-transactions-button"]');
    
    // 选择导出格式
    await page.click('[data-testid="export-csv-button"]');
    
    // 验证文件下载
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('transactions_2024.csv');
  });

  test('交易统计分析', async ({ page }) => {
    await page.goto('/transactions/analytics');
    
    // 验证统计图表显示
    await expect(page.locator('[data-testid="transaction-volume-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="profit-loss-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-distribution-chart"]')).toBeVisible();
    
    // 切换时间范围
    await page.click('[data-testid="time-range-1m"]');
    await expect(page.locator('[data-testid="transaction-volume-chart"]')).toBeVisible();
    
    // 验证统计数据
    await expect(page.locator('[data-testid="total-transactions"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-volume"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-fees"]')).toBeVisible();
  });

  test('交易成本计算', async ({ page }) => {
    await page.goto('/transactions');
    
    // 查看成本计算详情
    await page.click('[data-testid="cost-analysis-button"]');
    
    // 验证成本分析页面
    await expect(page.locator('[data-testid="average-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="realized-gain-loss"]')).toBeVisible();
    await expect(page.locator('[data-testid="unrealized-gain-loss"]')).toBeVisible();
    
    // 按资产查看成本分析
    await page.selectOption('[data-testid="asset-filter"]', 'AAPL');
    await expect(page.locator('[data-testid="asset-cost-breakdown"]')).toBeVisible();
  });

  test('交易记录验证', async ({ page }) => {
    await page.goto('/transactions');
    
    // 添加无效交易（数量为负数）
    await page.click('[data-testid="add-transaction-button"]');
    await page.selectOption('[data-testid="transaction-type-select"]', 'buy');
    await page.selectOption('[data-testid="asset-select"]', 'AAPL');
    await page.fill('[data-testid="quantity-input"]', '-10');
    await page.fill('[data-testid="price-input"]', '150.00');
    
    await page.click('[data-testid="save-transaction-button"]');
    
    // 验证错误提示
    await expect(page.locator('[data-testid="quantity-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="quantity-error"]')).toContainText('数量必须大于0');
    
    // 添加无效价格
    await page.fill('[data-testid="quantity-input"]', '10');
    await page.fill('[data-testid="price-input"]', '0');
    
    await page.click('[data-testid="save-transaction-button"]');
    
    // 验证价格错误提示
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toContainText('价格必须大于0');
  });

  test('交易记录分页功能', async ({ page }) => {
    await page.goto('/transactions');
    
    // 验证分页控件
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-info"]')).toContainText('第 1 页，共');
    
    // 切换到下一页
    await page.click('[data-testid="next-page-button"]');
    await expect(page.locator('[data-testid="page-info"]')).toContainText('第 2 页，共');
    
    // 切换每页显示数量
    await page.selectOption('[data-testid="page-size-select"]', '50');
    await expect(page.locator('[data-testid="transaction-item"]')).toHaveCount(25);
  });

  test('交易记录同步状态', async ({ page }) => {
    await page.goto('/transactions');
    
    // 检查同步状态指示器
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
    
    // 手动触发同步
    await page.click('[data-testid="sync-button"]');
    
    // 验证同步进行中状态
    await expect(page.locator('[data-testid="sync-in-progress"]')).toBeVisible();
    
    // 等待同步完成
    await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();
  });
});