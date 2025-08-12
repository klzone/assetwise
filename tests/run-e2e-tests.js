#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始执行AssetWise端到端测试...\n');

// 测试配置
const testConfig = {
  browsers: ['chromium', 'firefox', 'webkit'],
  parallel: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 2 : 0,
  timeout: 30000
};

// 创建测试结果目录
const resultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function runTests() {
  try {
    console.log('📋 测试配置:');
    console.log(`   浏览器: ${testConfig.browsers.join(', ')}`);
    console.log(`   并行度: ${testConfig.parallel}`);
    console.log(`   重试次数: ${testConfig.retries}`);
    console.log(`   超时时间: ${testConfig.timeout}ms\n`);

    // 检查应用是否运行
    console.log('🔍 检查应用状态...');
    try {
      execSync('curl -f http://localhost:3000 > /dev/null 2>&1', { stdio: 'ignore' });
      console.log('✅ 应用正在运行\n');
    } catch (error) {
      console.log('⚠️ 应用未运行，正在启动...');
      // 这里可以添加启动应用的逻辑
      console.log('请确保应用在 http://localhost:3000 运行\n');
    }

    // 运行不同类型的测试
    const testSuites = [
      { name: '认证功能测试', file: 'auth.spec.ts', priority: 1 },
      { name: '资产管理测试', file: 'assets.spec.ts', priority: 2 },
      { name: '交易记录测试', file: 'transactions.spec.ts', priority: 2 },
      { name: '报表功能测试', file: 'reports.spec.ts', priority: 3 },
      { name: '数据同步测试', file: 'sync.spec.ts', priority: 3 },
      { name: '桌面端功能测试', file: 'desktop.spec.ts', priority: 4 }
    ];

    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: []
    };

    // 按优先级运行测试
    for (const suite of testSuites.sort((a, b) => a.priority - b.priority)) {
      console.log(`🧪 运行 ${suite.name}...`);
      
      try {
        const startTime = Date.now();
        
        // 运行单个测试套件
        const command = `npx playwright test tests/e2e/${suite.file} --reporter=json`;
        const output = execSync(command, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '..'),
          timeout: 300000 // 5分钟超时
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        // 解析测试结果
        let testResult;
        try {
          testResult = JSON.parse(output);
        } catch (parseError) {
          console.log(`⚠️ 无法解析 ${suite.name} 的测试结果`);
          testResult = { stats: { expected: 0, unexpected: 0, skipped: 0 } };
        }

        const suiteResult = {
          name: suite.name,
          file: suite.file,
          duration: duration,
          passed: testResult.stats?.expected || 0,
          failed: testResult.stats?.unexpected || 0,
          skipped: testResult.stats?.skipped || 0,
          status: testResult.stats?.unexpected > 0 ? 'failed' : 'passed'
        };

        results.suites.push(suiteResult);
        results.total += suiteResult.passed + suiteResult.failed + suiteResult.skipped;
        results.passed += suiteResult.passed;
        results.failed += suiteResult.failed;
        results.skipped += suiteResult.skipped;

        console.log(`   ✅ 通过: ${suiteResult.passed}`);
        console.log(`   ❌ 失败: ${suiteResult.failed}`);
        console.log(`   ⏭️ 跳过: ${suiteResult.skipped}`);
        console.log(`   ⏱️ 耗时: ${(duration / 1000).toFixed(2)}s\n`);

      } catch (error) {
        console.log(`❌ ${suite.name} 执行失败:`);
        console.log(`   错误: ${error.message}\n`);
        
        results.suites.push({
          name: suite.name,
          file: suite.file,
          duration: 0,
          passed: 0,
          failed: 1,
          skipped: 0,
          status: 'failed',
          error: error.message
        });
        results.failed += 1;
        results.total += 1;
      }
    }

    // 生成测试报告
    generateTestReport(results);
    
    // 输出总结
    console.log('📊 测试总结:');
    console.log(`   总计: ${results.total} 个测试`);
    console.log(`   通过: ${results.passed} 个`);
    console.log(`   失败: ${results.failed} 个`);
    console.log(`   跳过: ${results.skipped} 个`);
    console.log(`   成功率: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

    if (results.failed > 0) {
      console.log('❌ 部分测试失败，请查看详细报告');
      process.exit(1);
    } else {
      console.log('🎉 所有测试通过！');
    }

  } catch (error) {
    console.error('💥 测试执行出错:', error.message);
    process.exit(1);
  }
}

function generateTestReport(results) {
  const reportPath = path.join(__dirname, '../test-results/e2e-test-report.json');
  const htmlReportPath = path.join(__dirname, '../test-results/e2e-test-report.html');
  
  // 生成JSON报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      successRate: ((results.passed / results.total) * 100).toFixed(1)
    },
    suites: results.suites,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON报告已生成: ${reportPath}`);

  // 生成HTML报告
  const htmlContent = generateHtmlReport(report);
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`📄 HTML报告已生成: ${htmlReportPath}\n`);
}

