/**
 * AssetWise Tauri桌面端功能测试脚本 - 通信测试
 */

const fs = require('fs');
const path = require('path');
const { findJSFiles, findTSFiles, findRustFiles } = require('./utils');

class CommunicationTester {
  constructor(mainTester) {
    this.mainTester = mainTester;
  }

  // 检查前后端通信
  checkCommunication() {
    console.log('\n🔄 检查前后端通信...');
    
    try {
      // 检查Tauri命令调用
      this.checkTauriCommands();
      
      // 检查事件监听
      this.checkEventListeners();
      
      // 检查API调用
      this.checkAPIRequests();
      
      // 检查数据同步
      this.checkDataSync();
    } catch (error) {
      this.mainTester.addResult('通信', '通信检查', 'fail', `检查前后端通信失败: ${error.message}`);
      console.error('❌ 检查前后端通信失败:', error);
    }
  }

  // 检查Tauri命令调用
  checkTauriCommands() {
    console.log('检查Tauri命令调用...');
    
    const jsFiles = [...findJSFiles(), ...findTSFiles()];
    const rustFiles = findRustFiles();
    
    let hasTauriInvoke = false;
    let hasTauriCommand = false;
    
    // 检查前端调用
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('invoke(') || content.includes('tauri.invoke') || 
          content.includes('@tauri-apps/api') || content.includes('window.__TAURI__')) {
        hasTauriInvoke = true;
        break;
      }
    }
    
    // 检查后端命令定义
    for (const file of rustFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('#[command]') || content.includes('#[tauri::command]') || 
          content.includes('generate_handler')) {
        hasTauriCommand = true;
        break;
      }
    }
    
    if (hasTauriInvoke) {
      this.mainTester.addResult('通信', 'Tauri前端调用', 'pass', '前端使用了Tauri命令调用');
      console.log('✅ 前端使用了Tauri命令调用');
    } else {
      this.mainTester.addResult('通信', 'Tauri前端调用', 'warning', '未检测到前端Tauri命令调用');
      console.log('⚠️ 未检测到前端Tauri命令调用');
    }
    
    if (hasTauriCommand) {
      this.mainTester.addResult('通信', 'Tauri后端命令', 'pass', '后端定义了Tauri命令');
      console.log('✅ 后端定义了Tauri命令');
    } else {
      this.mainTester.addResult('通信', 'Tauri后端命令', 'warning', '未检测到后端Tauri命令定义');
      console.log('⚠️ 未检测到后端Tauri命令定义');
    }
  }

  // 检查事件监听
  checkEventListeners() {
    console.log('检查事件监听...');
    
    const jsFiles = [...findJSFiles(), ...findTSFiles()];
    const rustFiles = findRustFiles();
    
    let hasEventListener = false;
    let hasEventEmitter = false;
    
    // 检查前端事件监听
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('listen(') || content.includes('event.listen') || 
          content.includes('addEventListener') || content.includes('on(')) {
        hasEventListener = true;
        break;
      }
    }
    
    // 检查后端事件发送
    for (const file of rustFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('emit') || content.includes('Window::emit') || 
          content.includes('app_handle.emit')) {
        hasEventEmitter = true;
        break;
      }
    }
    
    if (hasEventListener) {
      this.mainTester.addResult('通信', '事件监听', 'pass', '前端实现了事件监听');
      console.log('✅ 前端实现了事件监听');
    } else {
      this.mainTester.addResult('通信', '事件监听', 'warning', '未检测到前端事件监听');
      console.log('⚠️ 未检测到前端事件监听');
    }
    
    if (hasEventEmitter) {
      this.mainTester.addResult('通信', '事件发送', 'pass', '后端实现了事件发送');
      console.log('✅ 后端实现了事件发送');
    } else {
      this.mainTester.addResult('通信', '事件发送', 'warning', '未检测到后端事件发送');
      console.log('⚠️ 未检测到后端事件发送');
    }
  }

  // 检查API调用
  checkAPIRequests() {
    console.log('检查API调用...');
    
    const jsFiles = [...findJSFiles(), ...findTSFiles()];
    
    let hasFetch = false;
    let hasAxios = false;
    let hasSupabase = false;
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查fetch使用
      if (content.includes('fetch(') || content.includes('.then(') || 
          content.includes('await fetch')) {
        hasFetch = true;
      }
      
      // 检查axios使用
      if (content.includes('axios.') || content.includes('axios(') || 
          content.includes('from \'axios\'')) {
        hasAxios = true;
      }
      
      // 检查Supabase使用
      if (content.includes('supabase.') || content.includes('createClient') || 
          content.includes('from \'@supabase/')) {
        hasSupabase = true;
      }
    }
    
    if (hasFetch || hasAxios) {
      this.mainTester.addResult('通信', 'HTTP请求', 'pass', `使用了HTTP请求 (${hasFetch ? 'fetch' : ''}${hasFetch && hasAxios ? ', ' : ''}${hasAxios ? 'axios' : ''})`);
      console.log(`✅ 使用了HTTP请求 (${hasFetch ? 'fetch' : ''}${hasFetch && hasAxios ? ', ' : ''}${hasAxios ? 'axios' : ''})`);
    } else {
      this.mainTester.addResult('通信', 'HTTP请求', 'warning', '未检测到HTTP请求');
      console.log('⚠️ 未检测到HTTP请求');
    }
    
    if (hasSupabase) {
      this.mainTester.addResult('通信', 'Supabase', 'pass', '使用了Supabase客户端');
      console.log('✅ 使用了Supabase客户端');
    } else {
      this.mainTester.addResult('通信', 'Supabase', 'warning', '未检测到Supabase客户端使用');
      console.log('⚠️ 未检测到Supabase客户端使用');
    }
  }

  // 检查数据同步
  checkDataSync() {
    console.log('检查数据同步...');
    
    const jsFiles = [...findJSFiles(), ...findTSFiles()];
    
    let hasStateManagement = false;
    let hasLocalStorage = false;
    let hasReactQuery = false;
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查状态管理
      if (content.includes('useContext') || content.includes('createContext') || 
          content.includes('Provider') || content.includes('useReducer') || 
          content.includes('useState') || content.includes('redux') || 
          content.includes('zustand') || content.includes('recoil')) {
        hasStateManagement = true;
      }
      
      // 检查本地存储
      if (content.includes('localStorage') || content.includes('sessionStorage') || 
          content.includes('indexedDB') || content.includes('AsyncStorage')) {
        hasLocalStorage = true;
      }
      
      // 检查React Query
      if (content.includes('useQuery') || content.includes('useMutation') || 
          content.includes('react-query') || content.includes('swr') || 
          content.includes('useSWR')) {
        hasReactQuery = true;
      }
    }
    
    if (hasStateManagement) {
      this.mainTester.addResult('通信', '状态管理', 'pass', '使用了状态管理');
      console.log('✅ 使用了状态管理');
    } else {
      this.mainTester.addResult('通信', '状态管理', 'warning', '未检测到状态管理');
      console.log('⚠️ 未检测到状态管理');
    }
    
    if (hasLocalStorage) {
      this.mainTester.addResult('通信', '本地存储', 'pass', '使用了本地存储');
      console.log('✅ 使用了本地存储');
    } else {
      this.mainTester.addResult('通信', '本地存储', 'warning', '未检测到本地存储');
      console.log('⚠️ 未检测到本地存储');
    }
    
    if (hasReactQuery) {
      this.mainTester.addResult('通信', '数据获取', 'pass', '使用了React Query或SWR');
      console.log('✅ 使用了React Query或SWR');
    } else {
      this.mainTester.addResult('通信', '数据获取', 'warning', '未检测到React Query或SWR');
      console.log('⚠️ 未检测到React Query或SWR');
    }
  }
}

module.exports = CommunicationTester;