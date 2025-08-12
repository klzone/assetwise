// tests/e2e/reports.spec.ts
import { test, expect } from './setup';
import { ReportsPage, TestDataManager, PerformanceHelper } from './setup';
import { testAssets, testTransactions } from '../fixtures/test-data';

test.describe('报表和分析功能测试', () => {
  let reportsPage: ReportsPage;
  let testDataManager: TestDataManager;
  let performanceHelper: PerformanceHelper;

  test.beforeEach(async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    reportsPage = new ReportsPage(page);
    testDataManager = new TestDataManager(page);
    performanceHelper = new PerformanceHelper(page);
    
    // 准备测试数据
    await testDataManager.cleanupTestData();
    
    // 创建测试资产和交易记录
    for (const asset of testAssets) {
      await testDataManager.createTestAsset(asset);
    }
    
    // 为每个资产添加交易记录
    for (let i = 0; i < testAssets.length; i++) {
      await page.goto('/assets');
      await page.click(`text=${testAssets[i].name}`);
      
      // 添加多条交易记录
      await testDataManager.createTestTransaction({
        type: '买入',
        amount: 100 + i * 10,
        price: 150 + i * 5,
        date: `2024-0${i + 1}-15`,
        description: `${testAssets[i].name}买入交易`
      });
      
      await testDataManager.createTestTransaction({
        type: '卖出',
        amount: 50 + i * 5,
        price: 160 + i * 5,
        date: `2024-0${i + 2}-15`,
        description: `${testAssets[i].name}卖出交易`
      });
    }
  });

  test('E2E-REPORT-001: 生成资产概览报表', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 验证报表页面加载
    await expect(page.locator('h1:has-text("报表分析")')).toBeVisible();
    await expect(page.locator('button:has-text("资产概览")')).toBeVisible();
    
    // 生成资产概览报表
    await reportsPage.generateAssetOverviewReport();
    
    // 验证报表内容
    await expect(page.locator('.report-content')).toBeVisible();
    await expect(page.locator('text=资产总价值')).toBeVisible();
    await expect(page.locator('text=资产分布')).toBeVisible();
    await expect(page.locator('.asset-distribution-chart')).toBeVisible();
    
    // 验证资产类型分布
    await expect(page.locator('text=股票')).toBeVisible();
    await expect(page.locator('text=加密货币')).toBeVisible();
    await expect(page.locator('text=房地产')).toBeVisible();
    
    // 验证数据准确性
    const totalValue = await page.textContent('.total-asset-value');
    expect(totalValue).toMatch(/\d+/); // 应该包含数字
  });

  test('E2E-REPORT-002: 生成收益分析报表', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成收益分析报表
    await reportsPage.generatePerformanceReport('2024-01-01', '2024-12-31');
    
    // 验证报表内容
    await expect(page.locator('.report-content')).toBeVisible();
    await expect(page.locator('text=总收益')).toBeVisible();
    await expect(page.locator('text=收益率')).toBeVisible();
    await expect(page.locator('text=已实现收益')).toBeVisible();
    await expect(page.locator('text=未实现收益')).toBeVisible();
    
    // 验证收益图表
    await expect(page.locator('.performance-chart')).toBeVisible();
    await expect(page.locator('.profit-loss-chart')).toBeVisible();
    
    // 验证时间范围筛选
    await page.fill('input[name="startDate"]', '2024-02-01');
    await page.fill('input[name="endDate"]', '2024-06-30');
    await page.click('button:has-text("更新报表")');
    
    // 验证报表更新
    await expect(page.locator('text=报表已更新')).toBeVisible();
  });

  test('E2E-REPORT-003: 导出PDF报表', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成报表
    await reportsPage.generateAssetOverviewReport();
    
    // 导出PDF
    const download = await reportsPage.exportToPDF();
    
    // 验证下载文件
    expect(download.suggestedFilename()).toMatch(/asset-overview.*\.pdf$/);
    
    // 验证文件大小（应该大于0）
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const stats = fs.statSync(path);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  test('E2E-REPORT-004: 保存和使用报表模板', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 设置报表参数
    await page.click('button:has-text("收益分析")');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-06-30');
    await page.selectOption('select[name="groupBy"]', '月度');
    
    // 保存为模板
    const templateName = '半年度收益分析模板';
    await reportsPage.saveReportTemplate(templateName);
    
    // 验证模板已保存
    await expect(page.locator(`text=${templateName}`)).toBeVisible();
    
    // 使用保存的模板
    await page.selectOption('select[name="reportTemplate"]', templateName);
    await page.click('button:has-text("使用模板")');
    
    // 验证模板参数已加载
    await expect(page.locator('input[name="startDate"]')).toHaveValue('2024-01-01');
    await expect(page.locator('input[name="endDate"]')).toHaveValue('2024-06-30');
    await expect(page.locator('select[name="groupBy"]')).toHaveValue('月度');
    
    // 生成报表
    await page.click('button:has-text("生成报表")');
    await expect(page.locator('.report-content')).toBeVisible();
  });

  test('E2E-REPORT-005: 风险分析报表', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成风险分析报表
    await page.click('button:has-text("风险分析")');
    await page.click('button:has-text("生成报表")');
    
    // 验证风险分析内容
    await expect(page.locator('.report-content')).toBeVisible();
    await expect(page.locator('text=投资组合风险')).toBeVisible();
    await expect(page.locator('text=波动率')).toBeVisible();
    await expect(page.locator('text=最大回撤')).toBeVisible();
    await expect(page.locator('text=夏普比率')).toBeVisible();
    
    // 验证风险图表
    await expect(page.locator('.risk-chart')).toBeVisible();
    await expect(page.locator('.volatility-chart')).toBeVisible();
    
    // 验证风险等级显示
    await expect(page.locator('.risk-level')).toBeVisible();
    const riskLevel = await page.textContent('.risk-level');
    expect(['低风险', '中风险', '高风险']).toContain(riskLevel?.trim());
  });

  test('E2E-REPORT-006: 税务报表生成', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成税务报表
    await page.click('button:has-text("税务报表")');
    await page.selectOption('select[name="taxYear"]', '2024');
    await page.click('button:has-text("生成报表")');
    
    // 验证税务报表内容
    await expect(page.locator('.report-content')).toBeVisible();
    await expect(page.locator('text=应税收入')).toBeVisible();
    await expect(page.locator('text=资本利得')).toBeVisible();
    await expect(page.locator('text=分红收入')).toBeVisible();
    await expect(page.locator('text=可抵扣损失')).toBeVisible();
    
    // 验证税务计算
    await expect(page.locator('.tax-calculation')).toBeVisible();
    await expect(page.locator('text=预估税额')).toBeVisible();
    
    // 导出税务报表
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("导出税务报表")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/tax-report.*\.pdf$/);
  });

  test('E2E-REPORT-007: 自定义报表创建', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 创建自定义报表
    await page.click('button:has-text("自定义报表")');
    
    // 设置报表参数
    await page.fill('input[name="reportName"]', '我的自定义报表');
    await page.check('input[name="includeAssets"]');
    await page.check('input[name="includeTransactions"]');
    await page.check('input[name="includePerformance"]');
    
    // 选择图表类型
    await page.check('input[name="chartTypes"][value="pie"]');
    await page.check('input[name="chartTypes"][value="line"]');
    await page.check('input[name="chartTypes"][value="bar"]');
    
    // 设置时间范围
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    
    // 生成自定义报表
    await page.click('button:has-text("生成自定义报表")');
    
    // 验证自定义报表内容
    await expect(page.locator('.report-content')).toBeVisible();
    await expect(page.locator('h2:has-text("我的自定义报表")')).toBeVisible();
    
    // 验证包含的图表
    await expect(page.locator('.pie-chart')).toBeVisible();
    await expect(page.locator('.line-chart')).toBeVisible();
    await expect(page.locator('.bar-chart')).toBeVisible();
    
    // 保存自定义报表
    await page.click('button:has-text("保存报表")');
    await expect(page.locator('text=自定义报表已保存')).toBeVisible();
  });

  test('E2E-REPORT-008: 报表数据钻取功能', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成资产概览报表
    await reportsPage.generateAssetOverviewReport();
    
    // 点击饼图中的股票部分进行钻取
    await page.click('.asset-distribution-chart .stock-segment');
    
    // 验证钻取后的详细视图
    await expect(page.locator('.drill-down-view')).toBeVisible();
    await expect(page.locator('text=股票类资产详情')).toBeVisible();
    
    // 验证股票资产列表
    await expect(page.locator('text=苹果股票')).toBeVisible();
    
    // 进一步钻取到具体资产
    await page.click('text=苹果股票');
    
    // 验证资产详细分析
    await expect(page.locator('.asset-detail-analysis')).toBeVisible();
    await expect(page.locator('text=交易历史')).toBeVisible();
    await expect(page.locator('text=收益分析')).toBeVisible();
    
    // 返回上级视图
    await page.click('button:has-text("返回")');
    await expect(page.locator('.drill-down-view')).toBeVisible();
    
    await page.click('button:has-text("返回")');
    await expect(page.locator('.report-content')).toBeVisible();
  });

  test('E2E-REPORT-009: 报表数据导出多格式', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成收益分析报表
    await reportsPage.generatePerformanceReport('2024-01-01', '2024-12-31');
    
    // 测试Excel导出
    const excelDownloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("导出")');
    await page.click('button:has-text("Excel格式")');
    const excelDownload = await excelDownloadPromise;
    
    expect(excelDownload.suggestedFilename()).toMatch(/performance-report.*\.xlsx$/);
    
    // 测试CSV导出
    const csvDownloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("导出")');
    await page.click('button:has-text("CSV格式")');
    const csvDownload = await csvDownloadPromise;
    
    expect(csvDownload.suggestedFilename()).toMatch(/performance-report.*\.csv$/);
    
    // 测试JSON导出
    const jsonDownloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("导出")');
    await page.click('button:has-text("JSON格式")');
    const jsonDownload = await jsonDownloadPromise;
    
    expect(jsonDownload.suggestedFilename()).toMatch(/performance-report.*\.json$/);
  });

  test('E2E-REPORT-010: 报表定时生成和邮件发送', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 设置定时报表
    await page.click('button:has-text("定时报表")');
    
    // 配置定时任务
    await page.fill('input[name="reportName"]', '每周资产概览');
    await page.selectOption('select[name="reportType"]', '资产概览');
    await page.selectOption('select[name="frequency"]', '每周');
    await page.selectOption('select[name="dayOfWeek"]', '周一');
    await page.fill('input[name="time"]', '09:00');
    
    // 设置邮件接收者
    await page.fill('input[name="emailRecipients"]', 'user@example.com,admin@example.com');
    await page.check('input[name="includePDF"]');
    await page.check('input[name="includeExcel"]');
    
    // 保存定时任务
    await page.click('button:has-text("保存定时任务")');
    
    // 验证任务已创建
    await expect(page.locator('text=定时任务已创建')).toBeVisible();
    await expect(page.locator('text=每周资产概览')).toBeVisible();
    
    // 测试立即执行
    await page.click('.scheduled-report-item >> button:has-text("立即执行")');
    await expect(page.locator('text=报表已发送')).toBeVisible();
    
    // 查看执行历史
    await page.click('.scheduled-report-item >> button:has-text("执行历史")');
    await expect(page.locator('.execution-history')).toBeVisible();
    await expect(page.locator('text=执行成功')).toBeVisible();
  });

  test('E2E-REPORT-011: 报表性能测试', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // 测量报表页面加载时间
    const loadTime = await performanceHelper.measurePageLoadTime('/reports');
    expect(loadTime).toBeLessThan(3000);
    
    await reportsPage.goto();
    
    // 测量报表生成时间
    const generateTime = await performanceHelper.measureOperationTime(async () => {
      await reportsPage.generateAssetOverviewReport();
    });
    
    expect(generateTime).toBeLessThan(5000); // 报表生成时间应小于5秒
    
    // 测量复杂报表生成时间
    const complexReportTime = await performanceHelper.measureOperationTime(async () => {
      await page.click('button:has-text("综合分析")');
      await page.click('button:has-text("生成报表")');
      await page.waitForSelector('.report-content');
    });
    
    expect(complexReportTime).toBeLessThan(10000); // 复杂报表生成时间应小于10秒
    
    // 检查内存使用
    const memoryUsage = await performanceHelper.checkMemoryUsage();
    expect(memoryUsage.usedJSHeapSize).toBeLessThan(80 * 1024 * 1024); // 内存使用应小于80MB
  });

  test('E2E-REPORT-012: 报表数据准确性验证', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成资产概览报表
    await reportsPage.generateAssetOverviewReport();
    
    // 获取报表中的总资产价值
    const reportTotalValue = await page.textContent('.total-asset-value');
    const reportValue = parseFloat(reportTotalValue?.replace(/[^\d.]/g, '') || '0');
    
    // 手动计算预期总价值
    let expectedTotal = 0;
    for (const asset of testAssets) {
      expectedTotal += asset.value;
    }
    
    // 验证数据准确性（允许小幅误差）
    expect(Math.abs(reportValue - expectedTotal)).toBeLessThan(100);
    
    // 验证资产分布百分比
    const stockPercentage = await page.textContent('.stock-percentage');
    const cryptoPercentage = await page.textContent('.crypto-percentage');
    const realEstatePercentage = await page.textContent('.real-estate-percentage');
    
    const stockPct = parseFloat(stockPercentage?.replace('%', '') || '0');
    const cryptoPct = parseFloat(cryptoPercentage?.replace('%', '') || '0');
    const realEstatePct = parseFloat(realEstatePercentage?.replace('%', '') || '0');
    
    // 验证百分比总和为100%
    expect(Math.abs(stockPct + cryptoPct + realEstatePct - 100)).toBeLessThan(1);
  });

  test('E2E-REPORT-013: 报表交互功能', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await reportsPage.goto();
    
    // 生成收益分析报表
    await reportsPage.generatePerformanceReport('2024-01-01', '2024-12-31');
    
    // 测试图表交互
    await page.hover('.performance-chart .data-point');
    await expect(page.locator('.chart-tooltip')).toBeVisible();
    
    // 测试图表缩放
    await page.click('button:has-text("放大")');
    await expect(page.locator('.chart-zoomed')).toBeVisible();
    
    await page.click('button:has-text("重置")');
    await expect(page.locator('.chart-zoomed')).not.toBeVisible();
    
    // 测试数据表格排序
    await page.click('.data-table th:has-text("收益率")');
    
    // 验证排序结果
    const firstRowValue = await page.textContent('.data-table tbody tr:first-child .return-rate');
    const secondRowValue = await page.textContent('.data-table tbody tr:nth-child(2) .return-rate');
    
    const firstValue = parseFloat(firstRowValue?.replace('%', '') || '0');
    const secondValue = parseFloat(secondRowValue?.replace('%', '') || '0');
    
    expect(firstValue).toBeGreaterThanOrEqual(secondValue);
    
    // 测试数据筛选
    await page.fill('input[name="filterAssets"]', '苹果');
    await page.press('input[name="filterAssets"]', 'Enter');
    
    await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
    await expect(page.locator('text=苹果股票')).toBeVisible();
  });
});