function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetWise E2E测试报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 8px; }
        .metric.total { background: #e3f2fd; color: #1976d2; }
        .metric.passed { background: #e8f5e8; color: #2e7d32; }
        .metric.failed { background: #ffebee; color: #c62828; }
        .metric.skipped { background: #fff3e0; color: #f57c00; }
        .metric h3 { margin: 0; font-size: 2em; }
        .metric p { margin: 5px 0 0 0; font-weight: 500; }
        .suites { padding: 0 30px 30px 30px; }
        .suite { border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .suite-header { padding: 15px 20px; background: #fafafa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
        .suite-name { font-weight: 600; font-size: 1.1em; }
        .suite-status { padding: 4px 12px; border-radius: 20px; font-size: 0.9em; font-weight: 500; }
        .suite-status.passed { background: #e8f5e8; color: #2e7d32; }
        .suite-status.failed { background: #ffebee; color: #c62828; }
        .suite-details { padding: 20px; }
        .suite-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 15px; }
        .suite-stat { text-align: center; }
        .suite-stat .number { font-size: 1.5em; font-weight: 600; }
        .suite-stat .label { font-size: 0.9em; color: #666; }
        .error { background: #ffebee; border: 1px solid #ffcdd2; border-radius: 4px; padding: 15px; margin-top: 15px; }
        .error-title { font-weight: 600; color: #c62828; margin-bottom: 10px; }
        .error-message { font-family: monospace; font-size: 0.9em; color: #666; }
        .footer { padding: 20px 30px; border-top: 1px solid #e0e0e0; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AssetWise E2E测试报告</h1>
            <p>生成时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="metric total">
                <h3>${report.summary.total}</h3>
                <p>总测试数</p>
            </div>
            <div class="metric passed">
                <h3>${report.summary.passed}</h3>
                <p>通过</p>
            </div>
            <div class="metric failed">
                <h3>${report.summary.failed}</h3>
                <p>失败</p>
            </div>
            <div class="metric skipped">
                <h3>${report.summary.skipped}</h3>
                <p>跳过</p>
            </div>
        </div>
        
        <div class="suites">
            <h2>测试套件详情</h2>
            ${report.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <div class="suite-name">${suite.name}</div>
                        <div class="suite-status ${suite.status}">${suite.status === 'passed' ? '通过' : '失败'}</div>
                    </div>
                    <div class="suite-details">
                        <div class="suite-stats">
                            <div class="suite-stat">
                                <div class="number">${suite.passed}</div>
                                <div class="label">通过</div>
                            </div>
                            <div class="suite-stat">
                                <div class="number">${suite.failed}</div>
                                <div class="label">失败</div>
                            </div>
                            <div class="suite-stat">
                                <div class="number">${suite.skipped}</div>
                                <div class="label">跳过</div>
                            </div>
                            <div class="suite-stat">
                                <div class="number">${(suite.duration / 1000).toFixed(2)}s</div>
                                <div class="label">耗时</div>
                            </div>
                        </div>
                        ${suite.error ? `
                            <div class="error">
                                <div class="error-title">错误信息:</div>
                                <div class="error-message">${suite.error}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>测试环境: Node.js ${report.environment.node} | ${report.environment.platform} ${report.environment.arch}</p>
            <p>成功率: ${report.summary.successRate}%</p>
        </div>
    </div>
</body>
</html>
  `;
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };