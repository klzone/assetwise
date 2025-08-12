/**
 * AssetWise 安全性检查脚本
 * 检测潜在的安全漏洞和配置问题
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.info = [];
  }

  addIssue(category, severity, description, file = null, line = null) {
    this.issues.push({
      category,
      severity, // 'high', 'medium', 'low'
      description,
      file,
      line,
      timestamp: new Date().toISOString()
    });
  }

  addWarning(category, description, file = null) {
    this.warnings.push({
      category,
      description,
      file,
      timestamp: new Date().toISOString()
    });
  }

  addInfo(category, description, file = null) {
    this.info.push({
      category,
      description,
      file,
      timestamp: new Date().toISOString()
    });
  }

  // 检查环境变量安全性
  checkEnvironmentVariables() {
    console.log('🔍 检查环境变量安全性...');
    
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    
    envFiles.forEach(envFile => {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        
        // 检查是否包含敏感信息
        const sensitivePatterns = [
          { pattern: /password\s*=\s*[^#\n]+/i, desc: '明文密码' },
          { pattern: /secret\s*=\s*[^#\n]+/i, desc: '密钥信息' },
          { pattern: /private.*key\s*=\s*[^#\n]+/i, desc: '私钥信息' },
          { pattern: /api.*key\s*=\s*[^#\n]+/i, desc: 'API密钥' }
        ];

        sensitivePatterns.forEach(({ pattern, desc }) => {
          if (pattern.test(content)) {
            this.addWarning('环境变量', `${envFile} 包含${desc}，确保不会提交到版本控制`, envFile);
          }
        });

        // 检查Supabase配置
        if (content.includes('SUPABASE_URL') && content.includes('SUPABASE_ANON_KEY')) {
          this.addInfo('环境变量', `${envFile} 包含Supabase配置`, envFile);
        }
      }
    });
  }

  // 检查代码中的安全问题
  checkCodeSecurity() {
    console.log('🔍 检查代码安全性...');
    
    const srcDir = path.join(process.cwd(), 'src');
    this.scanDirectory(srcDir);
  }

  scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        this.scanFile(filePath);
      }
    });
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 检查潜在的安全问题
      const securityChecks = [
        {
          pattern: /eval\s*\(/,
          severity: 'high',
          desc: '使用eval()函数存在代码注入风险'
        },
        {
          pattern: /innerHTML\s*=/,
          severity: 'medium',
          desc: '使用innerHTML可能导致XSS攻击'
        },
        {
          pattern: /document\.write\s*\(/,
          severity: 'medium',
          desc: '使用document.write存在安全风险'
        },
        {
          pattern: /localStorage\.setItem\s*\(\s*['"]\w*password/i,
          severity: 'high',
          desc: '在localStorage中存储密码信息'
        },
        {
          pattern: /console\.log\s*\(.*password/i,
          severity: 'medium',
          desc: '在控制台输出密码信息'
        },
        {
          pattern: /http:\/\/(?!localhost)/,
          severity: 'low',
          desc: '使用HTTP协议可能存在安全风险'
        },
        {
          pattern: /\.dangerouslySetInnerHTML/,
          severity: 'high',
          desc: '使用dangerouslySetInnerHTML存在XSS风险'
        }
      ];

      securityChecks.forEach(({ pattern, severity, desc }) => {
        if (pattern.test(line)) {
          this.addIssue('代码安全', severity, desc, filePath, lineNum);
        }
      });

      // 检查硬编码的敏感信息
      const hardcodedChecks = [
        {
          pattern: /['"](?:password|secret|key|token)['"]:\s*['"][^'"]+['"]/i,
          desc: '硬编码的敏感信息'
        },
        {
          pattern: /['"](?:sk_|pk_)[a-zA-Z0-9]{20,}['"]/,
          desc: '硬编码的API密钥'
        }
      ];

      hardcodedChecks.forEach(({ pattern, desc }) => {
        if (pattern.test(line)) {
          this.addIssue('硬编码敏感信息', 'high', desc, filePath, lineNum);
        }
      });
    });
  }

  // 检查依赖包安全性
  async checkDependencySecurity() {
    console.log('🔍 检查依赖包安全性...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.addWarning('依赖检查', 'package.json文件不存在');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // 检查已知的有安全问题的包
    const vulnerablePackages = [
      'lodash', // 某些版本有原型污染问题
      'moment', // 已废弃，建议使用dayjs
      'request', // 已废弃
      'node-uuid' // 已废弃，使用uuid
    ];

    Object.keys(dependencies).forEach(pkg => {
      if (vulnerablePackages.includes(pkg)) {
        this.addWarning('依赖安全', `依赖包 ${pkg} 可能存在安全问题或已废弃`, 'package.json');
      }
    });

    // 检查是否使用了安全相关的包
    const securityPackages = ['helmet', 'cors', 'express-rate-limit', 'bcrypt'];
    const hasSecurityPackages = securityPackages.some(pkg => dependencies[pkg]);
    
    if (!hasSecurityPackages) {
      this.addInfo('依赖安全', '建议添加安全相关的依赖包如helmet、cors等');
    }
  }

  // 检查文件权限和配置
  checkFilePermissions() {
    console.log('🔍 检查文件权限和配置...');
    
    const sensitiveFiles = [
      '.env',
      '.env.local',
      'next.config.js',
      'package.json'
    ];

    sensitiveFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          // 在Windows上权限检查有限，主要检查文件是否存在
          this.addInfo('文件权限', `敏感文件 ${file} 存在，请确保适当的访问控制`);
        } catch (error) {
          this.addWarning('文件权限', `无法检查文件 ${file} 的权限: ${error.message}`);
        }
      }
    });
  }

  // 检查Next.js配置安全性
  checkNextJsConfig() {
    console.log('🔍 检查Next.js配置安全性...');
    
    const configPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      
      // 检查是否启用了安全头
      if (!content.includes('headers')) {
        this.addWarning('Next.js配置', '建议在next.config.js中配置安全头');
      }

      // 检查是否配置了CSP
      if (!content.includes('Content-Security-Policy')) {
        this.addWarning('Next.js配置', '建议配置Content Security Policy (CSP)');
      }

      this.addInfo('Next.js配置', 'Next.js配置文件存在');
    } else {
      this.addInfo('Next.js配置', 'Next.js配置文件不存在，使用默认配置');
    }
  }

  // 检查数据库安全性
  checkDatabaseSecurity() {
    console.log('🔍 检查数据库安全配置...');
    
    // 检查Supabase相关文件
    const supabaseFiles = [
      'src/lib/supabase/client.ts',
      'src/lib/services/supabase-auth.service.ts'
    ];

    supabaseFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否使用了环境变量
        if (content.includes('process.env')) {
          this.addInfo('数据库安全', `${file} 正确使用环境变量`);
        } else {
          this.addWarning('数据库安全', `${file} 可能包含硬编码的配置信息`);
        }

        // 检查是否有适当的错误处理
        if (content.includes('try') && content.includes('catch')) {
          this.addInfo('数据库安全', `${file} 包含错误处理`);
        } else {
          this.addWarning('数据库安全', `${file} 缺少适当的错误处理`);
        }
      }
    });
  }

  // 生成安全报告
  generateReport() {
    console.log('\n📋 生成安全检查报告...\n');
    
    console.log('🚨 安全问题 (需要立即处理):');
    if (this.issues.length === 0) {
      console.log('✅ 未发现严重安全问题');
    } else {
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
        if (issue.file) {
          console.log(`   文件: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
      });
    }

    console.log('\n⚠️ 安全警告 (建议处理):');
    if (this.warnings.length === 0) {
      console.log('✅ 无安全警告');
    } else {
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.category}: ${warning.description}`);
        if (warning.file) {
          console.log(`   文件: ${warning.file}`);
        }
      });
    }

    console.log('\nℹ️ 安全信息:');
    this.info.forEach((info, index) => {
      console.log(`${index + 1}. ${info.category}: ${info.description}`);
    });

    // 生成安全评分
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;
    
    let score = 100;
    score -= highIssues * 20;
    score -= mediumIssues * 10;
    score -= lowIssues * 5;
    score -= this.warnings.length * 2;
    score = Math.max(0, score);

    console.log(`\n🎯 安全评分: ${score}/100`);
    
    if (score >= 90) {
      console.log('✅ 安全状况良好');
    } else if (score >= 70) {
      console.log('⚠️ 安全状况一般，建议改进');
    } else {
      console.log('🚨 安全状况较差，需要立即改进');
    }

    console.log('\n📊 问题统计:');
    console.log(`- 高危问题: ${highIssues}`);
    console.log(`- 中危问题: ${mediumIssues}`);
    console.log(`- 低危问题: ${lowIssues}`);
    console.log(`- 警告: ${this.warnings.length}`);
    console.log(`- 信息: ${this.info.length}`);
  }

  // 运行所有安全检查
  async runAllChecks() {
    console.log('🛡️ 开始AssetWise安全检查...\n');
    
    try {
      this.checkEnvironmentVariables();
      this.checkCodeSecurity();
      await this.checkDependencySecurity();
      this.checkFilePermissions();
      this.checkNextJsConfig();
      this.checkDatabaseSecurity();
      
      this.generateReport();
      
      console.log('\n🎉 安全检查完成！');
      
    } catch (error) {
      console.error('💥 安全检查过程中发生错误:', error);
    }
  }
}

// 运行安全检查
const checker = new SecurityChecker();
checker.runAllChecks().catch(console.error);