/**
 * AssetWise Tauri桌面端功能测试脚本 - 桌面功能测试
 */

const fs = require('fs');
const path = require('path');
const { findJSFiles, findRustFiles } = require('./utils');

class TauriDesktopFeaturesTester {
  constructor(mainTester) {
    this.mainTester = mainTester;
  }

  // 检查桌面端特有功能
  checkDesktopFeatures() {
    console.log('\n💻 检查桌面端特有功能...');
    
    try {
      // 检查文件系统访问
      const rustFiles = findRustFiles();
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
        this.mainTester.addResult('桌面功能', '文件系统访问', 'pass', '桌面端支持文件系统访问');
        console.log('✅ 桌面端支持文件系统访问');
      } else {
        this.mainTester.addResult('桌面功能', '文件系统访问', 'warning', '桌面端可能不支持文件系统访问');
        console.log('⚠️ 桌面端可能不支持文件系统访问');
      }
      
      if (hasDialogAccess) {
        this.mainTester.addResult('桌面功能', '对话框', 'pass', '桌面端支持原生对话框');
        console.log('✅ 桌面端支持原生对话框');
      } else {
        this.mainTester.addResult('桌面功能', '对话框', 'warning', '桌面端可能不支持原生对话框');
        console.log('⚠️ 桌面端可能不支持原生对话框');
      }
      
      if (hasClipboardAccess) {
        this.mainTester.addResult('桌面功能', '剪贴板', 'pass', '桌面端支持剪贴板操作');
        console.log('✅ 桌面端支持剪贴板操作');
      } else {
        this.mainTester.addResult('桌面功能', '剪贴板', 'warning', '桌面端可能不支持剪贴板操作');
        console.log('⚠️ 桌面端可能不支持剪贴板操作');
      }
      
      // 检查离线功能
      const jsFiles = findJSFiles();
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
        this.mainTester.addResult('桌面功能', '离线支持', 'pass', '桌面端支持离线操作');
        console.log('✅ 桌面端支持离线操作');
      } else {
        this.mainTester.addResult('桌面功能', '离线支持', 'warning', '桌面端可能不支持离线操作');
        console.log('⚠️ 桌面端可能不支持离线操作');
      }
    } catch (error) {
      this.mainTester.addResult('桌面功能', '桌面端特有功能', 'fail', `检查桌面端特有功能失败: ${error.message}`);
      console.error('❌ 检查桌面端特有功能失败:', error);
    }
  }
}

module.exports = TauriDesktopFeaturesTester;