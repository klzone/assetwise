/**
 * AssetWise Tauri桌面端功能测试脚本 - 配置测试
 */

const fs = require('fs');
const path = require('path');
const { fileExists, readFileContent, isDependencyInstalled } = require('./utils');

class ConfigTester {
  constructor(mainTester) {
    this.mainTester = mainTester;
  }

  // 检查配置
  checkConfigurations() {
    console.log('\n⚙️ 检查配置...');
    
    try {
      // 检查Tauri配置
      this.checkTauriConfig();
      
      // 检查依赖项
      this.checkDependencies();
      
      // 检查环境变量
      this.checkEnvironmentVariables();
      
      // 检查构建配置
      this.checkBuildConfig();
    } catch (error) {
      this.mainTester.addResult('配置', '配置检查', 'fail', `检查配置失败: ${error.message}`);
      console.error('❌ 检查配置失败:', error);
    }
  }

  // 检查Tauri配置
  checkTauriConfig() {
    console.log('检查Tauri配置...');
    
    const tauriConfigPath = path.join(process.cwd(), 'src-tauri/tauri.conf.json');
    
    if (fileExists(tauriConfigPath)) {
      try {
        const tauriConfig = JSON.parse(readFileContent(tauriConfigPath));
        
        // 检查基本配置
        if (tauriConfig.tauri && tauriConfig.build) {
          this.mainTester.addResult('配置', 'Tauri基本配置', 'pass', 'Tauri基本配置正确');
          console.log('✅ Tauri基本配置正确');
        } else {
          this.mainTester.addResult('配置', 'Tauri基本配置', 'warning', 'Tauri配置可能不完整');
          console.log('⚠️ Tauri配置可能不完整');
        }
        
        // 检查安全配置
        if (tauriConfig.tauri && tauriConfig.tauri.security) {
          const security = tauriConfig.tauri.security;
          
          if (security.csp) {
            this.mainTester.addResult('配置', 'CSP配置', 'pass', '已配置内容安全策略');
            console.log('✅ 已配置内容安全策略');
          } else {
            this.mainTester.addResult('配置', 'CSP配置', 'warning', '未配置内容安全策略');
            console.log('⚠️ 未配置内容安全策略');
          }
        } else {
          this.mainTester.addResult('配置', '安全配置', 'warning', '未找到安全配置部分');
          console.log('⚠️ 未找到安全配置部分');
        }
        
        // 检查权限配置
        if (tauriConfig.tauri && tauriConfig.tauri.allowlist) {
          const allowlist = tauriConfig.tauri.allowlist;
          
          // 检查文件系统权限
          if (allowlist.fs && allowlist.fs.all === true) {
            this.mainTester.addResult('配置', '文件系统权限', 'warning', '允许所有文件系统访问，可能存在安全风险');
            console.log('⚠️ 允许所有文件系统访问，可能存在安全风险');
          } else if (allowlist.fs) {
            this.mainTester.addResult('配置', '文件系统权限', 'pass', '文件系统权限已适当限制');
            console.log('✅ 文件系统权限已适当限制');
          }
          
          // 检查shell权限
          if (allowlist.shell && allowlist.shell.all === true) {
            this.mainTester.addResult('配置', 'Shell权限', 'warning', '允许所有Shell命令，可能存在安全风险');
            console.log('⚠️ 允许所有Shell命令，可能存在安全风险');
          } else if (allowlist.shell) {
            this.mainTester.addResult('配置', 'Shell权限', 'pass', 'Shell权限已适当限制');
            console.log('✅ Shell权限已适当限制');
          }
        } else {
          this.mainTester.addResult('配置', '权限配置', 'warning', '未找到权限配置部分');
          console.log('⚠️ 未找到权限配置部分');
        }
      } catch (error) {
        this.mainTester.addResult('配置', 'Tauri配置解析', 'fail', `解析Tauri配置失败: ${error.message}`);
        console.error('❌ 解析Tauri配置失败:', error);
      }
    } else {
      this.mainTester.addResult('配置', 'Tauri配置文件', 'warning', '未找到Tauri配置文件');
      console.log('⚠️ 未找到Tauri配置文件');
    }
  }

