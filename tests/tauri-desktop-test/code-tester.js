/**
 * AssetWise Tauri桌面端功能测试脚本 - 代码质量测试
 */

const fs = require('fs');
const path = require('path');
const { findJSFiles, findTSFiles, findRustFiles } = require('./utils');

class CodeTester {
  constructor(mainTester) {
    this.mainTester = mainTester;
  }

  // 检查代码质量
  checkCodeQuality() {
    console.log('\n🧪 检查代码质量...');
    
    try {
      // 检查TypeScript类型
      this.checkTypeScriptTypes();
      
      // 检查错误处理
      this.checkErrorHandling();
      
      // 检查代码组织
      this.checkCodeOrganization();
      
      // 检查Rust代码质量
      this.checkRustCodeQuality();
    } catch (error) {
      this.mainTester.addResult('代码质量', '代码质量检查', 'fail', `检查代码质量失败: ${error.message}`);
      console.error('❌ 检查代码质量失败:', error);
    }
  }

  // 检查TypeScript类型
  checkTypeScriptTypes() {
    console.log('检查TypeScript类型...');
    
    const tsFiles = findTSFiles();
    let hasStrictTypes = false;
    let hasAnyType = false;
    let hasTypeDefinitions = false;
    
    // 检查tsconfig.json
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        if (tsconfig.compilerOptions && tsconfig.compilerOptions.strict === true) {
          hasStrictTypes = true;
        }
      } catch (error) {
        console.error('解析tsconfig.json失败:', error);
      }
    }
    
    // 检查类型文件
    const typeFiles = tsFiles.filter(file => file.includes('.d.ts'));
    if (typeFiles.length > 0) {
      hasTypeDefinitions = true;
    }
    
    // 检查any类型使用
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(': any') || content.includes('as any')) {
        hasAnyType = true;
        break;
      }
    }
    
    if (hasStrictTypes) {
      this.mainTester.addResult('代码质量', 'TypeScript严格模式', 'pass', '启用了TypeScript严格模式');
      console.log('✅ 启用了TypeScript严格模式');
    } else {
      this.mainTester.addResult('代码质量', 'TypeScript严格模式', 'warning', '未启用TypeScript严格模式');
      console.log('⚠️ 未启用TypeScript严格模式');
    }
    
    if (hasTypeDefinitions) {
      this.mainTester.addResult('代码质量', '类型定义', 'pass', '项目包含类型定义文件');
      console.log('✅ 项目包含类型定义文件');
    } else {
      this.mainTester.addResult('代码质量', '类型定义', 'info', '项目可能缺少类型定义文件');
      console.log('ℹ️ 项目可能缺少类型定义文件');
    }
    
    if (hasAnyType) {
      this.mainTester.addResult('代码质量', 'any类型使用', 'warning', '检测到any类型的使用');
      console.log('⚠️ 检测到any类型的使用');
    } else {
      this.mainTester.addResult('代码质量', 'any类型使用', 'pass', '未检测到any类型的使用');
      console.log('✅ 未检测到any类型的使用');
    }
  }

  // 检查错误处理
  checkErrorHandling() {
    console.log('检查错误处理...');
    
    const files = [...findJSFiles(), ...findTSFiles()];
    let hasTryCatch = false;
    let hasErrorBoundary = false;
    let hasErrorLogging = false;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查try-catch使用
      if (content.includes('try {') && content.includes('catch')) {
        hasTryCatch = true;
      }
      
      // 检查React错误边界
      if (content.includes('ErrorBoundary') || 
          (content.includes('componentDidCatch') && content.includes('getDerivedStateFromError'))) {
        hasErrorBoundary = true;
      }
      
      // 检查错误日志记录
      if ((content.includes('console.error') || content.includes('logger') || 
           content.includes('log(') || content.includes('captureException')) && 
          content.includes('error')) {
        hasErrorLogging = true;
      }
    }
    
    if (hasTryCatch) {
      this.mainTester.addResult('代码质量', '异常捕获', 'pass', '使用了try-catch异常捕获');
      console.log('✅ 使用了try-catch异常捕获');
    } else {
      this.mainTester.addResult('代码质量', '异常捕获', 'warning', '未检测到try-catch异常捕获');
      console.log('⚠️ 未检测到try-catch异常捕获');
    }
    
    if (hasErrorBoundary) {
      this.mainTester.addResult('代码质量', '错误边界', 'pass', '使用了React错误边界');
      console.log('✅ 使用了React错误边界');
    } else {
      this.mainTester.addResult('代码质量', '错误边界', 'warning', '未检测到React错误边界');
      console.log('⚠️ 未检测到React错误边界');
    }
    
    if (hasErrorLogging) {
      this.mainTester.addResult('代码质量', '错误日志', 'pass', '实现了错误日志记录');
      console.log('✅ 实现了错误日志记录');
    } else {
      this.mainTester.addResult('代码质量', '错误日志', 'warning', '未检测到错误日志记录');
      console.log('⚠️ 未检测到错误日志记录');
    }
  }

  // 检查代码组织
  checkCodeOrganization() {
    console.log('检查代码组织...');
    
    // 检查目录结构
    const directories = [
      'components',
      'pages',
      'lib',
      'utils',
      'hooks',
      'styles',
      'public',
      'src-tauri'
    ];
    
    let wellOrganized = true;
    const missingDirs = [];
    
    for (const dir of directories) {
      const dirPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(dirPath)) {
        wellOrganized = false;
        missingDirs.push(dir);
      }
    }
    
    // 检查组件复用
    const files = [...findJSFiles(), ...findTSFiles()];
    let hasComponentReuse = false;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查是否有导入自定义组件
      if ((content.includes('import') && content.includes('from') && 
           content.includes('./components/')) || 
          content.includes('@/components/')) {
        hasComponentReuse = true;
        break;
      }
    }
    
    if (wellOrganized) {
      this.mainTester.addResult('代码质量', '目录结构', 'pass', '项目目录结构良好');
      console.log('✅ 项目目录结构良好');
    } else {
      this.mainTester.addResult('代码质量', '目录结构', 'warning', `缺少一些标准目录: ${missingDirs.join(', ')}`);
      console.log(`⚠️ 缺少一些标准目录: ${missingDirs.join(', ')}`);
    }
    
    if (hasComponentReuse) {
      this.mainTester.addResult('代码质量', '组件复用', 'pass', '项目使用了组件复用');
      console.log('✅ 项目使用了组件复用');
    } else {
      this.mainTester.addResult('代码质量', '组件复用', 'warning', '未检测到明显的组件复用');
      console.log('⚠️ 未检测到明显的组件复用');
    }
  }

  // 检查Rust代码质量
  checkRustCodeQuality() {
    console.log('检查Rust代码质量...');
    
    const rustFiles = findRustFiles();
    
    if (rustFiles.length === 0) {
      this.mainTester.addResult('代码质量', 'Rust代码', 'info', '未找到Rust代码文件');
      console.log('ℹ️ 未找到Rust代码文件');
      return;
    }
    
    let hasErrorHandling = false;
    let hasComments = false;
    let hasTests = false;
    
    for (const file of rustFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查错误处理
      if (content.includes('Result<') || content.includes('Ok(') || 
          content.includes('Err(') || content.includes('?')) {
        hasErrorHandling = true;
      }
      
      // 检查注释
      if (content.includes('///') || content.includes('//!') || 
          (content.match(/\/\*[\s\S]*?\*\//g) || []).length > 0) {
        hasComments = true;
      }
      
      // 检查测试
      if (content.includes('#[test]') || content.includes('mod tests')) {
        hasTests = true;
      }
    }
    
    if (hasErrorHandling) {
      this.mainTester.addResult('代码质量', 'Rust错误处理', 'pass', 'Rust代码包含适当的错误处理');
      console.log('✅ Rust代码包含适当的错误处理');
    } else {
      this.mainTester.addResult('代码质量', 'Rust错误处理', 'warning', 'Rust代码可能缺少错误处理');
      console.log('⚠️ Rust代码可能缺少错误处理');
    }
    
    if (hasComments) {
      this.mainTester.addResult('代码质量', 'Rust代码注释', 'pass', 'Rust代码包含注释');
      console.log('✅ Rust代码包含注释');
    } else {
      this.mainTester.addResult('代码质量', 'Rust代码注释', 'warning', 'Rust代码可能缺少注释');
      console.log('⚠️ Rust代码可能缺少注释');
    }
    
    if (hasTests) {
      this.mainTester.addResult('代码质量', 'Rust测试', 'pass', 'Rust代码包含测试');
      console.log('✅ Rust代码包含测试');
    } else {
      this.mainTester.addResult('代码质量', 'Rust测试', 'warning', 'Rust代码可能缺少测试');
      console.log('⚠️ Rust代码可能缺少测试');
    }
  }
}

module.exports = CodeTester;