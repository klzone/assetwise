'use server'

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from './auth-middleware';

/**
 * 资源所有权验证中间件
 * 确保用户只能访问属于自己的资源
 * 
 * @param resourceTable 资源表名
 * @param resourceIdParam 资源ID参数名
 * @param handler API处理函数
 * @returns 处理后的响应
 */
export function withResourceOwnership(
  resourceTable: string,
  resourceIdParam: string,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();
      
      // 改进的资源ID提取逻辑
      let resourceId;
      
      // 1. 尝试从查询参数获取
      resourceId = request.nextUrl.searchParams.get(resourceIdParam);
      
      // 2. 如果不存在，尝试从路径中提取
      if (!resourceId) {
        const pathParts = request.url.split('/');
        const paramIndex = pathParts.findIndex(part => 
          part === resourceTable || part === resourceTable.slice(0, -1)
        );
        
        if (paramIndex >= 0 && paramIndex < pathParts.length - 1) {
          resourceId = pathParts[paramIndex + 1];
        }
      }
      
      // 3. 如果仍然不存在，尝试从请求体获取
      if (!resourceId && request.method !== 'GET') {
        try {
          const body = await request.clone().json();
          resourceId = body[resourceIdParam] || body.id;
        } catch (e) {
          console.error('解析请求体失败:', e);
        }
      }

      if (!resourceId) {
        return NextResponse.json(
          { error: '资源ID缺失', details: '无法确定要访问的资源ID' },
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
        console.error(`资源不存在或查询错误: ${error?.message || '未知错误'}`);
        return NextResponse.json(
          { error: '资源不存在', details: error?.message || '请求的资源不存在或无法访问' },
          { status: 404 }
        );
      }

      if (resource.user_id !== user.id) {
        console.warn(`用户 ${user.id} 尝试访问不属于他的资源 ${resourceId}`);
        return NextResponse.json(
          { error: '无权访问此资源', details: '您没有权限访问或修改此资源' },
          { status: 403 }
        );
      }

      // 资源所有权验证通过，继续处理请求
      return await handler(request, user);

    } catch (error: any) {
      console.error('资源所有权验证错误:', error);
      return NextResponse.json(
        { error: '服务器内部错误', details: error?.message || '处理请求时发生错误' },
        { status: 500 }
      );
    }
  });
}

/**
 * 创建API路由处理工厂
 * 统一应用资源所有权验证中间件
 * 
 * @param resourceTable 资源表名
 * @param resourceIdParam 资源ID参数名
 * @param handler API处理函数
 * @returns API路由处理函数
 */
export function createResourceApiHandler(
  resourceTable: string,
  resourceIdParam: string,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return withResourceOwnership(resourceTable, resourceIdParam, handler);
}

/**
 * 资产API路由处理工厂
 * 
 * @param handler API处理函数
 * @returns API路由处理函数
 */
export function createAssetApiHandler(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return createResourceApiHandler('assets', 'assetId', handler);
}

/**
 * 项目API路由处理工厂
 * 
 * @param handler API处理函数
 * @returns API路由处理函数
 */
export function createProjectApiHandler(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return createResourceApiHandler('projects', 'projectId', handler);
}

/**
 * 报告API路由处理工厂
 * 
 * @param handler API处理函数
 * @returns API路由处理函数
 */
export function createReportApiHandler(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return createResourceApiHandler('reports', 'reportId', handler);
}