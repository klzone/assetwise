import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiSecurityService } from '@/lib/services/secure-data.service';

/**
 * API认证中间件
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    // 检查速率限制
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!ApiSecurityService.checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 验证CSRF令牌（对于POST、PUT、DELETE请求）
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      const csrfToken = request.headers.get('X-CSRF-Token');
      const storedToken = request.cookies.get('csrf-token')?.value;
      
      if (!csrfToken || !storedToken || !ApiSecurityService.validateCSRFToken(csrfToken, storedToken)) {
        return NextResponse.json(
          { error: 'CSRF令牌验证失败' },
          { status: 403 }
        );
      }
    }

    // 创建Supabase客户端
    const supabase = await createClient();
    
    // 获取用户认证信息
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 验证用户是否存在于数据库中
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_type, subscription_expires_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '用户档案不存在' },
        { status: 403 }
      );
    }

    // 检查订阅状态（如果需要）
    if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()) {
      return NextResponse.json(
        { error: '订阅已过期' },
        { status: 403 }
      );
    }

    // 调用实际的处理函数
    return await handler(request, { ...user, profile });

  } catch (error) {
    console.error('认证中间件错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 检查用户权限的中间件
 */
export async function withPermission(
  request: NextRequest,
  requiredSubscription: 'free' | 'professional' | 'flagship',
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    const subscriptionLevels = {
      'free': 0,
      'professional': 1,
      'flagship': 2
    };

    const userLevel = subscriptionLevels[user.profile.subscription_type as keyof typeof subscriptionLevels] || 0;
    const requiredLevel = subscriptionLevels[requiredSubscription];

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { error: '权限不足，需要升级订阅' },
        { status: 403 }
      );
    }

    return await handler(req, user);
  });
}

/**
 * 资源所有权验证中间件
 */
export async function withResourceOwnership(
  request: NextRequest,
  resourceTable: string,
  resourceIdParam: string,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(request, async (req, user) => {
    try {
      const supabase = await createClient();
      const resourceId = req.nextUrl.searchParams.get(resourceIdParam) || 
                        req.url.split('/').pop();

      if (!resourceId) {
        return NextResponse.json(
          { error: '资源ID缺失' },
          { status: 400 }
        );
      }

      // 检查资源是否属于当前用户
      const { data: resource, error } = await supabase
        .from(resourceTable)
        .select('user_id')
        .eq('id', resourceId)
        .single();

      if (error || !resource) {
        return NextResponse.json(
          { error: '资源不存在' },
          { status: 404 }
        );
      }

      if (resource.user_id !== user.id) {
        return NextResponse.json(
          { error: '无权访问此资源' },
          { status: 403 }
        );
      }

      return await handler(req, user);

    } catch (error) {
      console.error('资源所有权验证错误:', error);
      return NextResponse.json(
        { error: '服务器内部错误' },
        { status: 500 }
      );
    }
  });
}

/**
 * 输入验证中间件
 */
export async function withValidation<T>(
  request: NextRequest,
  schema: (data: any) => { isValid: boolean; errors: string[]; data?: T },
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  try {
    const body = await request.json();
    const validation = schema(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: '输入验证失败', details: validation.errors },
        { status: 400 }
      );
    }

    return await handler(request, validation.data!);

  } catch (error) {
    console.error('输入验证错误:', error);
    return NextResponse.json(
      { error: '请求数据格式错误' },
      { status: 400 }
    );
  }
}

/**
 * 日志记录中间件
 */
export function withLogging(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const method = req.method;
    const url = req.url;
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';

    console.log(`[API] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;
      
      console.log(`[API] ${method} ${url} - ${response.status} - ${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API] ${method} ${url} - ERROR - ${duration}ms:`, error);
      
      return NextResponse.json(
        { error: '服务器内部错误' },
        { status: 500 }
      );
    }
  };
}

/**
 * 组合多个中间件
 */
export function compose(...middlewares: Array<(req: NextRequest, next: any) => Promise<NextResponse>>) {
  return async (request: NextRequest) => {
    let index = 0;

    async function next(): Promise<NextResponse> {
      if (index >= middlewares.length) {
        return NextResponse.json({ error: '没有处理函数' }, { status: 500 });
      }

      const middleware = middlewares[index++];
      return await middleware(request, next);
    }

    return await next();
  };
}