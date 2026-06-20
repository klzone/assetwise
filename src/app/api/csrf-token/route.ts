/**
 * CSRF Token API Endpoint
 * 为客户端提供CSRF令牌
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf-protection';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 生成新的CSRF令牌和密钥
    const token = CSRFProtection.generateToken();
    const secret = CSRFProtection.generateSecret();
    
    // 创建令牌哈希用于验证
    const hash = CSRFProtection.createTokenHash(token, secret);
    
    // 设置响应头和Cookie
    const response = NextResponse.json({
      token,
      secret,
      expires: Date.now() + 3600000, // 1小时后过期
    });

    // 设置安全的Cookie
    response.cookies.set('_csrf_token', hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1小时
      path: '/',
    });

    // 添加安全头
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        code: 'CSRF_GENERATION_ERROR',
      },
      { status: 500 }
    );
  }
}

// 不允许其他HTTP方法
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}