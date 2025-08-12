'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store';
import { AuthUser } from '@/lib/services/supabase-auth.service';

export function TestUserProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, setAuthenticated } = useUserStore();

  useEffect(() => {
    // 只在测试环境中初始化模拟用户
    const isTestMode = typeof window !== 'undefined' &&
                      (window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1');

    if (isTestMode && !user) {
      // 检查是否已有测试用户
      const existingUser = localStorage.getItem('assetwise_current_user');

      if (existingUser) {
        try {
          const parsedUser = JSON.parse(existingUser);
          // 创建完整的AuthUser对象，使用实际注册的UUID
          const testUser: AuthUser = {
            id: '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37', // 使用实际注册的UUID
            email: parsedUser.email || 'yvanai@outlook.com',
            username: parsedUser.username || 'test_user',
            full_name: parsedUser.full_name || '测试用户',
            avatar_url: parsedUser.avatar_url || '',
            subscription_type: parsedUser.subscription_type || 'flagship',
            subscription_expires_at: parsedUser.subscription_expires_at || undefined,
            phone: parsedUser.phone || '13590202',
            location: parsedUser.location || '深圳',
            bio: parsedUser.bio || '思考中……'
          };

          setUser(testUser);
          setAuthenticated(true);
          console.log('已加载测试用户:', testUser.username, 'ID:', testUser.id);
        } catch (error) {
          console.error('解析测试用户失败:', error);
          createDefaultTestUser();
        }
      } else {
        createDefaultTestUser();
      }
    }
  }, [user, setUser, setAuthenticated]); // 添加user依赖，确保状态同步

  const createDefaultTestUser = () => {
    const defaultTestUser: AuthUser = {
      id: '11ed58fc-b9cc-4c6b-ba81-b9c9f5190f37', // 使用实际注册的UUID
      email: 'yvanai@outlook.com',
      username: 'test_user',
      full_name: '测试用户',
      avatar_url: '',
      subscription_type: 'flagship',
      subscription_expires_at: undefined,
      phone: '13590202',
      location: '深圳',
      bio: '思考中……'
    };

    // 保存到localStorage以便其他组件使用
    localStorage.setItem('assetwise_current_user', JSON.stringify(defaultTestUser));

    setUser(defaultTestUser);
    setAuthenticated(true);
    console.log('已创建默认测试用户:', defaultTestUser.username, 'ID:', defaultTestUser.id);
  };

  return <>{children}</>;
}
