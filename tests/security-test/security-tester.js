/**
 * AssetWise 安全测试脚本
 */

const fs = require('fs');
const path = require('path');
const { findJSFiles, findTSFiles } = require('../tauri-desktop-test/utils');

class SecurityTester {
  constructor(mainTester) {
    this.mainTester = mainTester;
    this.vulnerabilities = [];
  }

  // 运行所有安全测试
  runAllTests() {
    console.log('\n🔒 运行安全测试...');
    
    this.checkAuthImplementation();
    this.checkDataValidation();
    this.checkSensitiveDataExposure();
    this.checkCSRF();
    this.checkXSS();
    this.checkSQLInjection();
    this.checkSecureStorage();
    this.checkSecureComms();
    
    return this.vulnerabilities;
  }

  // 检查认证实现
  checkAuthImplementation() {
    console.log('检查认证实现...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasStrongAuth = false;
      let hasPasswordPolicy = false;
      let hasMFA = false;
      let hasSessionManagement = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查是否使用了Supabase Auth或其他认证库
        if (content.includes('supabase.auth') || content.includes('Auth.signIn') || 
            content.includes('useAuth') || content.includes('getSession')) {
          hasStrongAuth = true;
        }
        
        // 检查密码策略
        if (content.includes('password') && 
            (content.includes('validate') || content.includes('strength') || 
             content.includes('policy') || content.includes('regex'))) {
          hasPasswordPolicy = true;
        }
        
        // 检查多因素认证
        if (content.includes('mfa') || content.includes('2fa') || 
            content.includes('two-factor') || content.includes('otp')) {
          hasMFA = true;
        }
        
        // 检查会话管理
        if (content.includes('session') && 
            (content.includes('expire') || content.includes('timeout') || 
             content.includes('invalidate'))) {
          hasSessionManagement = true;
        }
      }
      
      if (hasStrongAuth) {
        this.mainTester.addResult('安全', '认证实现', 'pass', '使用了强认证机制');
      } else {
        this.vulnerabilities.push({
          type: '认证实现',
          severity: 'high',
          description: '未检测到强认证机制',
          recommendation: '实现或使用成熟的认证库如Supabase Auth'
        });
        this.mainTester.addResult('安全', '认证实现', 'fail', '未检测到强认证机制');
      }
      
      if (hasPasswordPolicy) {
        this.mainTester.addResult('安全', '密码策略', 'pass', '实现了密码策略');
      } else {
        this.vulnerabilities.push({
          type: '密码策略',
          severity: 'medium',
          description: '未检测到密码策略实现',
          recommendation: '实现密码强度检查和复杂度要求'
        });
        this.mainTester.addResult('安全', '密码策略', 'warning', '未检测到密码策略实现');
      }
      
      if (hasMFA) {
        this.mainTester.addResult('安全', '多因素认证', 'pass', '支持多因素认证');
      } else {
        this.vulnerabilities.push({
          type: '多因素认证',
          severity: 'medium',
          description: '未检测到多因素认证支持',
          recommendation: '考虑添加多因素认证以增强安全性'
        });
        this.mainTester.addResult('安全', '多因素认证', 'warning', '未检测到多因素认证支持');
      }
      
      if (hasSessionManagement) {
        this.mainTester.addResult('安全', '会话管理', 'pass', '实现了会话管理');
      } else {
        this.vulnerabilities.push({
          type: '会话管理',
          severity: 'medium',
          description: '未检测到会话管理实现',
          recommendation: '实现会话超时和失效机制'
        });
        this.mainTester.addResult('安全', '会话管理', 'warning', '未检测到会话管理实现');
      }
    } catch (error) {
      this.mainTester.addResult('安全', '认证实现', 'fail', `检查认证实现失败: ${error.message}`);
      console.error('检查认证实现失败:', error);
    }
  }

  // 检查数据验证
  checkDataValidation() {
    console.log('检查数据验证...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasInputValidation = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查是否有输入验证
        if ((content.includes('validate') || content.includes('validation') || 
             content.includes('schema') || content.includes('zod') || 
             content.includes('yup') || content.includes('joi')) && 
            (content.includes('input') || content.includes('form') || 
             content.includes('data'))) {
          hasInputValidation = true;
          break;
        }
      }
      
      if (hasInputValidation) {
        this.mainTester.addResult('安全', '数据验证', 'pass', '实现了输入数据验证');
      } else {
        this.vulnerabilities.push({
          type: '数据验证',
          severity: 'high',
          description: '未检测到输入数据验证',
          recommendation: '使用验证库如Zod、Yup或Joi验证所有输入数据'
        });
        this.mainTester.addResult('安全', '数据验证', 'fail', '未检测到输入数据验证');
      }
    } catch (error) {
      this.mainTester.addResult('安全', '数据验证', 'fail', `检查数据验证失败: ${error.message}`);
      console.error('检查数据验证失败:', error);
    }
  }

  // 检查敏感数据暴露
  checkSensitiveDataExposure() {
    console.log('检查敏感数据暴露...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasHardcodedSecrets = false;
      let hasSecureStorage = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查硬编码的密钥和凭证
        if ((content.includes('api_key') || content.includes('apiKey') || 
             content.includes('secret') || content.includes('password') || 
             content.includes('token')) && 
            (content.includes('=') || content.includes(':')) && 
            !content.includes('process.env') && !content.includes('env.')) {
          hasHardcodedSecrets = true;
        }
        
        // 检查安全存储
        if (content.includes('encrypt') || content.includes('decrypt') || 
            content.includes('crypto') || content.includes('secure')) {
          hasSecureStorage = true;
        }
      }
      
      if (!hasHardcodedSecrets) {
        this.mainTester.addResult('安全', '硬编码密钥', 'pass', '未检测到硬编码密钥');
      } else {
        this.vulnerabilities.push({
          type: '硬编码密钥',
          severity: 'critical',
          description: '检测到可能的硬编码密钥或凭证',
          recommendation: '使用环境变量或安全的密钥管理解决方案'
        });
        this.mainTester.addResult('安全', '硬编码密钥', 'fail', '检测到可能的硬编码密钥或凭证');
      }
      
      if (hasSecureStorage) {
        this.mainTester.addResult('安全', '敏感数据存储', 'pass', '使用了安全存储机制');
      } else {
        this.vulnerabilities.push({
          type: '敏感数据存储',
          severity: 'high',
          description: '未检测到敏感数据的安全存储机制',
          recommendation: '使用加密存储敏感数据'
        });
        this.mainTester.addResult('安全', '敏感数据存储', 'warning', '未检测到敏感数据的安全存储机制');
      }
    } catch (error) {
      this.mainTester.addResult('安全', '敏感数据暴露', 'fail', `检查敏感数据暴露失败: ${error.message}`);
      console.error('检查敏感数据暴露失败:', error);
    }
  }

  // 检查CSRF防护
  checkCSRF() {
    console.log('检查CSRF防护...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasCSRFProtection = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查CSRF令牌或保护
        if (content.includes('csrf') || content.includes('xsrf') || 
            (content.includes('token') && content.includes('form'))) {
          hasCSRFProtection = true;
          break;
        }
      }
      
      if (hasCSRFProtection) {
        this.mainTester.addResult('安全', 'CSRF防护', 'pass', '实现了CSRF防护');
      } else {
        this.vulnerabilities.push({
          type: 'CSRF防护',
          severity: 'medium',
          description: '未检测到CSRF防护机制',
          recommendation: '实现CSRF令牌验证'
        });
        this.mainTester.addResult('安全', 'CSRF防护', 'warning', '未检测到CSRF防护机制');
      }
    } catch (error) {
      this.mainTester.addResult('安全', 'CSRF防护', 'fail', `检查CSRF防护失败: ${error.message}`);
      console.error('检查CSRF防护失败:', error);
    }
  }

  // 检查XSS防护
  checkXSS() {
    console.log('检查XSS防护...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasXSSProtection = false;
      let hasDangerousHTML = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查XSS防护
        if (content.includes('sanitize') || content.includes('escape') || 
            content.includes('purify') || content.includes('DOMPurify')) {
          hasXSSProtection = true;
        }
        
        // 检查危险的HTML插入
        if (content.includes('dangerouslySetInnerHTML') || 
            content.includes('innerHTML') || 
            content.includes('document.write')) {
          hasDangerousHTML = true;
        }
      }
      
      if (hasXSSProtection || !hasDangerousHTML) {
        this.mainTester.addResult('安全', 'XSS防护', 'pass', '实现了XSS防护或未使用危险的HTML插入');
      } else {
        this.vulnerabilities.push({
          type: 'XSS防护',
          severity: 'high',
          description: '检测到危险的HTML插入但未实现XSS防护',
          recommendation: '使用DOMPurify等库净化HTML内容'
        });
        this.mainTester.addResult('安全', 'XSS防护', 'fail', '检测到危险的HTML插入但未实现XSS防护');
      }
    } catch (error) {
      this.mainTester.addResult('安全', 'XSS防护', 'fail', `检查XSS防护失败: ${error.message}`);
      console.error('检查XSS防护失败:', error);
    }
  }

  // 检查SQL注入防护
  checkSQLInjection() {
    console.log('检查SQL注入防护...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasRawSQL = false;
      let hasORM = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查原始SQL查询
        if ((content.includes('SELECT') || content.includes('INSERT') || 
             content.includes('UPDATE') || content.includes('DELETE')) && 
            content.includes('FROM') && 
            (content.includes('execute') || content.includes('query') || 
             content.includes('sql'))) {
          hasRawSQL = true;
        }
        
        // 检查ORM使用
        if (content.includes('prisma') || content.includes('sequelize') || 
            content.includes('typeorm') || content.includes('supabase') || 
            content.includes('knex')) {
          hasORM = true;
        }
      }
      
      if (!hasRawSQL || hasORM) {
        this.mainTester.addResult('安全', 'SQL注入防护', 'pass', '未检测到原始SQL查询或使用了ORM');
      } else {
        this.vulnerabilities.push({
          type: 'SQL注入防护',
          severity: 'critical',
          description: '检测到原始SQL查询但未使用ORM或参数化查询',
          recommendation: '使用ORM或参数化查询防止SQL注入'
        });
        this.mainTester.addResult('安全', 'SQL注入防护', 'fail', '检测到原始SQL查询但未使用ORM或参数化查询');
      }
    } catch (error) {
      this.mainTester.addResult('安全', 'SQL注入防护', 'fail', `检查SQL注入防护失败: ${error.message}`);
      console.error('检查SQL注入防护失败:', error);
    }
  }

  // 检查安全存储
  checkSecureStorage() {
    console.log('检查安全存储...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasSecureStorage = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查安全存储
        if ((content.includes('encrypt') || content.includes('decrypt') || 
             content.includes('crypto')) && 
            (content.includes('localStorage') || content.includes('sessionStorage') || 
             content.includes('indexedDB') || content.includes('storage'))) {
          hasSecureStorage = true;
          break;
        }
      }
      
      if (hasSecureStorage) {
        this.mainTester.addResult('安全', '安全存储', 'pass', '使用了安全存储机制');
      } else {
        this.vulnerabilities.push({
          type: '安全存储',
          severity: 'medium',
          description: '未检测到客户端安全存储机制',
          recommendation: '加密敏感数据后再存储到本地存储'
        });
        this.mainTester.addResult('安全', '安全存储', 'warning', '未检测到客户端安全存储机制');
      }
    } catch (error) {
      this.mainTester.addResult('安全', '安全存储', 'fail', `检查安全存储失败: ${error.message}`);
      console.error('检查安全存储失败:', error);
    }
  }

  // 检查安全通信
  checkSecureComms() {
    console.log('检查安全通信...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasHTTPS = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查HTTPS使用
        if (content.includes('https://') || 
            (content.includes('http') && !content.includes('http://'))) {
          hasHTTPS = true;
          break;
        }
      }
      
      if (hasHTTPS) {
        this.mainTester.addResult('安全', '安全通信', 'pass', '使用了HTTPS通信');
      } else {
        this.vulnerabilities.push({
          type: '安全通信',
          severity: 'high',
          description: '未检测到HTTPS通信',
          recommendation: '确保所有API通信使用HTTPS'
        });
        this.mainTester.addResult('安全', '安全通信', 'warning', '未检测到HTTPS通信');
      }
    } catch (error) {
      this.mainTester.addResult('安全', '安全通信', 'fail', `检查安全通信失败: ${error.message}`);
      console.error('检查安全通信失败:', error);
    }
  }
}

module.exports = SecurityTester;