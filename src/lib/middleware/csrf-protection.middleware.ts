import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * CSRF令牌验证服务
 */
export class CsrfProtectionService {
  private static readonly CSRF_COOKIE_NAME = 'assetwise-csrf-token';
  private static readonly CSRF_HEADER_NAME = 'X-CSRF-Token';
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24小时
  
  /**
   * 生成CSRF令牌
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * 设置CSRF令牌Cookie
   */
  static setTokenCookie(): string {
    const token = this.generateToken();
    const cookieStore = cookies();
    
    cookieStore.set({
      name: this.CSRF_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: this.TOKEN_EXPIRY / 1000 // 转换为秒
    });
    
    return token;
  }
  
  /**
   * 获取CSRF令牌Cookie
   */
  static getTokenFromCookie(): string | undefined {
    const cookieStore = cookies();
    return cookieStore.get(this.CSRF_COOKIE_NAME)?.value;
  }
  
  /**
   * 验证CSRF令牌
   */
  static validateToken(request: NextRequest): boolean {
    const storedToken = this.getTokenFromCookie();
    const requestToken = request.headers.get(this.CSRF_HEADER_NAME);
    
    if (!storedToken || !requestToken) {
      return false;
    }
    
    // 使用时间安全的比较方法防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(requestToken)
    );
  }
}

/**
 * CSRF保护中间件
 * 确保所有修改数据的请求都包含有效的CSRF令牌
 * 
 * @param handler API处理函数
 * @returns 处理后的响应
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // 对所有修改数据的请求验证CSRF令牌
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      if (!CsrfProtectionService.validateToken(request)) {
        console.warn(`CSRF令牌验证失败: ${request.url}`);
        return NextResponse.json(
          { error: 'CSRF令牌验证失败', details: '请求未包含有效的安全令牌' },
          { status: 403 }
        );
      }
    }
    
    // CSRF验证通过，继续处理请求
    return handler(request);
  };
}

/**
 * 创建API路由处理工厂（带CSRF保护）
 * 
 * @param handler API处理函数
 * @returns API路由处理函数
 */
export function createProtectedApiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withCsrfProtection(handler);
}

/**
 * 获取CSRF令牌API处理函数
 * 用于前端获取新的CSRF令牌
 */
export async function getCsrfToken(): Promise<NextResponse> {
  const token = CsrfProtectionService.setTokenCookie();
  
  return NextResponse.json({ token });
}