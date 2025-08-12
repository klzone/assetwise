/**
 * AssetWise 性能测试脚本
 * 检测应用的性能瓶颈和优化机会
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceTester {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  addIssue(category, severity, description, details = null) {
    this.issues.push({
      category,
      severity, // 'high', 'medium', 'low'
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

  // 检查大型组件文件
  checkLargeComponents() {
    console.log('🔍 检查大型组件文件...');
    
    const componentsDir = path.join(process.cwd(), 'src/components');
    if (!fs.existsSync(componentsDir)) {
      console.log('⚠️ 组件目录不存在');
      return;
    }

    this.scanDirectoryForLargeFiles(componentsDir, '.tsx', 300);
  }

  // 检查大型页面文件
  checkLargePages() {
    console.log('🔍 检查大型页面文件...');
    
    const pagesDir = path.join(process.cwd(), 'src/app');
    if (!fs.existsSync(pagesDir)) {
      console.log('⚠️ 页面目录不存在');
      return;
    }

    this.scanDirectoryForLargeFiles(pagesDir, '.tsx', 300);
  }

  // 扫描目录查找大型文件
  scanDirectoryForLargeFiles(dir, extension, lineThreshold) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryForLargeFiles(filePath, extension, lineThreshold);
      } else if (file.endsWith(extension)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        if (lines.length > lineThreshold) {
          this.addIssue('代码复杂度', 'medium', `文件过大: ${filePath}`, {
            lines: lines.length,
            threshold: lineThreshold
          });
          
          this.addRecommendation('代码分割', `将 ${path.basename(filePath)} 拆分为更小的组件`, 
            '使用组件拆分和代码分割技术减少文件大小', 'high');
        }
      }
    });
  }

  // 检查未优化的图片
  checkUnoptimizedImages() {
    console.log('🔍 检查未优化的图片...');
    
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      console.log('⚠️ public目录不存在');
      return;
    }

    this.scanDirectoryForLargeImages(publicDir);
  }

  // 扫描目录查找大型图片
  scanDirectoryForLargeImages(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryForLargeImages(filePath);
      } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
        const sizeInKB = Math.round(stat.size / 1024);
        
        if (sizeInKB > 200) {
          this.addIssue('资源优化', 'medium', `图片过大: ${filePath}`, {
            size: `${sizeInKB} KB`,
            threshold: '200 KB'
          });
          
          this.addRecommendation('图片优化', `优化 ${path.basename(filePath)}`, 
            '使用WebP格式、图片压缩和响应式图片技术', 'medium');
        }
      }
    });
  }

  // 检查Next.js配置
  checkNextConfig() {
    console.log('🔍 检查Next.js配置...');
    
    const configPath = path.join(process.cwd(), 'next.config.js');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️ Next.js配置文件不存在');
      return;
    }

    const content = fs.readFileSync(configPath, 'utf8');
    
    // 检查是否启用了图片优化
    if (!content.includes('images:')) {
      this.addIssue('配置优化', 'medium', 'Next.js图片优化未配置');
      this.addRecommendation('配置优化', '配置Next.js图片优化', 
        '在next.config.js中添加images配置', 'high');
    }
    
    // 检查是否启用了生产环境优化
    if (!content.includes('productionBrowserSourceMaps: false')) {
      this.addIssue('配置优化', 'low', '生产环境源码映射未禁用');
      this.addRecommendation('配置优化', '禁用生产环境源码映射', 
        '在next.config.js中设置productionBrowserSourceMaps: false', 'medium');
    }
  }

  // 检查包依赖
  checkDependencies() {
    console.log('🔍 检查包依赖...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.log('⚠️ package.json不存在');
      return;
    }

    const content = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(content);
    
    // 检查是否有重复或冲突的依赖
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const reactVersions = Object.keys(dependencies).filter(dep => 
      dep === 'react' || dep === '@types/react'
    );
    
    if (reactVersions.length > 1) {
      this.addIssue('依赖管理', 'medium', '存在多个React相关依赖');
      this.addRecommendation('依赖管理', '统一React依赖版本', 
        '确保React相关包使用兼容版本', 'high');
    }
    
    // 检查是否有未使用的依赖
    try {
      console.log('检查未使用的依赖...');
      // 这里可以集成depcheck等工具
    } catch (error) {
      console.error('检查未使用依赖失败:', error);
    }
  }

  // 检查客户端组件中的不必要服务器导入
  checkClientImports() {
    console.log('🔍 检查客户端组件中的服务器导入...');
    
    const componentsDir = path.join(process.cwd(), 'src/components');
    if (!fs.existsSync(componentsDir)) {
      console.log('⚠️ 组件目录不存在');
      return;
    }

    this.scanDirectoryForServerImports(componentsDir);
  }

  // 扫描目录查找服务器导入
  scanDirectoryForServerImports(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryForServerImports(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否是客户端组件
        if (content.includes("'use client'")) {
          // 检查是否导入了服务器组件
          if (content.includes('from \'@/lib/server') || 
              content.includes('from "@/lib/server') ||
              content.includes('from \'@/app/api') ||
              content.includes('from "@/app/api')) {
            
            this.addIssue('代码优化', 'high', `客户端组件中存在服务器导入: ${filePath}`);
            this.addRecommendation('代码优化', `移除 ${path.basename(filePath)} 中的服务器导入`, 
              '使用客户端API调用替代直接服务器导入', 'high');
          }
        }
      }
    });
  }

  // 检查未使用的导入
  checkUnusedImports() {
    console.log('🔍 检查未使用的导入...');
    
    // 这里可以集成ESLint等工具
    console.log('需要安装ESLint插件进行更详细检查');
  }

  // 检查重复渲染
  checkRenderOptimization() {
    console.log('🔍 检查渲染优化机会...');
    
    const componentsDir = path.join(process.cwd(), 'src/components');
    if (!fs.existsSync(componentsDir)) {
      console.log('⚠️ 组件目录不存在');
      return;
    }

    this.scanDirectoryForRenderOptimization(componentsDir);
  }

  // 扫描目录查找渲染优化机会
  scanDirectoryForRenderOptimization(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectoryForRenderOptimization(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否使用了React.memo
        if (content.includes('function') && 
            !content.includes('React.memo') && 
            !content.includes('memo(') &&
            content.includes('props')) {
          
          this.addIssue('性能优化', 'low', `组件可能需要记忆化: ${filePath}`);
          this.addRecommendation('性能优化', `考虑对 ${path.basename(filePath)} 使用React.memo`, 
            '对纯展示组件使用React.memo减少不必要的重渲染', 'medium');
        }
        
        // 检查是否在渲染中创建函数
        if (content.includes('=>') && 
            content.includes('onClick={') && 
            !content.includes('useCallback')) {
          
          this.addIssue('性能优化', 'medium', `组件中可能存在内联函数: ${filePath}`);
          this.addRecommendation('性能优化', `优化 ${path.basename(filePath)} 中的事件处理函数`, 
            '使用useCallback包装事件处理函数', 'medium');
        }
      }
    });
  }

  // 运行所有检查
  runAllChecks() {
    console.log('🚀 开始AssetWise性能测试...\n');
    
    this.checkLargeComponents();
    this.checkLargePages();
    this.checkUnoptimizedImages();
    this.checkNextConfig();
    this.checkDependencies();
    this.checkClientImports();
    this.checkUnusedImports();
    this.checkRenderOptimization();
    
    this.generateReport();
  }

  // 生成报告
  generateReport() {
    console.log('\n📊 性能测试报告');
    console.log('=================\n');
    
    // 按严重程度排序问题
    const sortedIssues = [...this.issues].sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // 输出问题
    if (sortedIssues.length > 0) {
      console.log('🚨 发现的问题:');
      sortedIssues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'high' ? '🔴' : 
                            issue.severity === 'medium' ? '🟠' : '🟡';
        
        console.log(`${index + 1}. ${severityIcon} [${issue.category}] ${issue.description}`);
        if (issue.details) {
          console.log(`   详情: ${JSON.stringify(issue.details)}`);
        }
      });
    } else {
      console.log('✅ 未发现性能问题');
    }
    
    console.log('\n');
    
    // 按优先级排序建议
    const sortedRecommendations = [...this.recommendations].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // 输出建议
    if (sortedRecommendations.length > 0) {
      console.log('💡 优化建议:');
      sortedRecommendations.forEach((rec, index) => {
        const priorityIcon = rec.priority === 'high' ? '🔴' : 
                            rec.priority === 'medium' ? '🟠' : '🟡';
        
        console.log(`${index + 1}. ${priorityIcon} [${rec.category}] ${rec.description}`);
        if (rec.implementation) {
          console.log(`   实现方法: ${rec.implementation}`);
        }
      });
    } else {
      console.log('✨ 没有优化建议');
    }
    
    // 生成性能评分
    const issueWeights = { high: 10, medium: 5, low: 2 };
    const totalIssueWeight = this.issues.reduce((sum, issue) => sum + issueWeights[issue.severity], 0);
    const baseScore = 100;
    const score = Math.max(0, Math.min(100, baseScore - totalIssueWeight));
    
    console.log('\n');
    console.log(`📈 性能评分: ${score}/100`);
    
    // 生成总结
    console.log('\n📝 总结:');
    if (score >= 90) {
      console.log('应用性能状况优秀！只需少量优化即可进一步提升性能。');
    } else if (score >= 70) {
      console.log('应用性能状况良好，但有一些优化空间。建议关注中高优先级的优化建议。');
    } else if (score >= 50) {
      console.log('应用性能存在一些问题，需要进行多项优化。请优先处理高优先级问题。');
    } else {
      console.log('应用性能状况较差，需要进行全面优化。建议按照优先级逐步解决问题。');
    }
    
    console.log('\n🎉 性能测试完成！');
  }
}

// 运行测试
const tester = new PerformanceTester();
tester.runAllChecks();

module.exports = PerformanceTester;