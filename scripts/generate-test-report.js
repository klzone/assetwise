/**
 * AssetWise 测试报告生成器
 * 此脚本用于合并 Jest 和 Playwright 测试结果，生成统一的测试报告
 */

const fs = require('fs');
const path = require('path');

// 报告路径
const jestReportPath = path.join(__dirname, '../test-reports/jest/test-results.json');
const playwrightReportPath = path.join(__dirname, '../test-reports/playwright-report/test-results.json');
const outputReportPath = path.join(__dirname, '../test-reports/combined-report.json');
const outputHtmlPath = path.join(__dirname, '../test-reports/index.html');

// 读取测试结果
function readTestResults() {
  let jestResults = {};
  let playwrightResults = {};

  try {
    if (fs.existsSync(jestReportPath)) {
      jestResults = JSON.parse(fs.readFileSync(jestReportPath, 'utf8'));
      console.log('✅ 已读取 Jest 测试结果');
    } else {
      console.warn('⚠️ Jest 测试结果文件不存在');
    }
  } catch (error) {
    console.error('❌ 读取 Jest 测试结果失败:', error);
  }

  try {
    if (fs.existsSync(playwrightReportPath)) {
      playwrightResults = JSON.parse(fs.readFileSync(playwrightReportPath, 'utf8'));
      console.log('✅ 已读取 Playwright 测试结果');
    } else {
      console.warn('⚠️ Playwright 测试结果文件不存在');
    }
  } catch (error) {
    console.error('❌ 读取 Playwright 测试结果失败:', error);
  }

  return { jestResults, playwrightResults };
}

// 生成合并报告
function generateCombinedReport(jestResults, playwrightResults) {
  // 提取 Jest 测试统计
  const jestStats = jestResults.numTotalTests 
    ? {
        total: jestResults.numTotalTests || 0,
        passed: jestResults.numPassedTests || 0,
        failed: jestResults.numFailedTests || 0,
        skipped: jestResults.numPendingTests || 0,
        duration: jestResults.startTime && jestResults.testResults 
          ? (new Date(jestResults.testResults.reduce((max, r) => Math.max(max, r.endTime || 0), 0)) - new Date(jestResults.startTime)) / 1000 
          : 0
      }
    : { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };

  // 提取 Playwright 测试统计
  const playwrightStats = playwrightResults.suites 
    ? {
        total: countPlaywrightTests(playwrightResults),
        passed: countPlaywrightTestsByStatus(playwrightResults, 'passed'),
        failed: countPlaywrightTestsByStatus(playwrightResults, 'failed'),
        skipped: countPlaywrightTestsByStatus(playwrightResults, 'skipped'),
        duration: playwrightResults.duration ? playwrightResults.duration / 1000 : 0
      }
    : { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };

  // 合并统计
  const combinedStats = {
    total: jestStats.total + playwrightStats.total,
    passed: jestStats.passed + playwrightStats.passed,
    failed: jestStats.failed + playwrightStats.failed,
    skipped: jestStats.skipped + playwrightStats.skipped,
    duration: jestStats.duration + playwrightStats.duration
  };

  // 计算通过率
  combinedStats.passRate = combinedStats.total > 0 
    ? Math.round((combinedStats.passed / combinedStats.total) * 100) 
    : 0;

  // 创建合并报告
  const combinedReport = {
    timestamp: new Date().toISOString(),
    summary: combinedStats,
    details: {
      jest: {
        stats: jestStats,
        results: jestResults
      },
      playwright: {
        stats: playwrightStats,
        results: playwrightResults
      }
    }
  };

  return combinedReport;
}

// 计算 Playwright 测试总数
function countPlaywrightTests(results) {
  let count = 0;
  
  function traverseSuites(suites) {
    if (!suites) return;
    
    for (const suite of suites) {
      if (suite.specs) {
        count += suite.specs.length;
      }
      if (suite.suites) {
        traverseSuites(suite.suites);
      }
    }
  }
  
  if (results.suites) {
    traverseSuites(results.suites);
  }
  
  return count;
}

// 按状态计算 Playwright 测试数量
function countPlaywrightTestsByStatus(results, status) {
  let count = 0;
  
  function traverseSuites(suites) {
    if (!suites) return;
    
    for (const suite of suites) {
      if (suite.specs) {
        for (const spec of suite.specs) {
          if (spec.tests && spec.tests.length > 0) {
            for (const test of spec.tests) {
              if (test.results && test.results.length > 0) {
                if (test.results[0].status === status) {
                  count++;
                }
              }
            }
          }
        }
      }
      if (suite.suites) {
        traverseSuites(suite.suites);
      }
    }
  }
  
  if (results.suites) {
    traverseSuites(results.suites);
  }
  
  return count;
}