  // 检查依赖项
  checkDependencies() {
    console.log('检查依赖项...');
    
    // 检查Tauri依赖
    const hasTauriDeps = isDependencyInstalled('@tauri-apps/api') && 
                         isDependencyInstalled('@tauri-apps/cli');
    
    if (hasTauriDeps) {
      this.mainTester.addResult('配置', 'Tauri依赖', 'pass', '已安装Tauri依赖');
      console.log('✅ 已安装Tauri依赖');
    } else {
      this.mainTester.addResult('配置', 'Tauri依赖', 'warning', '未安装所有必要的Tauri依赖');
      console.log('⚠️ 未安装所有必要的Tauri依赖');
    }
    
    // 检查React依赖
    const hasReactDeps = isDependencyInstalled('react') && 
                         isDependencyInstalled('react-dom');
    
    if (hasReactDeps) {
      this.mainTester.addResult('配置', 'React依赖', 'pass', '已安装React依赖');
      console.log('✅ 已安装React依赖');
    } else {
      this.mainTester.addResult('配置', 'React依赖', 'warning', '未安装所有必要的React依赖');
      console.log('⚠️ 未安装所有必要的React依赖');
    }
    
    // 检查Next.js依赖
    const hasNextDeps = isDependencyInstalled('next');
    
    if (hasNextDeps) {
      this.mainTester.addResult('配置', 'Next.js依赖', 'pass', '已安装Next.js依赖');
      console.log('✅ 已安装Next.js依赖');
    } else {
      this.mainTester.addResult('配置', 'Next.js依赖', 'warning', '未安装Next.js依赖');
      console.log('⚠️ 未安装Next.js依赖');
    }
    
    // 检查Supabase依赖
    const hasSupabaseDeps = isDependencyInstalled('@supabase/supabase-js');
    
    if (hasSupabaseDeps) {
      this.mainTester.addResult('配置', 'Supabase依赖', 'pass', '已安装Supabase依赖');
      console.log('✅ 已安装Supabase依赖');
    } else {
      this.mainTester.addResult('配置', 'Supabase依赖', 'warning', '未安装Supabase依赖');
      console.log('⚠️ 未安装Supabase依赖');
    }
    
    // 检查测试依赖
    const hasTestDeps = isDependencyInstalled('jest') || 
                        isDependencyInstalled('@testing-library/react') || 
                        isDependencyInstalled('vitest');
    
    if (hasTestDeps) {
      this.mainTester.addResult('配置', '测试依赖', 'pass', '已安装测试依赖');
      console.log('✅ 已安装测试依赖');
    } else {
      this.mainTester.addResult('配置', '测试依赖', 'warning', '未安装测试依赖');
      console.log('⚠️ 未安装测试依赖');
    }
  }

  // 检查环境变量
  checkEnvironmentVariables() {
    console.log('检查环境变量...');
    
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production'
    ];
    
