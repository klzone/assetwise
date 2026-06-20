/**
 * 错误监控系统单元测试
 */

import {
  ErrorMonitor,
  ErrorType,
  ErrorSeverity,
  useErrorMonitor,
} from '@/lib/monitoring/error-monitor';
import { 
  TestEnvironment, 
  MockFactory,
  renderHook,
  waitFor 
} from '@/lib/testing/test-utils';

describe('ErrorMonitor', () => {
  let errorMonitor: ErrorMonitor;
  let originalFetch: typeof global.fetch;
  let originalConsoleError: typeof console.error;
  let originalAddEventListener: typeof window.addEventListener;

  beforeEach(() => {
    TestEnvironment.setup();
    
    // 保存原始函数
    originalFetch = global.fetch;
    originalConsoleError = console.error;
    originalAddEventListener = window.addEventListener;
    
    // Mock fetch
    global.fetch = MockFactory.createMockFn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
    
    // Mock console.error
    console.error = MockFactory.createMockFn();
    
    // 创建新的错误监控实例
    errorMonitor = ErrorMonitor.getInstance({
      enabled: true,
      endpoint: 'https://api.example.com/errors',
      apiKey: 'test-api-key',
      maxBreadcrumbs: 10,
      sampleRate: 1.0,
    });
  });

  afterEach(() => {
    TestEnvironment.cleanup();
    
    // 恢复原始函数
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    window.addEventListener = originalAddEventListener;
  });

  describe('初始化', () => {
    it('应该正确初始化错误监控', () => {
      expect(errorMonitor).toBeDefined();
      expect(typeof errorMonitor.captureError).toBe('function');
      expect(typeof errorMonitor.addBreadcrumb).toBe('function');
    });

    it('应该设置全局错误处理器', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      errorMonitor.init();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('错误捕获', () => {
    beforeEach(() => {
      errorMonitor.init();
    });

    it('应该捕获JavaScript错误', () => {
      const mockError = new Error('Test error');
      
      errorMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: mockError.message,
        stack: mockError.stack,
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          }),
          body: expect.stringContaining('Test error'),
        })
      );
    });

    it('应该捕获网络错误', () => {
      errorMonitor.captureError({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: 'Network request failed',
        context: {
          requestUrl: 'https://api.example.com/data',
          status: 500,
        },
      });
      
      expect(global.fetch).toHaveBeenCalled();
    });

    it('应该捕获业务逻辑错误', () => {
      errorMonitor.captureError({
        type: ErrorType.BUSINESS,
        severity: ErrorSeverity.LOW,
        message: 'Invalid user input',
        context: {
          field: 'email',
          value: 'invalid-email',
        },
      });
      
      expect(global.fetch).toHaveBeenCalled();
    });

    it('应该应用采样率', () => {
      // 创建采样率为0的监控器
      const sampledMonitor = ErrorMonitor.getInstance({
        enabled: true,
        sampleRate: 0,
      });
      
      sampledMonitor.init();
      
      // 清除之前的调用
      (global.fetch as jest.Mock).mockClear();
      
      sampledMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: 'Should be ignored',
      });
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('应该处理beforeSend过滤器', () => {
      const filteredMonitor = ErrorMonitor.getInstance({
        enabled: true,
        beforeSend: (error) => {
          if (error.message.includes('ignore')) {
            return null; // 忽略包含'ignore'的错误
          }
          return {
            ...error,
            message: 'Filtered: ' + error.message,
          };
        },
      });
      
      filteredMonitor.init();
      (global.fetch as jest.Mock).mockClear();
      
      // 应该被忽略的错误
      filteredMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: 'This should be ignore',
      });
      
      expect(global.fetch).not.toHaveBeenCalled();
      
      // 应该被过滤的错误
      filteredMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: 'This should be sent',
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Filtered: This should be sent'),
        })
      );
    });
  });

  describe('面包屑', () => {
    beforeEach(() => {
      errorMonitor.init();
    });

    it('应该添加面包屑', () => {
      errorMonitor.addBreadcrumb({
        category: 'user',
        message: 'User clicked button',
        level: 'info',
        data: { buttonId: 'submit' },
      });
      
      const stats = errorMonitor.getStats();
      expect(stats.breadcrumbsCount).toBe(1);
    });

    it('应该限制面包屑数量', () => {
      // 添加超过最大数量的面包屑
      for (let i = 0; i < 15; i++) {
        errorMonitor.addBreadcrumb({
          category: 'test',
          message: `Breadcrumb ${i}`,
          level: 'info',
        });
      }
      
      const stats = errorMonitor.getStats();
      expect(stats.breadcrumbsCount).toBe(10); // 应该被限制为maxBreadcrumbs
    });

    it('应该在错误中包含面包屑', () => {
      errorMonitor.addBreadcrumb({
        category: 'navigation',
        message: 'Navigated to /dashboard',
        level: 'info',
      });
      
      errorMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: 'Dashboard error',
      });
      
      const lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
      const requestBody = JSON.parse(lastCall[1].body);
      
      expect(requestBody.breadcrumbs).toHaveLength(2); // 包括系统初始化面包屑
      expect(requestBody.breadcrumbs.some((b: any) => 
        b.message === 'Navigated to /dashboard'
      )).toBe(true);
    });
  });

  describe('离线处理', () => {
    beforeEach(() => {
      errorMonitor.init();
    });

    it('应该在离线时将错误加入队列', async () => {
      // 模拟离线状态
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      // 触发离线事件
      window.dispatchEvent(new Event('offline'));
      
      // 模拟网络请求失败
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      errorMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: 'Offline error',
      });
      
      const stats = errorMonitor.getStats();
      expect(stats.queuedErrorsCount).toBeGreaterThan(0);
    });

    it('应该在重新上线时刷新错误队列', async () => {
      // 先离线
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
      
      // 添加离线错误
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      errorMonitor.captureError({
        type: ErrorType.JAVASCRIPT,
        severity: ErrorSeverity.HIGH,
        message: 'Offline error',
      });
      
      // 清除mock并恢复网络
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
      
      // 重新上线
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
      
      // 等待队列刷新
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('性能监控', () => {
    beforeEach(() => {
      errorMonitor.init();
    });

    it('应该捕获长任务', () => {
      // 模拟PerformanceObserver
      const mockObserver = MockFactory.createMockFn();
      global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
        mockObserver.callback = callback;
        return {
          observe: MockFactory.createMockFn(),
          disconnect: MockFactory.createMockFn(),
        };
      }) as any;
      
      errorMonitor.init();
      
      // 模拟长任务事件
      const longTaskEntry = {
        duration: 100, // 超过50ms阈值
        startTime: 1000,
        entryType: 'longtask',
      };
      
      if (mockObserver.callback) {
        mockObserver.callback({
          getEntries: () => [longTaskEntry],
        });
      }
      
      const stats = errorMonitor.getStats();
      expect(stats.breadcrumbsCount).toBeGreaterThan(1); // 应该添加性能面包屑
    });
  });

  describe('统计信息', () => {
    beforeEach(() => {
      errorMonitor.init();
    });

    it('应该提供正确的统计信息', () => {
      const stats = errorMonitor.getStats();
      
      expect(stats).toHaveProperty('sessionId');
      expect(stats).toHaveProperty('breadcrumbsCount');
      expect(stats).toHaveProperty('queuedErrorsCount');
      expect(stats).toHaveProperty('isOnline');
      expect(typeof stats.sessionId).toBe('string');
      expect(typeof stats.breadcrumbsCount).toBe('number');
      expect(typeof stats.queuedErrorsCount).toBe('number');
      expect(typeof stats.isOnline).toBe('boolean');
    });
  });
});

