import { ResourceOwnershipMiddleware } from '../resource-ownership.middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 资源所有权中间件单元测试
 */
describe('ResourceOwnershipMiddleware', () => {
  // 模拟请求和响应对象
  let mockRequest: jest.Mocked<NextRequest>;
  let mockResponse: jest.Mocked<NextResponse>;
  let mockNext: jest.Mock;
  
  // 模拟用户和资源数据
  const mockUser = { id: 'user-123', role: 'user' };
  const mockAdmin = { id: 'admin-456', role: 'admin' };
  const mockResource = { id: 'resource-789', ownerId: 'user-123' };
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 创建模拟请求
    mockRequest = {
      nextUrl: { pathname: '/api/resources/resource-789' },
      headers: new Headers(),
      json: jest.fn(),
    } as unknown as jest.Mocked<NextRequest>;
    
    // 创建模拟响应
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<NextResponse>;
    
    // 创建模拟next函数
    mockNext = jest.fn();
  });
  
  describe('validateResourceOwnership', () => {
    it('应该允许资源所有者访问', async () => {
      // 模拟请求中包含用户信息
      mockRequest.json.mockResolvedValue({ ...mockResource });
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      const result = await middleware.validateResourceOwnership(
        mockRequest,
        mockUser,
        'resource-789'
      );
      
      // 验证结果
      expect(result.isOwner).toBe(true);
      expect(result.resource).toEqual(mockResource);
    });
    
    it('应该拒绝非资源所有者访问', async () => {
      // 模拟请求中包含用户信息
      mockRequest.json.mockResolvedValue({ ...mockResource });
      
      // 创建不同用户
      const otherUser = { id: 'other-user', role: 'user' };
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      const result = await middleware.validateResourceOwnership(
        mockRequest,
        otherUser,
        'resource-789'
      );
      
      // 验证结果
      expect(result.isOwner).toBe(false);
      expect(result.resource).toEqual(mockResource);
    });
    
    it('应该允许管理员访问任何资源', async () => {
      // 模拟请求中包含用户信息
      mockRequest.json.mockResolvedValue({ ...mockResource });
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      const result = await middleware.validateResourceOwnership(
        mockRequest,
        mockAdmin,
        'resource-789'
      );
      
      // 验证结果
      expect(result.isOwner).toBe(true);
      expect(result.resource).toEqual(mockResource);
    });
    
    it('应该处理资源不存在的情况', async () => {
      // 模拟请求返回null
      mockRequest.json.mockResolvedValue(null);
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      const result = await middleware.validateResourceOwnership(
        mockRequest,
        mockUser,
        'non-existent-resource'
      );
      
      // 验证结果
      expect(result.isOwner).toBe(false);
      expect(result.resource).toBeNull();
      expect(result.error).toBe('资源不存在');
    });
  });
  
  describe('handleRequest', () => {
    it('应该允许GET请求不检查所有权', async () => {
      // 模拟GET请求
      mockRequest.method = 'GET';
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(
        mockRequest,
        mockUser,
        mockNext
      );
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('应该拦截非所有者的修改请求', async () => {
      // 模拟PUT请求
      mockRequest.method = 'PUT';
      mockRequest.json.mockResolvedValue({ ...mockResource, ownerId: 'other-user' });
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 模拟NextResponse.json方法
      const mockJsonResponse = { status: 403, body: { error: '无权访问此资源' } };
      NextResponse.json = jest.fn().mockReturnValue(mockJsonResponse);
      
      // 调用中间件方法
      const result = await middleware.handleRequest(
        mockRequest,
        mockUser,
        mockNext
      );
      
      // 验证结果
      expect(result).toEqual(mockJsonResponse);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: '无权访问此资源' },
        { status: 403 }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('应该允许所有者的修改请求', async () => {
      // 模拟PUT请求
      mockRequest.method = 'PUT';
      mockRequest.json.mockResolvedValue({ ...mockResource });
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(
        mockRequest,
        mockUser,
        mockNext
      );
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('应该允许管理员的修改请求', async () => {
      // 模拟DELETE请求
      mockRequest.method = 'DELETE';
      mockRequest.json.mockResolvedValue({ ...mockResource });
      
      // 创建中间件实例
      const middleware = new ResourceOwnershipMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(
        mockRequest,
        mockAdmin,
        mockNext
      );
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
  });
});