/**
 * AssetWise Tauri桌面端功能测试脚本
 * 测试桌面应用的功能和跨平台兼容性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TauriDesktopTester {
  constructor() {
    this.testResults = [];
  }

  addResult(category, feature, status, message, details = null) {
    this.testResults.push({
      category,
      feature,
      status, // 'pass', 'fail', 'warning', 'info'
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // 检查Tauri配置
  checkTauriConfig() {
    console.log('🔍 检查Tauri配置...');
    
    try {
      const tauriConfigPath = path.join(process.cwd(), 'src-tauri/tauri.conf.json');
      
      if (!fs.existsSync(tauriConfigPath)) {
        this.addResult('配置', 'Tauri配置', 'warning', 'Tauri配置文件不存在');
        console.log('⚠️ Tauri配置文件不存在');
        return;
      }
      
      const content = fs.readFileSync(tauriConfigPath, 'utf8');
      const config = JSON.parse(content);
      
      // 检查基本配置
      if (config.package && config.package.productName) {
        this.addResult('配置', '产品名称', 'pass', `产品名称已配置: ${config.package.productName}`);
        console.log(`✅ 产品名称已配置: ${config.package.productName}`);
      } else {
        this.addResult('配置', '产品名称', 'warning', '产品名称未配置');
        console.log('⚠️ 产品名称未配置');
      }
      
      // 检查权限配置
      if (config.tauri && config.tauri.allowlist) {
        const allowlist = config.tauri.allowlist;
        
        // 检查文件系统权限
        if (allowlist.fs && allowlist.fs.scope) {
          this.addResult('权限', '文件系统', 'pass', '文件系统权限已配置');
          console.log('✅ 文件系统权限已配置');
        } else {
          this.addResult('权限', '文件系统', 'warning', '文件系统权限未配置或范围受限');
          console.log('⚠️ 文件系统权限未配置或范围受限');
        }
        
        // 检查对话框权限
        if (allowlist.dialog) {
          this.addResult('权限', '对话框', 'pass', '对话框权限已配置');
          console.log('✅ 对话框权限已配置');
        } else {
          this.addResult('权限', '对话框', 'warning', '对话框权限未配置');
          console.log('⚠️ 对话框权限未配置');
        }
        
        // 检查HTTP请求权限
        if (allowlist.http) {
          this.addResult('权限', 'HTTP请求', 'pass', 'HTTP请求权限已配置');
          console.log('✅ HTTP请求权限已配置');
        } else {
          this.addResult('权限', 'HTTP请求', 'warning', 'HTTP请求权限未配置');
          console.log('⚠️ HTTP请求权限未配置');
        }
      } else {
        this.addResult('配置', '权限列表', 'warning', '权限列表未配置');
        console.log('⚠️ 权限列表未配置');
      }
      
      // 检查构建配置
      if (config.build && config.build.beforeBuildCommand && config.build.beforeDevCommand) {
        this.addResult('配置', '构建命令', 'pass', '构建命令已配置');
        console.log('✅ 构建命令已配置');
      } else {
        this.addResult('配置', '构建命令', 'warning', '构建命令未完全配置');
        console.log('⚠️ 构建命令未完全配置');
      }
    } catch (error) {
      this.addResult('配置', 'Tauri配置', 'fail', `检查Tauri配置失败: ${error.message}`);
      console.error('❌ 检查Tauri配置失败:', error);
    }
  }

  // 检查Rust代码
  checkRustCode() {
    console.log('\n🦀 检查Rust代码...');
    
    try {
      const mainRsPath = path.join(process.cwd(), 'src-tauri/src/main.rs');
      
      if (!fs.existsSync(mainRsPath)) {
        this.addResult('代码', 'Rust主文件', 'warning', 'Rust主文件不存在');
        console.log('⚠️ Rust主文件不存在');
        return;
      }
      
      const content = fs.readFileSync(mainRsPath, 'utf8');
      
      // 检查命令处理
      const hasCommands = content.includes('#[tauri::command]') || content.includes('#[command]');
      if (hasCommands) {
        this.addResult('代码', '命令处理', 'pass', 'Rust代码包含命令处理');
        console.log('✅ Rust代码包含命令处理');
      } else {
        this.addResult('代码', '命令处理', 'warning', 'Rust代码可能缺少命令处理');
        console.log('⚠️ Rust代码可能缺少命令处理');
      }
      
      // 检查文件系统操作
      const hasFileSystem = content.includes('std::fs') || content.includes('fs::');
      if (hasFileSystem) {
        this.addResult('代码', '文件系统操作', 'pass', 'Rust代码包含文件系统操作');
        console.log('✅ Rust代码包含文件系统操作');
      } else {
        this.addResult('代码', '文件系统操作', 'warning', 'Rust代码可能缺少文件系统操作');
        console.log('⚠️ Rust代码可能缺少文件系统操作');
      }
      
      // 检查错误处理
      const hasErrorHandling = content.includes('Result<') || content.includes('.unwrap_or_else') || content.includes('.map_err');
      if (hasErrorHandling) {
        this.addResult('代码', '错误处理', 'pass', 'Rust代码包含错误处理');
        console.log('✅ Rust代码包含错误处理');
      } else {
        this.addResult('代码', '错误处理', 'warning', 'Rust代码可能缺少错误处理');
        console.log('⚠️ Rust代码可能缺少错误处理');
      }
      
      // 检查安全性
      const hasSecurity = !content.includes('.unwrap()') || content.includes('unsafe {');
      if (hasSecurity) {
        this.addResult('代码', '安全性', 'pass', 'Rust代码注重安全性');
        console.log('✅ Rust代码注重安全性');
      } else {
        this.addResult('代码', '安全性', 'warning', 'Rust代码可能存在安全隐患');
        console.log('⚠️ Rust代码可能存在安全隐患');
      }
    } catch (error) {
      this.addResult('代码', 'Rust代码', 'fail', `检查Rust代码失败: ${error.message}`);
      console.error('❌ 检查Rust代码失败:', error);
    }
  }
  
  // 检查JS与Rust的通信
  checkJSRustCommunication() {
    console.log('\n🔄 检查JS与Rust通信...');
    
    try {
      // 检查前端调用Rust的代码
      const jsFiles = this.findJSFiles();
      let hasTauriImport = false;
      let hasTauriInvoke = false;
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('@tauri-apps/api') || content.includes('tauri-apps/api')) {
          hasTauriImport = true;
        }
        
        if (content.includes('invoke(') || content.includes('invoke(\'') || content.includes('invoke("')) {
          hasTauriInvoke = true;
        }
        
        if (hasTauriImport && hasTauriInvoke) {
          break;
        }
      }
      
      if (hasTauriImport) {
        this.addResult('通信', 'Tauri API导入', 'pass', '前端代码导入了Tauri API');
        console.log('✅ 前端代码导入了Tauri API');
      } else {
        this.addResult('通信', 'Tauri API导入', 'warning', '前端代码可能未导入Tauri API');
        console.log('⚠️ 前端代码可能未导入Tauri API');
      }
      
      if (hasTauriInvoke) {
        this.addResult('通信', 'Tauri命令调用', 'pass', '前端代码调用了Tauri命令');
        console.log('✅ 前端代码调用了Tauri命令');
      } else {
        this.addResult('通信', 'Tauri命令调用', 'warning', '前端代码可能未调用Tauri命令');
        console.log('⚠️ 前端代码可能未调用Tauri命令');
      }
      
      // 检查Rust端命令导出
      const rustFiles = this.findRustFiles();
      let hasCommandExport = false;
      
      for (const file of rustFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('#[tauri::command]') || content.includes('#[command]')) {
          hasCommandExport = true;
          break;
        }
      }
      
      if (hasCommandExport) {
        this.addResult('通信', 'Rust命令导出', 'pass', 'Rust代码导出了命令');
        console.log('✅ Rust代码导出了命令');
      } else {
        this.addResult('通信', 'Rust命令导出', 'warning', 'Rust代码可能未导出命令');
        console.log('⚠️ Rust代码可能未导出命令');
      }
    } catch (error) {
      this.addResult('通信', 'JS-Rust通信', 'fail', `检查JS-Rust通信失败: ${error.message}`);
      console.error('❌ 检查JS-Rust通信失败:', error);
    }
  }
  
  // 检查桌面端特有功能
  checkDesktopFeatures() {
    console.log('\n💻 检查桌面端特有功能...');
    
    try {
      // 检查文件系统访问
      const rustFiles = this.findRustFiles();
      let hasFileSystemAccess = false;
      let hasDialogAccess = false;
      let hasClipboardAccess = false;
      
      for (const file of rustFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('std::fs') || content.includes('fs::')) {
          hasFileSystemAccess = true;
        }
        
        if (content.includes('dialog::') || content.includes('tauri::dialog')) {
          hasDialogAccess = true;
        }
        
        if (content.includes('clipboard::') || content.includes('tauri::clipboard')) {
          hasClipboardAccess = true;
        }
      }
      
      if (hasFileSystemAccess) {
        this.addResult('桌面功能', '文件系统访问', 'pass', '桌面端支持文件系统访问');
        console.log('✅ 桌面端支持文件系统访问');
      } else {
        this.addResult('桌面功能', '文件系统访问', 'warning', '桌面端可能不支持文件系统访问');
        console.log('⚠️ 桌面端可能不支持文件系统访问');
      }
      
      if (hasDialogAccess) {
        this.addResult('桌面功能', '对话框', 'pass', '桌面端支持原生对话框');
        console.log('✅ 桌面端支持原生对话框');
      } else {
        this.addResult('桌面功能', '对话框', 'warning', '桌面端可能不支持原生对话框');
        console.log('⚠️ 桌面端可能不支持原生对话框');
      }
      
      if (hasClipboardAccess) {
        this.addResult('桌面功能', '剪贴板', 'pass', '桌面端支持剪贴板操作');
        console.log('✅ 桌面端支持剪贴板操作');
      } else {
        this.addResult('桌面功能', '剪贴板', 'warning', '桌面端可能不支持剪贴板操作');
        console.log('⚠️ 桌面端可能不支持剪贴板操作');
      }
      
      // 检查离线功能
      const jsFiles = this.findJSFiles();
      let hasOfflineSupport = false;
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('navigator.onLine') || content.includes('offline') || 
            content.includes('IndexedDB') || content.includes('localStorage')) {
          hasOfflineSupport = true;
          break;
        }
      }
      
      if (hasOfflineSupport) {
        this.addResult('桌面功能', '离线支持', 'pass', '桌面端支持离线操作');
        console.log('✅ 桌面端支持离线操作');
      } else {
        this.addResult('桌面功能', '离线支持', 'warning', '桌面端可能不支持离线操作');
        console.log('⚠️ 桌面端可能不支持离线操作');
      }
    } catch (error) {
      this.addResult('桌面功能', '桌面端特有功能', 'fail', `检查桌面端特有功能失败: ${error.message}`);
      console.error('❌ 检查桌面端特有功能失败:', error);
    }
  }
  
  // 检查安全性
  checkSecurity() {
    console.log('\n🔒 检查安全性...');
    
    try {
      // 检查CSP配置
      const tauriConfigPath = path.join(process.cwd(), 'src-tauri/tauri.conf.json');
      
      if (fs.existsSync(tauriConfigPath)) {
        const content = fs.readFileSync(tauriConfigPath, 'utf8');
        const config = JSON.parse(content);
        
        if (config.tauri && config.tauri.security && config.tauri.security.csp) {
          this.addResult('安全', 'CSP配置', 'pass', '已配置内容安全策略');
          console.log('✅ 已配置内容安全策略');
        } else {
          this.addResult('安全', 'CSP配置', 'warning', '未配置内容安全策略');
          console.log('⚠️ 未配置内容安全策略');
        }
      }
      
      // 检查权限限制
      const rustFiles = this.findRustFiles();
      let hasPermissionCheck = false;
      
      for (const file of rustFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('permission') || content.includes('Permission') || 
            content.includes('authorize') || content.includes('Authorize')) {
          hasPermissionCheck = true;
          break;
        }
      }
      
      if (hasPermissionCheck) {
        this.addResult('安全', '权限检查', 'pass', '代码包含权限检查');
        console.log('✅ 代码包含权限检查');
      } else {
        this.addResult('安全', '权限检查', 'warning', '代码可能缺少权限检查');
        console.log('⚠️ 代码可能缺少权限检查');
      }
      
      // 检查输入验证
      const jsFiles = this.findJSFiles();
      let hasInputValidation = false;
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('validate') || content.includes('validation') || 
            content.includes('sanitize') || content.includes('escape')) {
          hasInputValidation = true;
          break;
        }
      }
      
      if (hasInputValidation) {
        this.addResult('安全', '输入验证', 'pass', '代码包含输入验证');
        console.log('✅ 代码包含输入验证');
      } else {
        this.addResult('安全', '输入验证', 'warning', '代码可能缺少输入验证');
        console.log('⚠️ 代码可能缺少输入验证');
      }
    } catch (error) {
      this.addResult('安全', '安全性检查', 'fail', `安全性检查失败: ${error.message}`);
      console.error('❌ 安全性检查失败:', error);
    }
  }
  
  // 检查跨平台兼容性
  checkCrossPlatformCompatibility() {
    console.log('\n🌐 检查跨平台兼容性...');
    
    try {
      const tauriConfigPath = path.join(process.cwd(), 'src-tauri/tauri.conf.json');
      
      if (fs.existsSync(tauriConfigPath)) {
        const content = fs.readFileSync(tauriConfigPath, 'utf8');
        const config = JSON.parse(content);
        
        // 检查图标配置
        if (config.tauri && config.tauri.bundle && config.tauri.bundle.icon) {
          const iconPath = config.tauri.bundle.icon;
          const iconDir = path.join(process.cwd(), 'src-tauri/icons');
          
          if (fs.existsSync(iconDir)) {
            const iconFiles = fs.readdirSync(iconDir);
            
            // 检查Windows图标
            const hasWindowsIcon = iconFiles.some(file => file.endsWith('.ico'));
            if (hasWindowsIcon) {
              this.addResult('跨平台', 'Windows图标', 'pass', '已配置Windows图标');
              console.log('✅ 已配置Windows图标');
            } else {
              this.addResult('跨平台', 'Windows图标', 'warning', '未配置Windows图标');
              console.log('⚠️ 未配置Windows图标');
            }
            
            // 检查macOS图标
            const hasMacOSIcon = iconFiles.some(file => file.endsWith('.icns'));
            if (hasMacOSIcon) {
              this.addResult('跨平台', 'macOS图标', 'pass', '已配置macOS图标');
              console.log('✅ 已配置macOS图标');
            } else {
              this.addResult('跨平台', 'macOS图标', 'warning', '未配置macOS图标');
              console.log('⚠️ 未配置macOS图标');
            }
            
            // 检查Linux图标
            const hasLinuxIcon = iconFiles.some(file => file.endsWith('.png'));
            if (hasLinuxIcon) {
              this.addResult('跨平台', 'Linux图标', 'pass', '已配置Linux图标');
              console.log('✅ 已配置Linux图标');
            } else {
              this.addResult('跨平台', 'Linux图标', 'warning', '未配置Linux图标');
              console.log('⚠️ 未配置Linux图标');
            }
          } else {
            this.addResult('跨平台', '图标目录', 'warning', '图标目录不存在');
            console.log('⚠️ 图标目录不存在');
          }
        } else {
          this.addResult('跨平台', '图标配置', 'warning', '未配置图标');
          console.log('⚠️ 未配置图标');
        }
        
        // 检查平台特定配置
        if (config.tauri && config.tauri.bundle) {
          const bundle = config.tauri.bundle;
          
          // 检查Windows配置
          if (bundle.windows) {
            this.addResult('跨平台', 'Windows配置', 'pass', '已配置Windows特定选项');
            console.log('✅ 已配置Windows特定选项');
          } else {
            this.addResult('跨平台', 'Windows配置', 'warning', '未配置Windows特定选项');
            console.log('⚠️ 未配置Windows特定选项');
          }
          
          // 检查macOS配置
          if (bundle.macOS) {
            this.addResult('跨平台', 'macOS配置', 'pass', '已配置macOS特定选项');
            console.log('✅ 已配置macOS特定选项');
          } else {
            this.addResult('跨平台', 'macOS配置', 'warning', '未配置macOS特定选项');
            console.log('⚠️ 未配置macOS特定选项');
          }
          
          // 检查Linux配置
          if (bundle.linux) {
            this.addResult('跨平台', 'Linux配置', 'pass', '已配置Linux特定选项');
            console.log('✅ 已配置Linux特定选项');
          } else {
            this.addResult('跨平台', 'Linux配置', 'warning', '未配置Linux特定选项');
            console.log('⚠️ 未配置Linux特定选项');
          }
        }
      }
      
      // 检查路径处理
      const jsFiles = this.findJSFiles();
      let hasPathHandling = false;
      
      for (const file of jsFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('path.sep') || content.includes('path.join') || 
            content.includes('path.resolve') || content.includes('path.normalize')) {
          hasPathHandling = true;
          break;
        }
      }
      
      if (hasPathHandling) {
        this.addResult('跨平台', '路径处理', 'pass', '代码包含跨平台路径处理');
        console.log('✅ 代码包含跨平台路径处理');
      } else {
        this.addResult('跨平台', '路径处理', 'warning', '代码可能缺少跨平台路径处理');
        console.log('⚠️ 代码可能缺少跨平台路径处理');
      }
    } catch (error) {
      this.addResult('跨平台', '跨平台兼容性', 'fail', `跨平台兼容性检查失败: ${error.message}`);
      console.error('❌ 跨平台兼容性检查失败:', error);
    }
  }
  
  // 辅助方法：查找JS文件
  findJSFiles() {
    const result = [];
    const srcDir = path.join(process.cwd(), 'src');
    
    if (fs.existsSync(srcDir)) {
      this.findFilesRecursive(srcDir, ['.js', '.jsx', '.ts', '.tsx'], result);
    }
    
    return result;
  }
  
  // 辅助方法：查找Rust文件
  findRustFiles() {
    const result = [];
    const srcTauriDir = path.join(process.cwd(), 'src-tauri/src');
    
    if (fs.existsSync(srcTauriDir)) {
      this.findFilesRecursive(srcTauriDir, ['.rs'], result);
    }
    
    return result;
  }
  
  // 辅助方法：递归查找文件
  findFilesRecursive(dir, extensions, result) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.findFilesRecursive(filePath, extensions, result);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        result.push(filePath);
      }
    }
  }
  
  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始Tauri桌面端功能测试...\n');
    
    this.checkTauriConfig();
    this.checkRustCode();
    this.checkJSRustCommunication();
    this.checkDesktopFeatures();
    this.checkSecurity();
    this.checkCrossPlatformCompatibility();
    
    console.log('\n📊 测试结果汇总:');
    
    const passCount = this.testResults.filter(r => r.status === 'pass').length;
    const warnCount = this.testResults.filter(r => r.status === 'warning').length;
    const failCount = this.testResults.filter(r => r.status === 'fail').length;
    
    console.log(`✅ 通过: ${passCount}`);
    console.log(`⚠️ 警告: ${warnCount}`);
    console.log(`❌ 失败: ${failCount}`);
    
    return {
      summary: {
        pass: passCount,
        warning: warnCount,
        fail: failCount,
        total: this.testResults.length
      },
      results: this.testResults
    };
  }
  
  // 生成测试报告
  generateReport() {
    const results = this.runAllTests();
    
    const report = {
      title: 'AssetWise Tauri桌面端功能测试报告',
      timestamp: new Date().toISOString(),
      summary: results.summary,
      details: results.results,
      recommendations: this.generateRecommendations(results.results)
    };
    
    // 保存报告到文件
    const reportPath = path.join(process.cwd(), 'tauri-desktop-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`\n📝 测试报告已保存到: ${reportPath}`);
    
    return report;
  }
  
  // 生成建议
  generateRecommendations(results) {
    const recommendations = [];
    
    // 根据警告和失败生成建议
    const warnings = results.filter(r => r.status === 'warning');
    const failures = results.filter(r => r.status === 'fail');
    
    for (const warning of warnings) {
      switch (warning.feature) {
        case 'Tauri配置':
          recommendations.push('完善Tauri配置文件，确保所有必要的配置项都已设置。');
          break;
        case '文件系统':
          recommendations.push('配置文件系统权限，确保应用可以访问必要的文件和目录。');
          break;
        case '对话框':
          recommendations.push('添加对话框权限，以支持文件选择和消息提示等功能。');
          break;
        case 'HTTP请求':
          recommendations.push('添加HTTP请求权限，以支持与服务器的通信。');
          break;
        case '命令处理':
          recommendations.push('在Rust代码中添加命令处理，以支持前端调用原生功能。');
          break;
        case '文件系统操作':
          recommendations.push('在Rust代码中添加文件系统操作，以支持文件读写功能。');
          break;
        case '错误处理':
          recommendations.push('完善Rust代码的错误处理，避免使用unwrap()，改用更安全的错误处理方式。');
          break;
        case '安全性':
          recommendations.push('提高Rust代码的安全性，避免使用unsafe代码块，减少unwrap()的使用。');
          break;
        case 'Tauri API导入':
          recommendations.push('在前端代码中导入Tauri API，以便调用原生功能。');
          break;
        case 'Tauri命令调用':
          recommendations.push('在前端代码中添加Tauri命令调用，以便