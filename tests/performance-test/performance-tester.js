/**
 * AssetWise 性能测试脚本
 */

const fs = require('fs');
const path = require('path');
const { findJSFiles, findTSFiles } = require('../tauri-desktop-test/utils');

class PerformanceTester {
  constructor(mainTester) {
    this.mainTester = mainTester;
    this.performanceIssues = [];
  }

  // 运行所有性能测试
  runAllTests() {
    console.log('\n⚡ 运行性能测试...');
    
    this.checkBundleSize();
    this.checkLazyLoading();
    this.checkMemoization();
    this.checkRenderOptimization();
    this.checkDataFetching();
    
    return this.performanceIssues;
  }

  // 检查包大小
  checkBundleSize() {
    console.log('检查包大小...');
    
    try {
      // 检查package.json中的依赖
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { 
          ...packageJson.dependencies || {}, 
          ...packageJson.devDependencies || {} 
        };
        
        const heavyDependencies = [];
        const knownHeavyPackages = [
          'moment', 'lodash', 'jquery', 'chart.js', 'three.js', 
          'material-ui', '@mui/material', 'bootstrap', 'antd'
        ];
        
        for (const dep of Object.keys(dependencies)) {
          if (knownHeavyPackages.some(pkg => dep.includes(pkg))) {
            heavyDependencies.push(dep);
          }
        }
        
        if (heavyDependencies.length > 0) {
          this.performanceIssues.push({
            type: '包大小',
            severity: 'medium',
            description: `检测到可能较大的依赖包: ${heavyDependencies.join(', ')}`,
            recommendation: '考虑使用更轻量的替代品或按需导入'
          });
          this.mainTester.addResult('性能', '包大小', 'warning', `检测到可能较大的依赖包: ${heavyDependencies.join(', ')}`);
        } else {
          this.mainTester.addResult('性能', '包大小', 'pass', '未检测到明显的大型依赖包');
        }
      } else {
        this.mainTester.addResult('性能', '包大小', 'info', '未找到package.json文件');
      }
    } catch (error) {
      this.mainTester.addResult('性能', '包大小', 'fail', `检查包大小失败: ${error.message}`);
      console.error('检查包大小失败:', error);
    }
  }

  // 检查懒加载
  checkLazyLoading() {
    console.log('检查懒加载...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasLazyLoading = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查React.lazy或动态导入
        if (content.includes('React.lazy') || content.includes('lazy(') || 
            content.includes('import(') || content.includes('loadable(')) {
          hasLazyLoading = true;
          break;
        }
      }
      
      if (hasLazyLoading) {
        this.mainTester.addResult('性能', '懒加载', 'pass', '使用了组件懒加载');
      } else {
        this.performanceIssues.push({
          type: '懒加载',
          severity: 'medium',
          description: '未检测到组件懒加载',
          recommendation: '对大型组件或路由使用React.lazy或动态导入'
        });
        this.mainTester.addResult('性能', '懒加载', 'warning', '未检测到组件懒加载');
      }
    } catch (error) {
      this.mainTester.addResult('性能', '懒加载', 'fail', `检查懒加载失败: ${error.message}`);
      console.error('检查懒加载失败:', error);
    }
  }

  // 检查记忆化
  checkMemoization() {
    console.log('检查记忆化...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasMemoization = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查React.memo, useMemo或useCallback
        if (content.includes('React.memo') || content.includes('memo(') || 
            content.includes('useMemo') || content.includes('useCallback')) {
          hasMemoization = true;
          break;
        }
      }
      
      if (hasMemoization) {
        this.mainTester.addResult('性能', '记忆化', 'pass', '使用了组件或计算记忆化');
      } else {
        this.performanceIssues.push({
          type: '记忆化',
          severity: 'medium',
          description: '未检测到组件或计算记忆化',
          recommendation: '对复杂组件使用React.memo，对昂贵计算使用useMemo，对回调函数使用useCallback'
        });
        this.mainTester.addResult('性能', '记忆化', 'warning', '未检测到组件或计算记忆化');
      }
    } catch (error) {
      this.mainTester.addResult('性能', '记忆化', 'fail', `检查记忆化失败: ${error.message}`);
      console.error('检查记忆化失败:', error);
    }
  }

  // 检查渲染优化
  checkRenderOptimization() {
    console.log('检查渲染优化...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasVirtualization = false;
      let hasConditionalRendering = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查虚拟化列表
        if (content.includes('react-window') || content.includes('react-virtualized') || 
            content.includes('VirtualScroller') || content.includes('virtualize')) {
          hasVirtualization = true;
        }
        
        // 检查条件渲染
        if ((content.includes('&&') || content.includes('?') || content.includes(':')) && 
            content.includes('render')) {
          hasConditionalRendering = true;
        }
      }
      
      if (hasVirtualization) {
        this.mainTester.addResult('性能', '列表虚拟化', 'pass', '使用了列表虚拟化');
      } else {
        this.performanceIssues.push({
          type: '列表虚拟化',
          severity: 'medium',
          description: '未检测到列表虚拟化',
          recommendation: '对长列表使用react-window或react-virtualized'
        });
        this.mainTester.addResult('性能', '列表虚拟化', 'warning', '未检测到列表虚拟化');
      }
      
      if (hasConditionalRendering) {
        this.mainTester.addResult('性能', '条件渲染', 'pass', '使用了条件渲染');
      } else {
        this.performanceIssues.push({
          type: '条件渲染',
          severity: 'low',
          description: '未检测到明确的条件渲染',
          recommendation: '使用条件渲染减少不必要的DOM更新'
        });
        this.mainTester.addResult('性能', '条件渲染', 'info', '未检测到明确的条件渲染');
      }
    } catch (error) {
      this.mainTester.addResult('性能', '渲染优化', 'fail', `检查渲染优化失败: ${error.message}`);
      console.error('检查渲染优化失败:', error);
    }
  }

  // 检查数据获取
  checkDataFetching() {
    console.log('检查数据获取...');
    
    try {
      const files = [...findJSFiles(), ...findTSFiles()];
      let hasCaching = false;
      let hasPagination = false;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查数据缓存
        if (content.includes('cache') || content.includes('swr') || 
            content.includes('react-query') || content.includes('useQuery') || 
            content.includes('apollo')) {
          hasCaching = true;
        }
        
        // 检查分页
        if (content.includes('page') || content.includes('limit') || 
            content.includes('offset') || content.includes('paginate') || 
            content.includes('pagination')) {
          hasPagination = true;
        }
      }
      
      if (hasCaching) {
        this.mainTester.addResult('性能', '数据缓存', 'pass', '使用了数据缓存');
      } else {
        this.performanceIssues.push({
          type: '数据缓存',
          severity: 'medium',
          description: '未检测到数据缓存',
          recommendation: '使用SWR或React Query进行数据缓存'
        });
        this.mainTester.addResult('性能', '数据缓存', 'warning', '未检测到数据缓存');
      }
      
      if (hasPagination) {
        this.mainTester.addResult('性能', '数据分页', 'pass', '使用了数据分页');
      } else {
        this.performanceIssues.push({
          type: '数据分页',
          severity: 'medium',
          description: '未检测到数据分页',
          recommendation: '对大型数据集实现分页加载'
        });
        this.mainTester.addResult('性能', '数据分页', 'warning', '未检测到数据分页');
      }
    } catch (error) {
      this.mainTester.addResult('性能', '数据获取', 'fail', `检查数据获取失败: ${error.message}`);
      console.error('检查数据获取失败:', error);
    }
  }
}

module.exports = PerformanceTester;