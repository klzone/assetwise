import { defineConfig, devices } from '@playwright/test';

/**
 * AssetWise Playwright 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // 测试超时时间
  timeout: 30 * 1000,
  // 每个测试的预期运行时间
  expect: {
    timeout: 5000
  },
  // 失败时自动重试次数
  retries: process.env.CI ? 2 : 0,
  // 并行运行测试
  fullyParallel: true,
  // 失败时生成详细报告
  forbidOnly: !!process.env.CI,
  // 测试工作者数量
  workers: process.env.CI ? 1 : undefined,
  // 测试报告生成器
  reporter: [
    ['html', { outputFolder: 'test-reports/playwright-report' }],
    ['json', { outputFile: 'test-reports/playwright-report/test-results.json' }]
  ],
  // 共享设置
  use: {
    // 基础URL
    baseURL: 'http://localhost:3001',
    // 自动截图
    screenshot: 'only-on-failure',
    // 收集跟踪以便调试
    trace: 'on-first-retry',
    // 视频录制
    video: 'on-first-retry',
  },

  // 测试项目配置
  projects: [
    {
      name: '桌面端Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: '单元测试',
      testMatch: /.*\.test\.ts/,
    },
  ],

  // 本地开发服务器配置
  webServer: {
    command: 'pnpm run dev',
    port: 3001,
    reuseExistingServer: !process.env.CI,
  },
});