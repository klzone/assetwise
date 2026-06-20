import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { CSRFProtection } from '@/lib/security/csrf-protection'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 安全头设置
  const response = NextResponse.next()
  
  // 添加安全头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // CSRF保护检查
  const csrfResponse = CSRFProtection.middleware(request)
  if (csrfResponse) {
    return csrfResponse // 返回CSRF错误响应
  }
  
  // API路由安全检查
  if (pathname.startsWith('/api/')) {
    // 检查请求频率限制
    const rateLimitResponse = await checkRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // 验证API密钥（如果需要）
    if (pathname.startsWith('/api/admin/')) {
      const authResponse = await checkAdminAuth(request)
      if (authResponse) {
        return authResponse
      }
    }
  }
  
  // Supabase会话更新
  const sessionResponse = await updateSession(request)
  
  // 合并响应头
  if (sessionResponse) {
    response.headers.forEach((value, key) => {
      sessionResponse.headers.set(key, value)
    })
    return sessionResponse
  }
  
  return response
}

// 简单的速率限制检查
async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `rate_limit:${ip}`
  
  // 这里应该使用Redis或其他缓存系统
  // 简化实现：在生产环境中应该使用专业的速率限制服务
  
  return null // 暂时不实施速率限制
}

// 管理员权限检查
async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // 这里应该验证JWT令牌
  // 简化实现：在实际项目中需要完整的JWT验证
  
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
