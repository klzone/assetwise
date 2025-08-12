import { CSRFProtectionMiddleware } from '../csrf-protection.middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CSRF保护中间件单元测试
 */
describe('CSRFProtectionMiddleware', () => {
  // 模拟请求和响应对象
  let mockRequest: jest.Mocked<NextRequest>;
  let mockResponse: jest.Mocked<NextResponse>;
  let mockNext: jest.Mock;
  
  // 有效的CSRF令牌
  const validToken = 'valid-csrf-token-123';
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 创建模拟请求
    mockRequest = {
      nextUrl: { pathname: '/api/resources' },
      headers: new Headers(),
      cookies: {
        get: jest.fn(),
      },
      method: 'POST',
    } as unknown as jest.Mocked<NextRequest>;
    
    // 创建模拟响应
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<NextResponse>;
    
    // 创建模拟next函数
    mockNext = jest.fn();
  });
  
  describe('validateCSRFToken', () => {
    it('应该验证有效的CSRF令牌', () => {
      // 设置请求头中的CSRF令牌
      mockRequest.headers.set('X-CSRF-Token', validToken);
      
      // 设置Cookie中的CSRF令牌
      mockRequest.cookies.get = jest.fn().mockReturnValue({ 
        name: 'csrf_token', 
        value: validToken 
      });
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      const result = middleware.validateCSRFToken(mockRequest);
      
      // 验证结果
      expect(result.isValid).toBe(true);
    });
    
    it('应该拒绝无效的CSRF令牌', () => {
      // 设置请求头中的CSRF令牌
      mockRequest.headers.set('X-CSRF-Token', 'invalid-token');
      
      // 设置Cookie中的CSRF令牌
      mockRequest.cookies.get = jest.fn().mockReturnValue({ 
        name: 'csrf_token', 
        value: validToken 
      });
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      const result = middleware.validateCSRFToken(mockRequest);
      
      // 验证结果
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSRF令牌无效');
    });
    
    it('应该拒绝缺少CSRF令牌的请求', () => {
      // 不设置请求头中的CSRF令牌
      
      // 设置Cookie中的CSRF令牌
      mockRequest.cookies.get = jest.fn().mockReturnValue({ 
        name: 'csrf_token', 
        value: validToken 
      });
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      const result = middleware.validateCSRFToken(mockRequest);
      
      // 验证结果
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('缺少CSRF令牌');
    });
    
    it('应该拒绝缺少Cookie中CSRF令牌的请求', () => {
      // 设置请求头中的CSRF令牌
      mockRequest.headers.set('X-CSRF-Token', validToken);
      
      // 不设置Cookie中的CSRF令牌
      mockRequest.cookies.get = jest.fn().mockReturnValue(null);
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      const result = middleware.validateCSRFToken(mockRequest);
      
      // 验证结果
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSRF令牌未设置');
    });
  });
  
  describe('handleRequest', () => {
    it('应该允许GET请求不检查CSRF令牌', async () => {
      // 模拟GET请求
      mockRequest.method = 'GET';
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(mockRequest, mockNext);
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('应该允许HEAD请求不检查CSRF令牌', async () => {
      // 模拟HEAD请求
      mockRequest.method = 'HEAD';
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(mockRequest, mockNext);
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('应该允许OPTIONS请求不检查CSRF令牌', async () => {
      // 模拟OPTIONS请求
      mockRequest.method = 'OPTIONS';
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(mockRequest, mockNext);
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('应该拦截没有有效CSRF令牌的修改请求', async () => {
      // 模拟POST请求
      mockRequest.method = 'POST';
      
      // 不设置CSRF令牌
      mockRequest.cookies.get = jest.fn().mockReturnValue(null);
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 模拟NextResponse.json方法
      const mockJsonResponse = { status: 403, body: { error: 'CSRF验证失败' } };
      NextResponse.json = jest.fn().mockReturnValue(mockJsonResponse);
      
      // 调用中间件方法
      const result = await middleware.handleRequest(mockRequest, mockNext);
      
      // 验证结果
      expect(result).toEqual(mockJsonResponse);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'CSRF验证失败', details: 'CSRF令牌未设置' },
        { status: 403 }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('应该允许有有效CSRF令牌的修改请求', async () => {
      // 模拟POST请求
      mockRequest.method = 'POST';
      
      // 设置请求头中的CSRF令牌
      mockRequest.headers.set('X-CSRF-Token', validToken);
      
      // 设置Cookie中的CSRF令牌
      mockRequest.cookies.get = jest.fn().mockReturnValue({ 
        name: 'csrf_token', 
        value: validToken 
      });
      
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      await middleware.handleRequest(mockRequest, mockNext);
      
      // 验证next被调用
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('generateCSRFToken', () => {
    it('应该生成有效的CSRF令牌', () => {
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 调用中间件方法
      const token = middleware.generateCSRFToken();
      
      // 验证结果
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20); // 令牌应该足够长
    });
    
    it('应该每次生成不同的CSRF令牌', () => {
      // 创建中间件实例
      const middleware = new CSRFProtectionMiddleware();
      
      // 生成多个令牌
      const token1 = middleware.generateCSRFToken();
      const token2 = middleware.generateCSRFToken();
      const token3 = middleware.generateCSRFToken();
      
      // 验证结果
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });
});