    let hasEnvFile = false;
    let hasSupabaseVars = false;
    
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      
      if (fileExists(envPath)) {
        hasEnvFile = true;
        const content = readFileContent(envPath);
        
        if (content.includes('SUPABASE_URL') && content.includes('SUPABASE_KEY')) {
          hasSupabaseVars = true;
        }
      }
    }
    
    if (hasEnvFile) {
      this.mainTester.addResult('配置', '环境变量文件', 'pass', '存在环境变量文件');
      console.log('✅ 存在环境变量文件');
    } else {
      this.mainTester.addResult('配置', '环境变量文件', 'warning', '未找到环境变量文件');
      console.log('⚠️ 未找到环境变量文件');
    }
    
    if (hasSupabaseVars) {
      this.mainTester.addResult('配置', 'Supabase环境变量', 'pass', '配置了Supabase环境变量');
      console.log('✅ 配置了Supabase环境变量');
    } else {
      this.mainTester.addResult('配置', 'Supabase环境变量', 'warning', '未配置Supabase环境变量');
      console.log('⚠️ 未配置Supabase环境变量');
    }
    
    // 检查.env文件是否在.gitignore中
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fileExists(gitignorePath)) {
      const gitignoreContent = readFileContent(gitignorePath);
      
      if (gitignoreContent.includes('.env') || gitignoreContent.includes('*.env')) {
        this.mainTester.addResult('配置', '环境变量安全', 'pass', '环境变量文件已在.gitignore中排除');
        console.log('✅ 环境变量文件已在.gitignore中排除');
      } else {
        this.mainTester.addResult('配置', '环境变量安全', 'warning', '环境变量文件未在.gitignore中排除，可能泄露敏感信息');
        console.log('⚠️ 环境变量文件未在.gitignore中排除，可能泄露敏感信息');
      }
    }
  }

  // 检查构建配置
  checkBuildConfig() {
    console.log('检查构建配置...');
    
    // 检查package.json中的构建脚本
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (fileExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileContent(packageJsonPath));
        
        if (packageJson.scripts) {
          const scripts = packageJson.scripts;
          
          // 检查Tauri构建脚本
          if (scripts.build && scripts.build.includes('tauri')) {
            this.mainTester.addResult('配置', 'Tauri构建脚本', 'pass', '配置了Tauri构建脚本');
            console.log('✅ 配置了Tauri构建脚本');
          } else {
            this.mainTester.addResult('配置', 'Tauri构建脚本', 'warning', '未配置Tauri构建脚本');
            console.log('⚠️ 未配置Tauri构建脚本');
          }
          
          // 检查开发脚本
          if (scripts.dev && scripts.dev.includes('tauri')) {
            this.mainTester.addResult('配置', 'Tauri开发脚本', 'pass', '配置了Tauri开发脚本');
            console.log('✅ 配置了Tauri开发脚本');
          } else {
            this.mainTester.addResult('配置', 'Tauri开发脚本', 'warning', '未配置Tauri开发脚本');
            console.log('⚠️ 未配置Tauri开发脚本');
          }
          
          // 检查测试脚本
          if (scripts.test) {
            this.mainTester.addResult('配置', '测试脚本', 'pass', '配置了测试脚本');
            console.log('✅ 配置了测试脚本');
          } else {
            this.mainTester.addResult('配置', '测试脚本', 'warning', '未配置测试脚本');
            console.log('⚠️ 未配置测试脚本');
          }
        } else {
          this.mainTester.addResult('配置', '构建脚本', 'warning', 'package.json中未找到scripts部分');
          console.log('⚠️ package.json中未找到scripts部分');
        }
      } catch (error) {
        this.mainTester.addResult('配置', 'package.json解析', 'fail', `解析package.json失败: ${error.message}`);
        console.error('❌ 解析package.json失败:', error);
      }
    } else {
      this.mainTester.addResult('配置', 'package.json', 'warning', '未找到package.json文件');
      console.log('⚠️ 未找到package.json文件');
    }
    
    // 检查Next.js配置
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    if (fileExists(nextConfigPath)) {
      this.mainTester.addResult('配置', 'Next.js配置', 'pass', '存在Next.js配置文件');
      console.log('✅ 存在Next.js配置文件');
    } else {
      this.mainTester.addResult('配置', 'Next.js配置', 'warning', '未找到Next.js配置文件');
      console.log('⚠️ 未找到Next.js配置文件');
    }
    
    // 检查TypeScript配置
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    
    if (fileExists(tsConfigPath)) {
      this.mainTester.addResult('配置', 'TypeScript配置', 'pass', '存在TypeScript配置文件');
      console.log('✅ 存在TypeScript配置文件');
    } else {
      this.mainTester.addResult('配置', 'TypeScript配置', 'warning', '未找到TypeScript配置文件');
      console.log('⚠️ 未找到TypeScript配置文件');
    }
  }
}

module.exports = ConfigTester;