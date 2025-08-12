/**
 * AssetWise 测试工具类
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 查找项目中的所有JS文件
 * @returns {Array<string>} JS文件路径数组
 */
function findJSFiles() {
  try {
    // Windows兼容的文件查找方法
    const result = execSync('powershell -Command "Get-ChildItem -Path . -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch \'node_modules|dist|build|tests\' } | ForEach-Object { $_.FullName }"', { encoding: 'utf8' });
    return result.split('\r\n').filter(Boolean);
  } catch (error) {
    console.error('查找JS文件失败:', error);
    return [];
  }
}

/**
 * 查找项目中的所有TS文件
 * @returns {Array<string>} TS文件路径数组
 */
function findTSFiles() {
  try {
    // Windows兼容的文件查找方法
    const result = execSync('powershell -Command "Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch \'node_modules|dist|build|tests\' } | ForEach-Object { $_.FullName }"', { encoding: 'utf8' });
    return result.split('\r\n').filter(Boolean);
  } catch (error) {
    console.error('查找TS文件失败:', error);
    return [];
  }
}

/**
 * 查找项目中的所有Rust文件
 * @returns {Array<string>} Rust文件路径数组
 */
function findRustFiles() {
  try {
    const result = execSync('find . -type f -name "*.rs" -not -path "*/target/*"', { encoding: 'utf8' });
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('查找Rust文件失败:', error);
    return [];
  }
}

/**
 * 检查文件是否存在
 * @param {string} filePath 文件路径
 * @returns {boolean} 文件是否存在
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {string} 文件内容
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error);
    return '';
  }
}

/**
 * 检查依赖项是否安装
 * @param {string} packageName 包名
 * @returns {boolean} 依赖项是否安装
 */
function isDependencyInstalled(packageName) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { 
      ...packageJson.dependencies || {}, 
      ...packageJson.devDependencies || {} 
    };
    
    return Object.keys(dependencies).includes(packageName);
  } catch (error) {
    console.error('检查依赖项失败:', error);
    return false;
  }
}

module.exports = {
  findJSFiles,
  findTSFiles,
  findRustFiles,
  fileExists,
  readFileContent,
  isDependencyInstalled
};