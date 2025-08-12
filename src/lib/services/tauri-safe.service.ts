/**
 * 安全的Tauri服务包装器
 * 避免在构建时导入Tauri模块
 */

// 检查是否在Tauri环境中
function isInTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as any).__TAURI__ !== undefined
  );
}

// 安全的Tauri API包装器
class SafeTauriService {
  private tauriApi: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    if (!isInTauriEnvironment()) {
      console.log('Not in Tauri environment, using fallback');
      this.initialized = true;
      return;
    }

    try {
      // 只在Tauri环境中动态导入
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const tauriModule = await import('@tauri-apps/api/tauri');
        this.tauriApi = tauriModule;
        console.log('Tauri API initialized successfully');
      } else {
        console.log('Tauri global object not found, skipping API import');
      }
    } catch (error) {
      console.warn('Failed to initialize Tauri API:', error);
    }
    
    this.initialized = true;
  }

  async invoke(command: string, args?: any): Promise<any> {
    await this.initialize();
    
    if (!this.tauriApi) {
      console.warn(`Tauri not available, cannot invoke: ${command}`);
      return null;
    }

    try {
      return await this.tauriApi.invoke(command, args);
    } catch (error) {
      console.error(`Tauri invoke error for ${command}:`, error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return isInTauriEnvironment() && this.tauriApi !== null;
  }
}

export const safeTauriService = new SafeTauriService();
