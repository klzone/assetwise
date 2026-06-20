/**
 * 测试工具库
 * 提供测试辅助函数、Mock工厂和自定义渲染器
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/toaster';

// 测试数据工厂
export class TestDataFactory {
  /**
   * 创建测试用户数据
   */
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      full_name: '测试用户',
      avatar_url: null,
      phone: null,
      location: null,
      bio: null,
      subscription_type: 'free',
      subscription_expires_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  /**
   * 创建测试资产数据
   */
  static createAsset(overrides: Partial<any> = {}) {
    return {
      id: '1',
      user_id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'stock',
      exchange: 'NASDAQ',
      currency: 'USD',
      current_price: 150.00,
      market_cap: 2500000000000,
      description: 'Technology company',
      is_active: true,
      account_id: '1',
      quantity: 10,
      average_cost: 145.00,
      market_value: 1500.00,
      profit_loss: 50.00,
      profit_loss_percentage: 3.45,
      day_change: 2.50,
      day_change_rate: 1.69,
      weight: 25.5,
      volatility: 0.25,
      beta: 1.2,
      sharpe_ratio: 1.8,
      max_drawdown: 0.15,
      last_updated: '2024-01-01T12:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T12:00:00Z',
      ...overrides,
    };
  }

  /**
   * 创建测试交易记录数据
   */
  static createTransaction(overrides: Partial<any> = {}) {
    return {
      id: '1',
      user_id: '1',
      account_id: '1',
      type: 'buy',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 10,
      price: 145.00,
      amount: 1450.00,
      fee: 5.00,
      tax: 0,
      notes: '购买苹果股票',
      transaction_date: '2024-01-01T10:00:00Z',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      ...overrides,
    };
  }

  /**
   * 创建测试账户数据
   */
  static createAccount(overrides: Partial<any> = {}) {
    return {
      id: '1',
      user_id: '1',
      name: '证券账户',
      type: 'securities',
      broker: '招商证券',
      account_number: '****1234',
      currency: 'CNY',
      balance: 50000.00,
      initial_balance: 100000.00,
      description: '主要投资账户',
      is_active: true,
      risk_level: 'medium',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  /**
   * 创建测试复盘记录数据
   */
  static createReview(overrides: Partial<any> = {}) {
    return {
      id: '1',
      user_id: '1',
      title: '2024年第一季度投资复盘',
      content: '本季度投资表现良好，收益率达到15%...',
      tags: ['季度复盘', '股票', '收益'],
      performance_rating: 4,
      lessons_learned: '需要更加关注风险控制',
      review_date: '2024-03-31T18:00:00Z',
      created_at: '2024-03-31T18:00:00Z',
      updated_at: '2024-03-31T18:00:00Z',
      ...overrides,
    };
  }

  /**
   * 创建测试投资计划数据
   */
  static createInvestmentPlan(overrides: Partial<any> = {}) {
    return {
      id: '1',
      user_id: '1',
      title: '科技股投资计划',
      description: '重点投资优质科技公司股票',
      target_amount: 100000.00,
      current_amount: 45000.00,
      target_date: '2024-12-31',
      status: 'active',
      risk_level: 'high',
      category: 'stock',
      expected_return: 20.0,
      actual_return: 15.5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  /**
   * 创建批量测试数据
   */
  static createBatch<T>(factory: () => T, count: number, overrides: Partial<T>[] = []): T[] {
    return Array.from({ length: count }, (_, index) => {
      const baseData = factory();
      const override = overrides[index] || {};
      return { ...baseData, ...override };
    });
  }
}

// Mock工厂
export class MockFactory {
  /**
   * 创建Mock函数并记录调用
   */
  static createMockFn<T extends (...args: any[]) => any>(
    implementation?: T
  ): jest.MockedFunction<T> {
    return jest.fn(implementation) as jest.MockedFunction<T>;
  }

  /**
   * 创建Mock Supabase客户端
   */
  static createMockSupabaseClient() {
    return {
      from: MockFactory.createMockFn(() => ({
        select: MockFactory.createMockFn(() => ({
          eq: MockFactory.createMockFn(() => ({
            order: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
            limit: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
            single: MockFactory.createMockFn(() => Promise.resolve({ data: null, error: null })),
          })),
          limit: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
          range: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
        })),
        insert: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
        update: MockFactory.createMockFn(() => ({
          eq: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
        })),
        delete: MockFactory.createMockFn(() => ({
          eq: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
        })),
        upsert: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
      })),
      auth: {
        getUser: MockFactory.createMockFn(() => 
          Promise.resolve({ data: { user: TestDataFactory.createUser() }, error: null })
        ),
        signInWithPassword: MockFactory.createMockFn(() =>
          Promise.resolve({ data: { user: TestDataFactory.createUser() }, error: null })
        ),
        signUp: MockFactory.createMockFn(() =>
          Promise.resolve({ data: { user: TestDataFactory.createUser() }, error: null })
        ),
        signOut: MockFactory.createMockFn(() => Promise.resolve({ error: null })),
        getSession: MockFactory.createMockFn(() =>
          Promise.resolve({ data: { session: null }, error: null })
        ),
      },
      storage: {
        from: MockFactory.createMockFn(() => ({
          upload: MockFactory.createMockFn(() => Promise.resolve({ data: {}, error: null })),
          download: MockFactory.createMockFn(() => Promise.resolve({ data: new Blob(), error: null })),
          remove: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
          list: MockFactory.createMockFn(() => Promise.resolve({ data: [], error: null })),
        })),
      },
    };
  }

  /**
   * 创建Mock Next.js路由器
   */
  static createMockRouter() {
    return {
      push: MockFactory.createMockFn(),
      replace: MockFactory.createMockFn(),
      prefetch: MockFactory.createMockFn(),
      back: MockFactory.createMockFn(),
      forward: MockFactory.createMockFn(),
      refresh: MockFactory.createMockFn(),
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
      isReady: true,
      events: {
        on: MockFactory.createMockFn(),
        off: MockFactory.createMockFn(),
        emit: MockFactory.createMockFn(),
      },
    };
  }

  /**
   * 创建Mock fetch响应
   */
  static createMockFetchResponse(data: any, options: { status?: number; ok?: boolean } = {}) {
    return Promise.resolve({
      ok: options.ok ?? true,
      status: options.status ?? 200,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    } as Response);
  }

  /**
   * 创建Mock localStorage
   */
  static createMockLocalStorage() {
    const store: Record<string, string> = {};
    
    return {
      getItem: MockFactory.createMockFn((key: string) => store[key] || null),
      setItem: MockFactory.createMockFn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: MockFactory.createMockFn((key: string) => {
        delete store[key];
      }),
      clear: MockFactory.createMockFn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: Object.keys(store).length,
      key: MockFactory.createMockFn((index: number) => Object.keys(store)[index] || null),
    };
  }

  /**
   * 创建Mock WebSocket
   */
  static createMockWebSocket() {
    const listeners: Record<string, Function[]> = {};
    
    return {
      addEventListener: MockFactory.createMockFn((event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      }),
      removeEventListener: MockFactory.createMockFn((event: string, callback: Function) => {
        if (listeners[event]) {
          const index = listeners[event].indexOf(callback);
          if (index > -1) listeners[event].splice(index, 1);
        }
      }),
      send: MockFactory.createMockFn(),
      close: MockFactory.createMockFn(),
      readyState: 1, // OPEN
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
      dispatchEvent: MockFactory.createMockFn((event: Event) => {
        const eventListeners = listeners[event.type] || [];
        eventListeners.forEach(listener => listener(event));
        return true;
      }),
    };
  }
}

// 测试环境设置工具
export class TestEnvironment {
  /**
   * 设置测试环境
   */
  static setup() {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock window.ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock window.IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock window.requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

    // Mock window.scrollTo
    global.scrollTo = jest.fn();

    // Mock document.getElementById
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id: string) => {
      if (id === 'main-content') {
        return {
          focus: jest.fn(),
          tabIndex: -1,
        } as any;
      }
      return originalGetElementById.call(document, id);
    });
  }

  /**
   * 清理测试环境
   */
  static cleanup() {
    jest.clearAllMocks();
    jest.clearAllTimers();
  }

  /**
   * 模拟时间流逝
   */
  static async waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 模拟用户交互延迟
   */
  static async simulateUserDelay() {
    return TestEnvironment.waitFor(100);
  }
}

// 自定义渲染器
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  theme?: 'light' | 'dark' | 'system';
}

