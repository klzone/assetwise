/**
 * AssetWise 安全测试运行脚本
 */

const SecurityTester = require('./security-test/security-tester');

class SecurityTestRunner {
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

  // 运行安全测试
  runSecurityTests() {
    console.log('🔒 开始运行 AssetWise 安全测试...\n');
    
    try {
      // 运行安全测试
      const securityTester = new SecurityTester(this);
      const securityIssues = securityTester.runAllTests();
      
      // 输出测试结果摘要
      console.log('\n📊 测试结果摘要:');
      console.log(`总测试: ${this.summary.total}`);
      console.log(`通过: ${this.summary.pass}`);
      console.log(`警告: ${this.summary.warning}`);
      console.log(`失败: ${this.summary.fail}`);
      console.log(`信息: ${this.summary.info}`);
      
      // 输出安全问题
      if (securityIssues && securityIssues.length > 0) {
        console.log('\n⚠️ 检测到的安全问题:');
        securityIssues.forEach((issue, index) => {
          console.log(`\n问题 ${index + 1}:`);
          console.log(`类型: ${issue.type}`);
          console.log(`严重性: ${issue.severity}`);
          console.log(`描述: ${issue.description}`);
          console.log(`建议: ${issue.recommendation}`);
        });
      } else {
        console.log('\n✅ 未检测到严重安全问题');
      }
    } catch (error) {
      console.error('❌ 测试运行失败:', error);
    }
  }
}

// 运行测试
const runner = new SecurityTestRunner();
runner.runSecurityTests();