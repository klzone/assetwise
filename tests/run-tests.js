/**
 * AssetWise 测试运行脚本
 */

const fs = require('fs');
const path = require('path');
const SecurityTester = require('./security-test/security-tester');
const PerformanceTester = require('./performance-test/performance-tester');
const TauriDesktopFeaturesTester = require('./tauri-desktop-test/desktop-features-tester');
const ConfigTester = require('./tauri-desktop-test/config-tester');
const CodeTester = require('./tauri-desktop-test/code-tester');
const CommunicationTester = require('./tauri-desktop-test/communication-tester');

class AssetWiseTester {
  constructor() {
    this.results = {};
    this.summary = {
      pass: 0,
      warning: 0,
      fail: 0,
      info: 0,
      total: 0
    };
  }

  // 添加测试结果
  addResult(category, test, status, message) {
    if (!this.results[category]) {
      this.results[category] = {};
    }
    
    this.results[category][test] = {
      status,
      message
    };
    
    this.summary[status]++;
    this.summary.total++;
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始运行 AssetWise 测试...\n');
    
    try {
      // 运行安全测试
      const securityTester = new SecurityTester(this);
      const securityIssues = securityTester.runAllTests();
      
      // 运行性能测试
      const performanceTester = new PerformanceTester(this);
      const performanceIssues = performanceTester.runAllTests();
      
      // 运行桌面端功能测试
      const desktopFeaturesTester = new TauriDesktopFeaturesTester(this);
      desktopFeaturesTester.checkDesktopFeatures();
      
      // 运行配置测试
      const configTester = new ConfigTester(this);
      configTester.checkConfigurations();
      
      // 运行代码测试
      const codeTester = new CodeTester(this);
      codeTester.checkCodeQuality();
      
      // 运行通信测试
      const communicationTester = new CommunicationTester(this);
      communicationTester.checkCommunication();
      
      // 生成测试报告
      this.generateReport(securityIssues, performanceIssues);
    } catch (error) {
      console.error('❌ 测试运行失败:', error);
    }
  }

  // 生成测试报告
  generateReport(securityIssues, performanceIssues) {
    console.log('\n📊 生成测试报告...');
    
    // 创建报告目录
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // 生成HTML报告
    const reportPath = path.join(reportDir, `assetwise-test-report-${new Date().toISOString().split('T')[0]}.html`);
    
    let reportContent = `
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
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .count {
          font-size: 24px;
          font-weight: bold;
        }
        .pass { color: #28a745; }
        .warning { color: #ffc107; }
        .fail { color: #dc3545; }
        .info { color: #17a2b8; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
        }
        tr:hover {
          background-color: #f1f1f1;
        }
        .issue {
          margin-bottom: 10px;
          padding: 10px;
          border-left: 4px solid #ddd;
        }
        .critical { border-color: #dc3545; background-color: rgba(220, 53, 69, 0.1); }
        .high { border-color: #fd7e14; background-color: rgba(253, 126, 20, 0.1); }
        .medium { border-color: #ffc107; background-color: rgba(255, 193, 7, 0.1); }
        .low { border-color: #17a2b8; background-color: rgba(23, 162, 184, 0.1); }
      </style>
    </head>
    <body>
      <h1>AssetWise 测试报告</h1>
      <p>生成时间: ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <div class="summary-item">
          <div class="count total">${this.summary.total}</div>
          <div>总测试</div>
        </div>
        <div class="summary-item">
          <div class="count pass">${this.summary.pass}</div>
          <div>通过</div>
        </div>
        <div class="summary-item">
          <div class="count warning">${this.summary.warning}</div>
          <div>警告</div>
        </div>
        <div class="summary-item">
          <div class="count fail">${this.summary.fail}</div>
          <div>失败</div>
        </div>
        <div class="summary-item">
          <div class="count info">${this.summary.info}</div>
          <div>信息</div>
        </div>
      </div>
      
      <h2>测试结果摘要</h2>
    `;
    
    // 添加测试结果表格
    for (const category in this.results) {
      reportContent += `
        <h3>${category}</h3>
        <table>
          <thead>
            <tr>
              <th>测试</th>
              <th>状态</th>
              <th>信息</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      for (const test in this.results[category]) {
        const result = this.results[category][test];
        const statusClass = result.status;
        const statusText = {
          'pass': '通过',
          'warning': '警告',
          'fail': '失败',
          'info': '信息'
        }[result.status] || result.status;
        
        reportContent += `
          <tr>
            <td>${test}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${result.message}</td>
          </tr>
        `;
      }
      
      reportContent += `
          </tbody>
        </table>
      `;
    }
    
    // 添加安全问题详情
    if (securityIssues && securityIssues.length > 0) {
      reportContent += `
        <h2>安全问题详情</h2>
      `;
      
      securityIssues.forEach(issue => {
        reportContent += `
          <div class="issue ${issue.severity}">
            <h3>${issue.type}</h3>
            <p><strong>严重性:</strong> ${issue.severity}</p>
            <p><strong>描述:</strong> ${issue.description}</p>
            <p><strong>建议:</strong> ${issue.recommendation}</p>
          </div>
        `;
      });
    }
    
    // 添加性能问题详情
    if (performanceIssues && performanceIssues.length > 0) {
      reportContent += `
        <h2>性能问题详情</h2>
      `;
      
      performanceIssues.forEach(issue => {
        reportContent += `
          <div class="issue ${issue.severity}">
            <h3>${issue.type}</h3>
            <p><strong>严重性:</strong> ${issue.severity}</p>
            <p><strong>描述:</strong> ${issue.description}</p>
            <p><strong>建议:</strong> ${issue.recommendation}</p>
          </div>
        `;
      });
    }
    
    // 添加结论和建议
    reportContent += `
      <h2>结论和建议</h2>
      <p>基于测试结果，我们提出以下建议：</p>
      <ul>
        <li>优先修复所有严重和高风险的安全问题</li>
        <li>解决性能瓶颈，特别是数据加载和渲染优化</li>
        <li>完善桌面端功能，确保跨平台兼容性</li>
        <li>增强数据验证和输入检查</li>
        <li>实施更全面的错误处理和日志记录</li>
      </ul>
      
      <p>下一步建议：</p>
      <ul>
        <li>进行端到端测试验证修复后的功能</li>
        <li>执行负载测试评估系统在高负载下的表现</li>
        <li>进行用户验收测试确保满足业务需求</li>
      </ul>
    </body>
    </html>
    `;
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`✅ 测试报告已生成: ${reportPath}`);
    
    // 生成JSON报告
    const jsonReportPath = path.join(reportDir, `assetwise-test-report-${new Date().toISOString().split('T')[0]}.json`);
    const jsonReport = {
      summary: this.summary,
      results: this.results,
      securityIssues: securityIssues || [],
      performanceIssues: performanceIssues || [],
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));
    console.log(`✅ JSON测试报告已生成: ${jsonReportPath}`);
  }
}

// 运行测试
const tester = new AssetWiseTester();
tester.runAllTests().catch(console.error);

module.exports = AssetWiseTester;