function createTestWrapper(options: CustomRenderOptions = {}) {
  const { queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  }), theme = 'light' } = options;

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme={theme}
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * 自定义render函数，预配置测试环境
 */
export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { queryClient, theme, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: createTestWrapper({ queryClient, theme }),
    ...renderOptions,
  });
}

// 测试断言辅助函数
export class TestAssertions {
  /**
   * 断言元素可见
   */
  static expectElementToBeVisible(element: HTMLElement) {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  }

  /**
   * 断言元素不可见
   */
  static expectElementToBeHidden(element: HTMLElement | null) {
    if (element) {
      expect(element).not.toBeVisible();
    } else {
      expect(element).not.toBeInTheDocument();
    }
  }

  /**
   * 断言加载状态
   */
  static expectLoadingState(container: HTMLElement) {
    expect(container).toHaveTextContent(/loading|加载中|请稍候/i);
  }

  /**
   * 断言错误状态
   */
  static expectErrorState(container: HTMLElement, errorMessage?: string) {
    expect(container).toHaveTextContent(/error|错误|失败/i);
    if (errorMessage) {
      expect(container).toHaveTextContent(errorMessage);
    }
  }

  /**
   * 断言表单验证错误
   */
  static expectFormValidationError(container: HTMLElement, fieldName?: string) {
    const errorElements = container.querySelectorAll('[role="alert"], .error, .text-red-500');
    expect(errorElements.length).toBeGreaterThan(0);
    
    if (fieldName) {
      const fieldError = container.querySelector(`[data-testid="${fieldName}-error"]`);
      expect(fieldError).toBeInTheDocument();
    }
  }

  /**
   * 断言API调用
   */
  static expectApiCall(mockFn: jest.MockedFunction<any>, expectedArgs?: any[]) {
    expect(mockFn).toHaveBeenCalled();
    if (expectedArgs) {
      expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
    }
  }

  /**
   * 断言路由导航
   */
  static expectRouterNavigation(mockRouter: any, expectedPath: string) {
    expect(mockRouter.push).toHaveBeenCalledWith(expectedPath);
  }
}

// 重新导出常用的测试工具
export * from '@testing-library/react';
export * from '@testing-library/jest-dom';
export * from '@testing-library/user-event';
export { customRender as render };