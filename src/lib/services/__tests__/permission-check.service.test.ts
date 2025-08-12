import { PermissionCheckService } from '../permission-check.service';

/**
 * 权限检查服务单元测试
 */
describe('PermissionCheckService', () => {
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
  
  // 测试管理员用户数据
  const testAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    user_metadata: {
      name: '管理员用户',
      role: 'admin'
    }
  };
  
  // 测试资产数据
  const testAsset = {
    id: 'asset-123',
    name: '测试资产',
    owner_id: 'user-123',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 模拟Supabase客户端
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: testAsset, error: null }),
      rpc: jest.fn().mockReturnThis(),
      data: null,
      error: null
    };
  });
  
  describe('初始化', () => {
    it('应该正确初始化服务', () => {
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证服务实例
      expect(service).toBeDefined();
    });
  });
  
  describe('hasRole', () => {
    it('应该正确检查用户是否具有指定角色', () => {
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证普通用户角色
      expect(service.hasRole(testUser, 'user')).toBe(true);
      expect(service.hasRole(testUser, 'admin')).toBe(false);
      
      // 验证管理员用户角色
      expect(service.hasRole(testAdminUser, 'admin')).toBe(true);
      expect(service.hasRole(testAdminUser, 'user')).toBe(false);
    });
    
    it('应该处理用户没有角色元数据的情况', () => {
      // 创建没有角色元数据的用户
      const userWithoutRole = {
        id: 'user-456',
        email: 'noRole@example.com',
        user_metadata: {}
      };
      
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果
      expect(service.hasRole(userWithoutRole, 'user')).toBe(false);
      expect(service.hasRole(userWithoutRole, 'admin')).toBe(false);
    });
    
    it('应该处理用户没有元数据的情况', () => {
      // 创建没有元数据的用户
      const userWithoutMetadata = {
        id: 'user-789',
        email: 'noMetadata@example.com'
      };
      
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果
      expect(service.hasRole(userWithoutMetadata, 'user')).toBe(false);
      expect(service.hasRole(userWithoutMetadata, 'admin')).toBe(false);
    });
  });
  
  describe('hasPermission', () => {
    it('应该正确检查用户是否具有指定权限', async () => {
      // 模拟RPC调用结果
      mockSupabaseClient.rpc.mockImplementation((funcName, params) => {
        if (funcName === 'check_user_permission') {
          if (params.user_id === 'user-123' && params.permission === 'read_asset') {
            return Promise.resolve({ data: true, error: null });
          } else if (params.user_id === 'user-123' && params.permission === 'delete_asset') {
            return Promise.resolve({ data: false, error: null });
          }
        }
        return Promise.resolve({ data: null, error: { message: '未知权限' } });
      });
      
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果
      const hasReadPermission = await service.hasPermission(testUser.id, 'read_asset');
      expect(hasReadPermission).toBe(true);
      
      const hasDeletePermission = await service.hasPermission(testUser.id, 'delete_asset');
      expect(hasDeletePermission).toBe(false);
      
      // 验证RPC调用
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_user_permission', {
        user_id: 'user-123',
        permission: 'read_asset'
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_user_permission', {
        user_id: 'user-123',
        permission: 'delete_asset'
      });
    });
    
    it('应该处理RPC调用错误', async () => {
      // 模拟RPC调用错误
      mockSupabaseClient.rpc.mockImplementation(() => {
        return Promise.resolve({ data: null, error: { message: '数据库错误' } });
      });
      
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果
      const hasPermission = await service.hasPermission(testUser.id, 'read_asset');
      expect(hasPermission).toBe(false);
      
      // 验证RPC调用
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('check_user_permission', {
        user_id: 'user-123',
        permission: 'read_asset'
      });
    });
  });
  
  describe('isResourceOwner', () => {
    it('应该正确检查用户是否是资源所有者', async () => {
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果 - 用户是资源所有者
      const isOwner = await service.isResourceOwner(testUser.id, 'assets', testAsset.id);
      expect(isOwner).toBe(true);
      
      // 验证Supabase调用
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('assets');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', testAsset.id);
      expect(mockSupabaseClient.single).toHaveBeenCalled();
    });
    
    it('应该处理用户不是资源所有者的情况', async () => {
      // 修改测试资产的所有者ID
      const assetWithDifferentOwner = {
        ...testAsset,
        owner_id: 'different-user-id'
      };
      
      // 模拟Supabase返回不同所有者的资产
      mockSupabaseClient.single.mockResolvedValue({ data: assetWithDifferentOwner, error: null });
      
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果 - 用户不是资源所有者
      const isOwner = await service.isResourceOwner(testUser.id, 'assets', testAsset.id);
      expect(isOwner).toBe(false);
    });
    
    it('应该处理资源不存在的情况', async () => {
      // 模拟Supabase返回错误
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: { message: '资源不存在' } });
      
      // 创建服务实例
      const service = new PermissionCheckService(mockSupabaseClient);
      
      // 验证结果 - 资源不存在
      const isOwner = await service.isResourceOwner(testUser.id, 'assets', 'non-existent-id');
      expect(isOwner).toBe(false);
    });
  });
  
  describe('canAccessResource', () => {
    it('应该允许资源所有者访问资源', async () => {
      // 模拟isResourceOwner返回true
      const service = new PermissionCheckService(mockSupabaseClient);
      jest.spyOn(service, 'isResourceOwner').mockResolvedValue(true);
      jest.spyOn(service, 'hasPermission').mockResolvedValue(false);
      
      // 验证结果
      const canAccess = await service.canAccessResource(testUser.id, 'assets', testAsset.id, 'read');
      expect(canAccess).toBe(true);
      expect(service.isResourceOwner).toHaveBeenCalledWith(testUser.id, 'assets', testAsset.id);
      expect(service.hasPermission).not.toHaveBeenCalled();
    });
    
    it('应该允许具有权限的用户访问资源', async () => {
      // 模拟isResourceOwner返回false，但hasPermission返回true
      const service = new PermissionCheckService(mockSupabaseClient);
      jest.spyOn(service, 'isResourceOwner').mockResolvedValue(false);
      jest.spyOn(service, 'hasPermission').mockResolvedValue(true);
      
      // 验证结果
      const canAccess = await service.canAccessResource(testUser.id, 'assets', testAsset.id, 'read');
      expect(canAccess).toBe(true);
      expect(service.isResourceOwner).toHaveBeenCalledWith(testUser.id, 'assets', testAsset.id);
      expect(service.hasPermission).toHaveBeenCalledWith(testUser.id, 'read_assets');
    });
    
    it('应该拒绝没有权限且不是所有者的用户访问资源', async () => {
      // 模拟isResourceOwner和hasPermission都返回false
      const service = new PermissionCheckService(mockSupabaseClient);
      jest.spyOn(service, 'isResourceOwner').mockResolvedValue(false);
      jest.spyOn(service, 'hasPermission').mockResolvedValue(false);
      
      // 验证结果
      const canAccess = await service.canAccessResource(testUser.id, 'assets', testAsset.id, 'read');
      expect(canAccess).toBe(false);
      expect(service.isResourceOwner).toHaveBeenCalledWith(testUser.id, 'assets', testAsset.id);
      expect(service.hasPermission).toHaveBeenCalledWith(testUser.id, 'read_assets');
    });
  });
});