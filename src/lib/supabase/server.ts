import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) {
    console.error('Supabase 环境变量缺失: NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const cookieStore = cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name);
        return cookie?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // 在某些情况下（如静态渲染）可能无法设置 cookies
          console.warn('无法设置 cookie:', name, error);
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          console.warn('无法删除 cookie:', name, error);
        }
      },
    },
  });

  return supabase as unknown as SupabaseClient;
}

// 保持向后兼容
export function getSupabaseServerClient(): SupabaseClient {
  return createClient();
}

// 服务端示例：获取会话（可在 Server Component/Route Handler 中调用）
export async function getServerSession() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error('getSession error:', error.message);
  return data.session;
}