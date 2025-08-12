/**
 * 认证状态管理服务
 * 负责处理用户认证状态的获取、恢复、刷新和持久化
 */
export class AuthStateManagerService {
  private supabaseClient: any;
  public isInitialized: boolean = true;
  
  /**
   * 构造函数
   * @param supabaseClient Supabase客户端实例
   */
  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }
  
  /**
   * 从Supabase获取当前认证状态
   * @returns 包含会话和用户信息的认证状态对象
   */
  async getAuthState() {
    try {
      const { data, error } = await this.supabaseClient.auth.getSession();
      
      if (error) {
        console.error('获取认证状态失败:', error.message);
        return {
          session: null,
          user: null,
          error: error.message
        };
      }
      
      return {
        session: data.session,
        user: data.session?.user || null,
        error: null
      };
    } catch (error: any) {
      console.error('获取认证状态异常:', error.message);
      return {
        session: null,
        user: null,
        error: error.message
      };
    }
  }
  
  /**
   * 从本地存储恢复认证状态
   * @returns 恢复的认证状态对象
   */
  async restoreAuthState() {
    try {
      // 尝试从localStorage获取认证数据
      const storedAuthData = localStorage.getItem('supabase.auth.token');
      
      if (!storedAuthData) {
        return {
          session: null,
          user: null,
          error: null
        };
      }
      
      const authData = JSON.parse(storedAuthData);
      
      // 如果会话已过期，尝试刷新
      if (authData.session && this.isSessionExpired(authData.session)) {
        const refreshResult = await this.refreshAuthToken(authData.session);
        if (refreshResult.success) {
          return {
            session: refreshResult.session,
            user: refreshResult.session?.user || null,
            error: null
          };
        }
      }
      
      return {
        session: authData.session,
        user: authData.user,
        error: null
      };
    } catch (error: any) {
      console.error('恢复认证状态异常:', error.message);
      return {
        session: null,
        user: null,
        error: error.message
      };
    }
  }
  
  /**
   * 刷新认证令牌
   * @param session 当前会话对象
   * @returns 刷新结果
   */
  async refreshAuthToken(session: any) {
    try {
      // 如果会话未过期，无需刷新
      if (!this.isSessionExpired(session)) {
        return {
          success: true,
          session: session,
          error: null
        };
      }
      
      // 尝试刷新会话
      const { data, error } = await this.supabaseClient.auth.refreshSession();
      
      if (error) {
        console.error('刷新令牌失败:', error.message);
        return {
          success: false,
          session: null,
          error: error.message
        };
      }
      
      // 更新本地存储
      this.persistAuthState(data.session, data.session?.user);
      
      return {
        success: true,
        session: data.session,
        error: null
      };
    } catch (error: any) {
      console.error('刷新令牌异常:', error.message);
      return {
        success: false,
        session: null,
        error: error.message
      };
    }
  }
  
  /**
   * 将认证状态持久化到存储
   * @param session 会话对象
   * @param user 用户对象
   * @param storageType 存储类型，'local'或'session'
   */
  persistAuthState(session: any, user: any, storageType: 'local' | 'session' = 'local') {
    try {
      const authData = {
        session,
        user
      };
      
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      storage.setItem('supabase.auth.token', JSON.stringify(authData));
    } catch (error: any) {
      console.error('持久化认证状态异常:', error.message);
    }
  }
  
  /**
   * 清除所有存储中的认证状态
   */
  async clearAuthState() {
    try {
      // 清除本地存储
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // 登出Supabase
      await this.supabaseClient.auth.signOut();
    } catch (error: any) {
      console.error('清除认证状态异常:', error.message);
    }
  }
  
  /**
   * 检查会话是否已过期
   * @param session 会话对象
   * @returns 是否已过期
   */
  private isSessionExpired(session: any): boolean {
    if (!session || !session.expires_at) {
      return true;
    }
    
    const expiresAt = session.expires_at * 1000; // 转换为毫秒
    const now = Date.now();
    
    // 如果过期时间小于当前时间，或者即将在5分钟内过期，则认为已过期
    return expiresAt <= now || expiresAt - now < 5 * 60 * 1000;
  }
}