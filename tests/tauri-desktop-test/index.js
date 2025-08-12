/**
 * AssetWise Tauri桌面端功能测试入口文件
 */

const ConfigTester = require('./config-tester');
const CodeTester = require('./code-tester');
const CommunicationTester = require('./communication-tester');
const TauriDesktopFeaturesTester = require('./desktop-features-tester');

/**
 * 运行所有Tauri桌面端测试
 * @param {Object} mainTester 主测试器实例
 */
function runAllTauriTests(mainTester) {
  console.log('\n🖥️ 开始运行 Tauri 桌面端测试...');
  
  try {
    // 检查配置
    const configTester = new ConfigTester(mainTester);
    configTester.checkConfigurations();
    
    // 检查代码质量
    const codeTester = new CodeTester(mainTester);
    codeTester.checkCodeQuality();
    
    // 检查通信
    const communicationTester = new CommunicationTester(mainTester);
    communicationTester.checkCommunication();
    
    // 检查桌面端特有功能
    const desktopFeaturesTester = new TauriDesktopFeaturesTester(mainTester);
    desktopFeaturesTester.checkDesktopFeatures();
    
    console.log('✅ Tauri 桌面端测试完成');
  } catch (error) {
    console.error('❌ Tauri 桌面端测试失败:', error);
  }
}

module.exports = {
  runAllTauriTests
};