// 生成 HTML 报告
function generateHtmlReport(combinedReport) {
  const summary = combinedReport.summary;
  const jestStats = combinedReport.details.jest.stats;
  const playwrightStats = combinedReport.details.playwright.stats;
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AssetWise 测试报告</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f7fa;
    }
    h1, h2, h3 {
      color: #1a365d;
    }
    .header {
      background-color: #1a365d;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .summary-card {
      background-color: white;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .stats-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      flex: 1;
      min-width: 200px;
      background-color: white;
      border-radius: 5px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }
    .passed { color: #38a169; }
    .failed { color: #e53e3e; }
    .skipped { color: #d69e2e; }
    .total { color: #3182ce; }
    .progress-bar {
      height: 10px;
      background-color: #edf2f7;
      border-radius: 5px;
      margin: 10px 0;
    }
    .progress-value {
      height: 100%;
      border-radius: 5px;
      background-color: #38a169;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #edf2f7;
    }
    th {
      background-color: #f8fafc;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #718096;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AssetWise 测试报告</h1>
    <p>生成时间: ${new Date(combinedReport.timestamp).toLocaleString('zh-CN')}</p>
  </div>

  <div class="summary-card">
    <h2>测试摘要</h2>
    <div class="progress-bar">
      <div class="progress-value" style="width: ${summary.passRate}%"></div>
    </div>
    <p>通过率: <strong>${summary.passRate}%</strong> (${summary.passed}/${summary.total})</p>
    <p>总执行时间: <strong>${summary.duration.toFixed(2)}秒</strong></p>
  </div>

  <div class="stats-container">
    <div class="stat-card">
      <h3>总测试</h3>
      <div class="stat-value total">${summary.total}</div>
    </div>
    <div class="stat-card">
      <h3>通过</h3>
      <div class="stat-value passed">${summary.passed}</div>
    </div>
    <div class="stat-card">
      <h3>失败</h3>
      <div class="stat-value failed">${summary.failed}</div>
    </div>
    <div class="stat-card">
      <h3>跳过</h3>
      <div class="stat-value skipped">${summary.skipped}</div>
    </div>
  </div>

  <h2>测试框架详情</h2>
  <table>
    <thead>
      <tr>
        <th>框架</th>
        <th>总测试</th>
        <th>通过</th>
        <th>失败</th>
        <th>跳过</th>
        <th>执行时间</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jest (单元测试)</td>
        <td>${jestStats.total}</td>
        <td>${jestStats.passed}</td>
        <td>${jestStats.failed}</td>
        <td>${jestStats.skipped}</td>
        <td>${jestStats.duration.toFixed(2)}秒</td>
      </tr>
      <tr>
        <td>Playwright (端到端测试)</td>
        <td>${playwrightStats.total}</td>
        <td>${playwrightStats.passed}</td>
        <td>${playwrightStats.failed}</td>
        <td>${playwrightStats.skipped}</td>
        <td>${playwrightStats.duration.toFixed(2)}秒</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>AssetWise 测试系统 - 版本 1.0.0</p>
  </div>
</body>
</html>
  `;
  
  return html;
}

// 主函数
function main() {
  console.log('📊 开始生成测试报告...');
  
  // 确保输出目录存在
  const outputDir = path.join(__dirname, '../test-reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 读取测试结果
  const { jestResults, playwrightResults } = readTestResults();
  
  // 生成合并报告
  const combinedReport = generateCombinedReport(jestResults, playwrightResults);
  
  // 保存 JSON 报告
  try {
    fs.writeFileSync(outputReportPath, JSON.stringify(combinedReport, null, 2));
    console.log(`✅ 已保存合并 JSON 报告: ${outputReportPath}`);
  } catch (error) {
    console.error('❌ 保存合并 JSON 报告失败:', error);
  }
  
  // 生成并保存 HTML 报告
  try {
    const htmlReport = generateHtmlReport(combinedReport);
    fs.writeFileSync(outputHtmlPath, htmlReport);
    console.log(`✅ 已保存 HTML 报告: ${outputHtmlPath}`);
  } catch (error) {
    console.error('❌ 保存 HTML 报告失败:', error);
  }
  
  console.log('📊 测试报告生成完成');
}

// 执行主函数
main();