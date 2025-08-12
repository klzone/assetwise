// tests/e2e/setup.ts
import { test as base, expect } from '@playwright/test';
import { testUsers, testAssets, testTransactions } from '../fixtures/test-data';

// 扩展基础测试以包含认证状态
export const test = base.extend<{
  authenticatedPage: any;
  adminPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    // 登录普通用户
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUsers.user.email);
    await page.fill('input[name="password"]', testUsers.user.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    await use(page);
  },
  
  adminPage: async ({ page }, use) => {
    // 登录管理员用户
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUsers.admin.email);
    await page.fill('input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    await use(page);
  }
});

export { expect } from '@playwright/test';

// 测试数据清理工具
export class TestDataManager {
  constructor(private page: any) {}
  
  async cleanupTestData() {
    // 清理测试过程中创建的数据
    await this.page.evaluate(() => {
      // 清理本地存储
      localStorage.clear();
      sessionStorage.clear();
    });
  }
  
  async createTestAsset(asset = testAssets[0]) {
    await this.page.goto('/assets');
    await this.page.click('button:has-text("添加资产")');
    
    await this.page.fill('input[name="name"]', asset.name);
    await this.page.selectOption('select[name="type"]', asset.type);
    await this.page.fill('input[name="value"]', asset.value.toString());
    await this.page.fill('textarea[name="description"]', asset.description);
    
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('text=资产已成功添加')).toBeVisible();
    
    return asset;
  }
  
  async createTestTransaction(transaction = testTransactions[0]) {
    // 假设已经在资产详情页面
    await this.page.click('button:has-text("添加交易")');
    
    await this.page.selectOption('select[name="type"]', transaction.type);
    await this.page.fill('input[name="amount"]', transaction.amount.toString());
    await this.page.fill('input[name="price"]', transaction.price.toString());
    await this.page.fill('input[name="date"]', transaction.date);
    await this.page.fill('textarea[name="description"]', transaction.description);
    
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('text=交易记录已成功添加')).toBeVisible();
    
    return transaction;
  }
}

// 页面对象模型
export class LoginPage {
  constructor(private page: any) {}
  
  async goto() {
    await this.page.goto('/auth/login');
  }
  
  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
  
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
    await expect(this.page.locator('text=欢迎回来')).toBeVisible();
  }
  
  async expectLoginError() {
    await expect(this.page.locator('text=邮箱或密码不正确')).toBeVisible();
  }
}

export class DashboardPage {
  constructor(private page: any) {}
  
  async goto() {
    await this.page.goto('/dashboard');
  }
  
  async navigateToAssets() {
    await this.page.click('text=资产');
    await expect(this.page).toHaveURL('/assets');
  }
  
  async navigateToTransactions() {
    await this.page.click('text=交易');
    await expect(this.page).toHaveURL('/transactions');
  }
  
  async navigateToReports() {
    await this.page.click('text=报表');
    await expect(this.page).toHaveURL('/reports');
  }
  
  async logout() {
    await this.page.click('button:has-text("登出")');
    await expect(this.page).toHaveURL('/auth/login');
  }
}

export class AssetsPage {
  constructor(private page: any) {}
  
  async goto() {
    await this.page.goto('/assets');
  }
  
  async addAsset(asset: any) {
    await this.page.click('button:has-text("添加资产")');
    
    await this.page.fill('input[name="name"]', asset.name);
    await this.page.selectOption('select[name="type"]', asset.type);
    await this.page.fill('input[name="value"]', asset.value.toString());
    if (asset.symbol) {
      await this.page.fill('input[name="symbol"]', asset.symbol);
    }
    await this.page.fill('textarea[name="description"]', asset.description);
    
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('text=资产已成功添加')).toBeVisible();
  }
  
  async editAsset(assetName: string, newData: any) {
    await this.page.click(`text=${assetName} >> .. >> button:has-text("编辑")`);
    
    if (newData.name) {
      await this.page.fill('input[name="name"]', newData.name);
    }
    if (newData.value) {
      await this.page.fill('input[name="value"]', newData.value.toString());
    }
    
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('text=资产已成功更新')).toBeVisible();
  }
  
  async deleteAsset(assetName: string) {
    await this.page.click(`text=${assetName} >> .. >> button:has-text("删除")`);
    await this.page.click('button:has-text("确认")');
    await expect(this.page.locator('text=资产已成功删除')).toBeVisible();
  }
  
  async filterAssets(type: string) {
    await this.page.selectOption('select[name="typeFilter"]', type);
    // 等待筛选结果加载
    await this.page.waitForTimeout(1000);
  }
  
  async searchAssets(searchTerm: string) {
    await this.page.fill('input[name="search"]', searchTerm);
    await this.page.press('input[name="search"]', 'Enter');
    // 等待搜索结果加载
    await this.page.waitForTimeout(1000);
  }
  
  async expectAssetVisible(assetName: string) {
    await expect(this.page.locator(`text=${assetName}`)).toBeVisible();
  }
  
  async expectAssetNotVisible(assetName: string) {
    await expect(this.page.locator(`text=${assetName}`)).not.toBeVisible();
  }
}

export class ReportsPage {
  constructor(private page: any) {}
  
  async goto() {
    await this.page.goto('/reports');
  }
  
  async generateAssetOverviewReport() {
    await this.page.click('button:has-text("资产概览")');
    await this.page.click('button:has-text("生成报表")');
    
    // 等待报表生成
    await expect(this.page.locator('.report-content')).toBeVisible();
  }
  
  async generatePerformanceReport(startDate: string, endDate: string) {
    await this.page.click('button:has-text("收益分析")');
    await this.page.fill('input[name="startDate"]', startDate);
    await this.page.fill('input[name="endDate"]', endDate);
    await this.page.click('button:has-text("生成报表")');
    
    // 等待报表生成
    await expect(this.page.locator('.report-content')).toBeVisible();
  }
  
  async exportToPDF() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('button:has-text("导出PDF")');
    const download = await downloadPromise;
    
    // 验证下载的文件
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    return download;
  }
  
  async saveReportTemplate(templateName: string) {
    await this.page.click('button:has-text("保存为模板")');
    await this.page.fill('input[name="templateName"]', templateName);
    await this.page.click('button:has-text("保存")');
    
    await expect(this.page.locator('text=模板已保存')).toBeVisible();
  }
}

// 性能测试工具
export class PerformanceHelper {
  constructor(private page: any) {}
  
  async measurePageLoadTime(url: string) {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    return endTime - startTime;
  }
  
  async measureOperationTime(operation: () => Promise<void>) {
    const startTime = Date.now();
    await operation();
    const endTime = Date.now();
    
    return endTime - startTime;
  }
  
  async checkMemoryUsage() {
    const metrics = await this.page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0
      };
    });
    
    return metrics;
  }
}

// 可访问性测试工具
export class AccessibilityHelper {
  constructor(private page: any) {}
  
  async checkPageAccessibility() {
    // 注入axe-core
    await this.page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
    });
    
    // 运行可访问性检查
    const results = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).axe.run((err: any, results: any) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });
    
    return results;
  }
  
  async checkKeyboardNavigation() {
    // 测试Tab键导航
    const focusableElements = await this.page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').count();
    
    let currentFocusIndex = 0;
    for (let i = 0; i < focusableElements; i++) {
      await this.page.keyboard.press('Tab');
      currentFocusIndex++;
    }
    
    return currentFocusIndex === focusableElements;
  }
}