import { AuthStateManagerService } from '../auth-state-manager.service';

/**
 * 认证状态管理服务单元测试
 */
describe('AuthStateManagerService', () => {
  // 模拟localStorage
  let mockLocalStorage: {
    [key: string]: string;
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  
  // 模拟sessionStorage
  let mockSessionStorage: {
    [key: string]: string;
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  
  // 模拟Supabase客户端
  let mockSupabaseClient: any;
  
  // 测试用户数据
  const testUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      name: '测试用户',
      role: 'user'
    }
  };
  
  // 测试会话数据
  const testSession = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
    user: testUser
  };
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 模拟localStorage
    mockLocalStorage = {
      getItem: jest.fn((key) => mockLocalStorage[key] || null),
      setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
      removeItem: jest.fn((key) => { delete mockLocalStorage[key]; })
    };
    
    // 模拟sessionStorage
    mockSessionStorage = {
      getItem: jest.fn((key) => mockSessionStorage[key] || null),
      setItem: jest.fn((key, value) => { mockSessionStorage[key] = value; }),
      removeItem: jest.fn((key) => { delete mockSessionStorage[key]; })
    };
    
    // 模拟Supabase客户端
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: testSession } }),
        refreshSession: jest.fn().mockResolvedValue({ data: { session: { ...testSession, access_token: 'new-access-token' } } }),
        signOut: jest.fn().mockResolvedValue({ error: null })
      }
    };
    
    // 替换全局对象
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
  });
  
  describe('初始化', () => {
    it('应该正确初始化服务', () => {
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 验证服务实例
      expect(service).toBeDefined();
      expect(service.isInitialized).toBe(true);
    });
  });
  
  describe('getAuthState', () => {
    it('应该从Supabase获取认证状态', async () => {
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const authState = await service.getAuthState();
      
      // 验证结果
      expect(authState).toBeDefined();
      expect(authState.session).toEqual(testSession);
      expect(authState.user).toEqual(testUser);
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });
    
    it('应该处理Supabase错误', async () => {
      // 模拟Supabase错误
      mockSupabaseClient.auth.getSession.mockRejectedValue(new Error('测试错误'));
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const authState = await service.getAuthState();
      
      // 验证结果
      expect(authState).toBeDefined();
      expect(authState.session).toBeNull();
      expect(authState.user).toBeNull();
      expect(authState.error).toBeDefined();
    });
  });
  
  describe('restoreAuthState', () => {
    it('应该从localStorage恢复认证状态', async () => {
      // 设置localStorage中的认证数据
      const authData = {
        session: testSession,
        user: testUser
      };
      mockLocalStorage.setItem('supabase.auth.token', JSON.stringify(authData));
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const authState = await service.restoreAuthState();
      
      // 验证结果
      expect(authState).toBeDefined();
      expect(authState.session).toEqual(testSession);
      expect(authState.user).toEqual(testUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('supabase.auth.token');
    });
    
    it('应该处理localStorage中没有认证数据的情况', async () => {
      // 不设置localStorage中的认证数据
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const authState = await service.restoreAuthState();
      
      // 验证结果
      expect(authState).toBeDefined();
      expect(authState.session).toBeNull();
      expect(authState.user).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('supabase.auth.token');
    });
  });
  
  describe('refreshAuthToken', () => {
    it('应该刷新过期的访问令牌', async () => {
      // 设置过期的会话
      const expiredSession = {
        ...testSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1小时前过期
      };
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const result = await service.refreshAuthToken(expiredSession);
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe('new-access-token');
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
    });
    
    it('应该不刷新有效的访问令牌', async () => {
      // 设置有效的会话
      const validSession = {
        ...testSession,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
      };
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const result = await service.refreshAuthToken(validSession);
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.session).toEqual(validSession);
      expect(mockSupabaseClient.auth.refreshSession).not.toHaveBeenCalled();
    });
    
    it('应该处理刷新令牌失败的情况', async () => {
      // 设置过期的会话
      const expiredSession = {
        ...testSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600 // 1小时前过期
      };
      
      // 模拟刷新失败
      mockSupabaseClient.auth.refreshSession.mockRejectedValue(new Error('刷新失败'));
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      const result = await service.refreshAuthToken(expiredSession);
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
    });
  });
  
  describe('persistAuthState', () => {
    it('应该将认证状态持久化到localStorage', () => {
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      service.persistAuthState(testSession, testUser);
      
      // 验证结果
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData.session).toEqual(testSession);
      expect(storedData.user).toEqual(testUser);
    });
    
    it('应该将认证状态持久化到sessionStorage（如果指定）', () => {
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法，指定使用sessionStorage
      service.persistAuthState(testSession, testUser, 'session');
      
      // 验证结果
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      const storedData = JSON.parse(mockSessionStorage.setItem.mock.calls[0][1]);
      expect(storedData.session).toEqual(testSession);
      expect(storedData.user).toEqual(testUser);
    });
  });
  
  describe('clearAuthState', () => {
    it('应该清除所有存储中的认证状态', async () => {
      // 设置存储中的认证数据
      mockLocalStorage.setItem('supabase.auth.token', JSON.stringify({ session: testSession, user: testUser }));
      mockSessionStorage.setItem('supabase.auth.token', JSON.stringify({ session: testSession, user: testUser }));
      
      // 创建服务实例
      const service = new AuthStateManagerService(mockSupabaseClient);
      
      // 调用方法
      await service.clearAuthState();
      
      // 验证结果
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token');
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });
});