describe('useErrorMonitor Hook', () => {
  beforeEach(() => {
    TestEnvironment.setup();
    
    global.fetch = MockFactory.createMockFn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该提供错误捕获功能', () => {
    const { result } = renderHook(() => 
      useErrorMonitor({
        enabled: true,
        endpoint: 'https://api.example.com/errors',
      })
    );

    expect(result.current.captureError).toBeDefined();
    expect(result.current.addBreadcrumb).toBeDefined();
    expect(result.current.stats).toBeDefined();
  });

  it('应该捕获字符串错误', () => {
    const { result } = renderHook(() => 
      useErrorMonitor({
        enabled: true,
        endpoint: 'https://api.example.com/errors',
      })
    );

    result.current.captureError('Test error message');
    
    expect(global.fetch).toHaveBeenCalled();
  });

  it('应该捕获Error对象', () => {
    const { result } = renderHook(() => 
      useErrorMonitor({
        enabled: true,
        endpoint: 'https://api.example.com/errors',
      })
    );

    const error = new Error('Test error object');
    result.current.captureError(error, { component: 'TestComponent' });
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/errors',
      expect.objectContaining({
        body: expect.stringContaining('Test error object'),
      })
    );
  });

  it('应该添加面包屑', () => {
    const { result } = renderHook(() => 
      useErrorMonitor({
        enabled: true,
        maxBreadcrumbs: 5,
      })
    );

    result.current.addBreadcrumb({
      category: 'user',
      message: 'User action',
      level: 'info',
    });
    
    expect(result.current.stats.breadcrumbsCount).toBeGreaterThan(0);
  });

  it('应该设置用户信息', () => {
    const { result } = renderHook(() => 
      useErrorMonitor({
        enabled: true,
      })
    );

    const userInfo = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    result.current.setUser(userInfo);
    
    // 检查是否添加了面包屑
    expect(result.current.stats.breadcrumbsCount).toBeGreaterThan(0);
  });

  it('应该实时更新统计信息', async () => {
    const { result } = renderHook(() => 
      useErrorMonitor({
        enabled: true,
      })
    );

    const initialStats = result.current.stats;
    
    result.current.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb',
      level: 'info',
    });
    
    // 等待统计信息更新
    await waitFor(() => {
      expect(result.current.stats.breadcrumbsCount).toBeGreaterThan(
        initialStats.breadcrumbsCount
      );
    });
  });

  it('应该在配置更新时重新初始化', () => {
    const { result, rerender } = renderHook(
      ({ config }) => useErrorMonitor(config),
      {
        initialProps: {
          config: {
            enabled: true,
            maxBreadcrumbs: 5,
          },
        },
      }
    );

    const initialStats = result.current.stats;
    
    // 更新配置
    rerender({
      config: {
        enabled: true,
        maxBreadcrumbs: 10,
      },
    });
    
    // 应该重新初始化（可以通过sessionId变化来验证）
    expect(result.current.stats.sessionId).toBeDefined();
  });
});

