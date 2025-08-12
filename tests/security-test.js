/**
 * AssetWise 安全性测试脚本
 * 检测应用的安全漏洞和风险
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityTester {
  constructor() {
    this.vulnerabilities = [];
    this.recommendations = [];
  }

  addVulnerability(category, severity, description, details = null) {
    this.vulnerabilities.push({
      category,
      severity, // 'critical', 'high', 'medium', 'low'
      description,
      details,
      timestamp: new Date().toISOString()
    });
  }

  addRecommendation(category, description, implementation = null, priority = 'medium') {
    this.recommendations.push({
      category,
      description,
      implementation,
      priority, // 'high', 'medium', 'low'
      timestamp: new Date().toISOString()
    });
  }

  // 检查环境变量安全
  checkEnvironmentVariables() {
    console.log('🔍 检查环境变量安全...');
    
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production'
    ];
    
    envFiles.forEach(envFile => {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        console.log(`检查 ${envFile}...`);
        
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        
        // 检查敏感信息
        lines.forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            
            if (key && value) {
              // 检查是否包含密钥、密码或令牌
              if (key.toLowerCase().includes('key') || 
                  key.toLowerCase().includes('secret') || 
                  key.toLowerCase().includes('password') || 
                  key.toLowerCase().includes('token')) {
                
                // 检查是否直接暴露了敏感信息
                if (value.length > 0 && !value.includes('${') && !value.includes('process.env')) {
                  this.addVulnerability('环境变量', 'high', `${envFile} 中存在敏感信息: ${key}`, {
                    file: envFile,
                    key: key
                  });
                  
                  this.addRecommendation('环境变量安全', `保护 ${envFile} 中的敏感信息`, 
                    '使用环境变量管理系统或密钥管理服务', 'high');
                }
              }
            }
          }
        });
        
        // 检查是否被版本控制
        try {
          const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');
          if (!gitignore.includes(envFile)) {
            this.addVulnerability('版本控制', 'high', `${envFile} 未被 .gitignore 排除`, {
              file: envFile
            });
            
            this.addRecommendation('版本控制安全', `将 ${envFile} 添加到 .gitignore`, 
              '确保敏感配置文件不被提交到版本控制系统', 'high');
          }
        } catch (error) {
          console.log('无法检查 .gitignore');
        }
      }
    });
  }

  // 检查API路由安全
  checkApiRouteSecurity() {
    console.log('🔍 检查API路由安全...');
    
    const apiDir = path.join(process.cwd(), 'src/app/api');
    if (!fs.existsSync(apiDir)) {
      console.log('⚠️ API目录不存在');
      return;
    }

    this.scanDirectoryForApiSecurity(apiDir);
  }

  // 扫描目录查找API安全问题
  scanDirectoryForApiSecurity(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryForApiSecurity(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否缺少身份验证
        if (content.includes('export async function') || 
            content.includes('export default async function')) {
          
          if (!content.includes('auth') && 
              !content.includes('session') && 
              !content.includes('token') && 
              !content.includes('authenticate')) {
            
            this.addVulnerability('API安全', 'high', `API路由可能缺少身份验证: ${filePath}`, {
              file: path.relative(process.cwd(), filePath)
            });
            
            this.addRecommendation('API安全', `为 ${path.basename(filePath)} 添加身份验证`, 
              '实现中间件或直接在路由处理程序中验证用户身份', 'high');
          }
          
          // 检查是否缺少输入验证
          if (!content.includes('validate') && 
              !content.includes('schema') && 
              !content.includes('zod') && 
              !content.includes('joi') &&
              !content.includes('yup')) {
            
            this.addVulnerability('API安全', 'medium', `API路由可能缺少输入验证: ${filePath}`, {
              file: path.relative(process.cwd(), filePath)
            });
            
            this.addRecommendation('API安全', `为 ${path.basename(filePath)} 添加输入验证`, 
              '使用Zod、Joi或Yup等库验证请求数据', 'high');
          }
          
          // 检查是否存在SQL注入风险
          if ((content.includes('sql`') || content.includes('query(')) && 
              content.includes('${') && 
              !content.includes('parameterized')) {
            
            this.addVulnerability('API安全', 'critical', `API路由可能存在SQL注入风险: ${filePath}`, {
              file: path.relative(process.cwd(), filePath)
            });
            
            this.addRecommendation('API安全', `修复 ${path.basename(filePath)} 中的SQL注入风险`, 
              '使用参数化查询或ORM', 'high');
          }
        }
      }
    });
  }

  // 检查CORS配置
  checkCorsConfiguration() {
    console.log('🔍 检查CORS配置...');
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (content.includes('headers:') && content.includes('Access-Control-Allow-Origin')) {
        if (content.includes('Access-Control-Allow-Origin', '*')) {
          this.addVulnerability('CORS配置', 'high', 'CORS配置过于宽松', {
            file: 'next.config.js'
          });
          
          this.addRecommendation('CORS安全', '限制CORS访问源', 
            '将Access-Control-Allow-Origin设置为特定域名而非通配符*', 'high');
        }
      } else {
        this.addVulnerability('CORS配置', 'low', '未找到明确的CORS配置', {
          file: 'next.config.js'
        });
        
        this.addRecommendation('CORS安全', '添加明确的CORS配置', 
          '在next.config.js中配置适当的CORS头', 'medium');
      }
    }
  }

  // 检查CSP配置
  checkContentSecurityPolicy() {
    console.log('🔍 检查内容安全策略(CSP)...');
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (!content.includes('Content-Security-Policy')) {
        this.addVulnerability('CSP配置', 'medium', '未配置内容安全策略', {
          file: 'next.config.js'
        });
        
        this.addRecommendation('CSP安全', '添加内容安全策略', 
          '在next.config.js中配置Content-Security-Policy头', 'high');
      }
    }
  }

  // 检查依赖包安全
  checkDependencySecurity() {
    console.log('🔍 检查依赖包安全...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.log('⚠️ package.json不存在');
      return;
    }

    console.log('建议运行npm audit检查依赖包安全漏洞');
    
    // 这里可以集成npm audit或其他安全扫描工具
  }

  // 检查认证实现
  checkAuthImplementation() {
    console.log('🔍 检查认证实现...');
    
    // 检查是否使用了安全的认证方法
    const authFiles = [
      'src/lib/services/supabase-auth.service.ts',
      'src/components/providers/auth-provider.tsx',
      'src/store/index.ts'
    ];
    
    authFiles.forEach(authFile => {
      const authPath = path.join(process.cwd(), authFile);
      if (fs.existsSync(authPath)) {
        const content = fs.readFileSync(authPath, 'utf8');
        
        // 检查密码策略
        if (authFile.includes('auth') && content.includes('password')) {
          if (!content.includes('validate') && !content.includes('strength')) {
            this.addVulnerability('认证安全', 'medium', `可能缺少密码强度验证: ${authFile}`, {
              file: authFile
            });
            
            this.addRecommendation('认证安全', '实现密码强度验证', 
              '添加密码复杂度要求和验证', 'medium');
          }
        }
        
        // 检查会话管理
        if (content.includes('session') || content.includes('token')) {
          if (!content.includes('expire') && !content.includes('timeout')) {
            this.addVulnerability('会话安全', 'medium', `可能缺少会话超时处理: ${authFile}`, {
              file: authFile
            });
            
            this.addRecommendation('会话安全', '实现会话超时', 
              '添加会话过期和自动登出功能', 'medium');
          }
        }
      }
    });
  }

  // 检查数据存储安全
  checkDataStorageSecurity() {
    console.log('🔍 检查数据存储安全...');
    
    // 检查本地存储使用
    const storageFiles = [
      'src/lib/services/local-data-manager.service.ts',
      'src/lib/services/secure-storage.service.ts',
      'src/lib/services/indexeddb.service.ts'
    ];
    
    storageFiles.forEach(storageFile => {
      const storagePath = path.join(process.cwd(), storageFile);
      if (fs.existsSync(storagePath)) {
        const content = fs.readFileSync(storagePath, 'utf8');
        
        // 检查敏感数据存储
        if (content.includes('localStorage') || content.includes('sessionStorage')) {
          if (content.includes('password') || 
              content.includes('token') || 
              content.includes('key') || 
              content.includes('secret')) {
            
            if (!content.includes('encrypt') && !content.includes('hash')) {
              this.addVulnerability('数据存储', 'high', `可能在本地存储中保存未加密的敏感数据: ${storageFile}`, {
                file: storageFile
              });
              
              this.addRecommendation('数据存储安全', '加密本地存储的敏感数据', 
                '使用加密库对敏感数据进行加密后再存储', 'high');
            }
          }
        }
      }
    });
  }

  // 检查XSS防护
  checkXssProtection() {
    console.log('🔍 检查XSS防护...');
    
    // 检查是否使用了危险的API
    const componentDirs = [
      'src/components',
      'src/app'
    ];
    
    componentDirs.forEach(componentDir => {
      const dirPath = path.join(process.cwd(), componentDir);
      if (fs.existsSync(dirPath)) {
        this.scanDirectoryForXssVulnerabilities(dirPath);
      }
    });
  }

  // 扫描目录查找XSS漏洞
  scanDirectoryForXssVulnerabilities(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryForXssVulnerabilities(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否使用了危险的API
        if (content.includes('dangerouslySetInnerHTML') || 
            content.includes('innerHTML') || 
            content.includes('eval(')) {
          
          this.addVulnerability('XSS漏洞', 'high', `可能存在XSS漏洞: ${filePath}`, {
            file: path.relative(process.cwd(), filePath)
          });
          
          this.addRecommendation('XSS防护', `修复 ${path.basename(filePath)} 中的XSS风险`, 
            '避免使用dangerouslySetInnerHTML和eval，对用户输入进行严格过滤', 'high');
        }
        
        // 检查是否直接渲染用户输入
        if ((content.includes('user') || content.includes('input') || content.includes('data')) && 
            content.includes('{') && 
            !content.includes('sanitize') && 
            !content.includes('escape')) {
          
          this.addVulnerability('XSS漏洞', 'medium', `可能直接渲染未过滤的用户输入: ${filePath}`, {
            file: path.relative(process.cwd(), filePath)
          });
          
          this.addRecommendation('XSS防护', `在 ${path.basename(filePath)} 中添加输入过滤`, 
            '使用DOMPurify等库过滤用户输入', 'high');
        }
      }
    });
  }

  // 检查CSRF防护
  checkCsrfProtection() {
    console.log('🔍 检查CSRF防护...');
    
    // 检查是否实现了CSRF令牌
    const apiDir = path.join(process.cwd(), 'src/app/api');
    if (fs.existsSync(apiDir)) {
      let foundCsrfProtection = false;
      
      // 递归查找CSRF保护
      const searchForCsrfProtection = (dir) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            searchForCsrfProtection(filePath);
          } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes('csrf') || 
                content.includes('xsrf') || 
                content.includes('token') && content.includes('verify')) {
              foundCsrfProtection = true;
              break;
            }
          }
        }
      };
      
      searchForCsrfProtection(apiDir);
      
      if (!foundCsrfProtection) {
        this.addVulnerability('CSRF漏洞', 'high', '可能缺少CSRF防护', {
          directory: 'src/app/api'
        });
        
        this.addRecommendation('CSRF防护', '实现CSRF令牌验证', 
          '为所有修改数据的API请求添加CSRF令牌验证', 'high');
      }
    }
  }

  // 检查文件上传安全
  checkFileUploadSecurity() {
    console.log('🔍 检查文件上传安全...');
    
    // 查找文件上传组件和处理程序
    const componentDirs = [
      'src/components',
      'src/app'
    ];
    
    let foundFileUpload = false;
    let foundFileValidation = false;
    
    // 递归查找文件上传和验证
    const searchForFileUpload = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          searchForFileUpload(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (content.includes('upload') || 
              content.includes('formData') || 
              content.includes('multipart') || 
              content.includes('File')) {
            
            foundFileUpload = true;
            
            if (content.includes('validate') || 
                content.includes('fileType') || 
                content.includes('extension') || 
                content.includes('mime')) {
              
              foundFileValidation = true;
            }
          }
        }
      }
    };
    
    componentDirs.forEach(dir => {
      searchForFileUpload(path.join(process.cwd(), dir));
    });
    
    if (foundFileUpload && !foundFileValidation) {
      this.addVulnerability('文件上传', 'high', '文件上传可能缺少验证', {
        issue: '未找到文件类型验证或大小限制'
      });
      
      this.addRecommendation('文件上传安全', '添加文件上传验证', 
        '验证文件类型、大小和内容，限制允许的文件扩展名', 'high');
    }
  }

  // 检查错误处理和日志记录
  checkErrorHandlingAndLogging() {
    console.log('🔍 检查错误处理和日志记录...');
    
    // 检查是否实现了全局错误处理
    const appDir = path.join(process.cwd(), 'src/app');
    if (fs.existsSync(appDir)) {
      let foundErrorBoundary = false;
      let foundLogging = false;
      
      // 递归查找错误边界和日志记录
      const searchForErrorHandling = (dir) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            searchForErrorHandling(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes('ErrorBoundary') || 
                content.includes('componentDidCatch') || 
                content.includes('error-') || 
                content.includes('try') && content.includes('catch')) {
              
              foundErrorBoundary = true;
            }
            
            if (content.includes('logger') || 
                content.includes('logging') || 
                content.includes('sentry') || 
                content.includes('track')) {
              
              foundLogging = true;
            }
          }
        }
      };
      
      searchForErrorHandling(appDir);
      
      if (!foundErrorBoundary) {
        this.addVulnerability('错误处理', 'medium', '可能缺少全局错误处理', {
          issue: '未找到错误边界组件'
        });
        
        this.addRecommendation('错误处理', '实现全局错误边界', 
          '添加React错误边界组件捕获前端异常', 'medium');
      }
      
      if (!foundLogging) {
        this.addVulnerability('日志记录', 'medium', '可能缺少日志记录', {
          issue: '未找到日志记录实现'
        });
        
        this.addRecommendation('日志记录', '实现日志记录系统', 
          '添加结构化日志记录，考虑使用Sentry等错误监控服务', 'medium');
      }
    }
  }

  // 检查安全头配置
  checkSecurityHeaders() {
    console.log('🔍 检查安全头配置...');
    
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      
      const securityHeaders = [
        { name: 'X-XSS-Protection', severity: 'medium' },
        { name: 'X-Content-Type-Options', severity: 'medium' },
        { name: 'X-Frame-Options', severity: 'high' },
        { name: 'Strict-Transport-Security', severity: 'high' },
        { name: 'Referrer-Policy', severity: 'low' },
        { name: 'Permissions-Policy', severity: 'low' }
      ];
      
      securityHeaders.forEach(header => {
        if (!content.includes(header.name)) {
          this.addVulnerability('安全头配置', header.severity, `缺少 ${header.name} 头`, {
            file: 'next.config.js',
            header: header.name
          });
          
          this.addRecommendation('安全头配置', `添加 ${header.name} 头`, 
            '在next.config.js中配置安全头', header.severity === 'high' ? 'high' : 'medium');
        }
      });
    }
  }

  // 运行所有检查
  runAllChecks() {
    console.log('🛡️ 开始AssetWise安全测试...\n');
    
    this.checkEnvironmentVariables();
    this.checkApiRouteSecurity();
    this.checkCorsConfiguration();
    this.checkContentSecurityPolicy();
    this.checkDependencySecurity();
    this.checkAuthImplementation();
    this.checkDataStorageSecurity();
    this.checkXssProtection();
    this.checkCsrfProtection();
    this.checkFileUploadSecurity();
    this.checkErrorHandlingAndLogging();
    this.checkSecurityHeaders();
    
    this.generateReport();
  }

  // 生成报告
  generateReport() {
    console.log('\n📊 安全测试报告');
    console.log('=================\n');
    
    // 按严重程度排序漏洞
    const sortedVulnerabilities = [...this.vulnerabilities].sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // 输出漏洞
    if (sortedVulnerabilities.length > 0) {
      console.log('🚨 发现的安全漏洞:');
      
      // 按类别分组
      const categorizedVulnerabilities = {};
      sortedVulnerabilities.forEach(vuln => {
        if (!categorizedVulnerabilities[vuln.category]) {
          categorizedVulnerabilities[vuln.category] = [];
        }
        categorizedVulnerabilities[vuln.category].push(vuln);
      });
      
      // 输出分组漏洞
      Object.keys(categorizedVulnerabilities).forEach(category => {
        console.log(`\n📌 ${category}:`);
        
        categorizedVulnerabilities[category].forEach((vuln, index) => {
          const severityIcon = vuln.severity === 'critical' ? '⛔' : 
                              vuln.severity === 'high' ? '🔴' : 
                              vuln.severity === 'medium' ? '🟠' : '🟡';
          
          console.log(`  ${index + 1}. ${severityIcon} [${vuln.severity.toUpperCase()}] ${vuln.description}`);
          if (vuln.details) {
            console.log(`     详情: ${JSON.stringify(vuln.details)}`);
          }
        });
      });
    } else {
      console.log('✅ 未发现安全漏洞');
    }
    
    console.log('\n');
    
    // 按优先级排序建议
    const sortedRecommendations = [...this.recommendations].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // 输出建议
    if (sortedRecommendations.length > 0) {
      console.log('💡 安全加固建议:');
      
      // 按类别分组
      const categorizedRecommendations = {};
      sortedRecommendations.forEach(rec => {
        if (!categorizedRecommendations[rec.category]) {
          categorizedRecommendations[rec.category] = [];
        }
        categorizedRecommendations[rec.category].push(rec);
      });
      
      // 输出分组建议
      Object.keys(categorizedRecommendations).forEach(category => {
        console.log(`\n📌 ${category}:`);
        
        categorizedRecommendations[category].forEach((rec, index) => {
          const priorityIcon = rec.priority === 'high' ? '🔴' : 
                              rec.priority === 'medium' ? '🟠' : '🟡';
          
          console.log(`  ${index + 1}. ${priorityIcon} ${rec.description}`);
          if (rec.implementation) {
            console.log(`     实现方法: ${rec.implementation}`);
          }
        });
      });
    } else {
      console.log('✨ 没有安全加固建议');
    }
    
    // 生成安全评分
    const vulnerabilityWeights = { critical: 25, high: 10, medium: 5, low: 2 };
    const totalVulnerabilityWeight = this.vulnerabilities.reduce((sum, vuln) => sum + vulnerabilityWeights[vuln.severity], 0);
    const baseScore = 100;
    const score = Math.max(0, Math.min(100, baseScore - totalVulnerabilityWeight));
    
    console.log('\n');
    console.log(`🔒 安全评分: ${score}/100`);
    
    // 生成风险等级
    let riskLevel = '';
    if (score >= 90) {
      riskLevel = '低风险';
    } else if (score >= 70) {
      riskLevel = '中低风险';
    } else if (score >= 50) {
      riskLevel = '中风险';
    } else if (score >= 30) {
      riskLevel = '中高风险';
    } else {
      riskLevel = '高风险';
    }
    
    console.log(`🚦 风险等级: ${riskLevel}`);
    
    // 生成漏洞统计
    const vulnStats = {
      critical: this.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: this.vulnerabilities.filter(v => v.severity === 'high').length,
      medium: this.vulnerabilities.filter(v => v.severity === 'medium').length,
      low: this.vulnerabilities.filter(v => v.severity === 'low').length
    };
    
    console.log('\n📊 漏洞统计:');
    console.log(`- 严重漏洞: ${vulnStats.critical}`);
    console.log(`- 高危漏洞: ${vulnStats.high}`);
    console.log(`- 中危漏洞: ${vulnStats.medium}`);
    console.log(`- 低危漏洞: ${vulnStats.low}`);
    console.log(`- 总计: ${this.vulnerabilities.length}`);
    
    // 生成总结
    console.log('\n📝 总结:');
    if (score >= 90) {