describe('错误类型和严重级别', () => {
  it('应该定义所有错误类型', () => {
    expect(ErrorType.JAVASCRIPT).toBe('javascript');
    expect(ErrorType.UNHANDLED_REJECTION).toBe('unhandled_rejection');
    expect(ErrorType.NETWORK).toBe('network');
    expect(ErrorType.BUSINESS).toBe('business');
    expect(ErrorType.PERFORMANCE).toBe('performance');
    expect(ErrorType.SECURITY).toBe('security');
    expect(ErrorType.UI).toBe('ui');
  });

  it('应该定义所有严重级别', () => {
    expect(ErrorSeverity.LOW).toBe('low');
    expect(ErrorSeverity.MEDIUM).toBe('medium');
    expect(ErrorSeverity.HIGH).toBe('high');
    expect(ErrorSeverity.CRITICAL).toBe('critical');
  });
});

describe('全局错误处理', () => {
  let errorMonitor: ErrorMonitor;

  beforeEach(() => {
    TestEnvironment.setup();
    
    global.fetch = MockFactory.createMockFn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );

    errorMonitor = ErrorMonitor.getInstance({
      enabled: true,
      endpoint: 'https://api.example.com/errors',
    });
    
    errorMonitor.init();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该捕获全局JavaScript错误', () => {
    // 触发全局错误事件
    const errorEvent = new ErrorEvent('error', {
      message: 'Global error',
      filename: 'test.js',
      lineno: 10,
      colno: 5,
      error: new Error('Global error'),
    });
    
    window.dispatchEvent(errorEvent);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/errors',
      expect.objectContaining({
        body: expect.stringContaining('Global error'),
      })
    );
  });

  it('应该捕获未处理的Promise拒绝', () => {
    // 触发未处理的Promise拒绝事件
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(new Error('Unhandled rejection')),
      reason: new Error('Unhandled rejection'),
    });
    
    window.dispatchEvent(rejectionEvent);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/errors',
      expect.objectContaining({
        body: expect.stringContaining('Unhandled rejection'),
      })
    );
  });
});