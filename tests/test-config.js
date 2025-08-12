/**
 * AssetWise 测试配置文件
 * 统一管理测试相关的配置和工具函数
 */

// 测试环境配置
export const TEST_CONFIG = {
  // Supabase测试配置
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://luhqkfsdffkmpwqyjjyh.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHFrZnNkZmZrbXB3cXlqanloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNjUyNjgsImV4cCI6MjA2Mzc0MTI2OH0.AYG6ajoj2T30UKE-EE_PUwnQAAc5Y_tq6tWxXVmAqSA'
  },
  
  // 测试超时配置
  timeouts: {
    default: 10000,
    database: 15000,
    api: 8000,
    ui: 5000
  },
  
  // 测试用户配置
  testUsers: {
    professional: {
      email: 'test.user1@assetwise.test',
      password: 'TestPassword123!',
      username: 'testuser1',
      subscription: 'professional'
    },
    free: {
      email: 'test.user2@assetwise.test',
      password: 'TestPassword123!',
      username: 'testuser2',
      subscription: 'free'
    },
    admin: {
      email: 'test.admin@assetwise.test',
      password: 'AdminPassword123!',
      username: 'testadmin',
      subscription: 'flagship'
    }
  },
  
  // 测试数据配置
  testData: {
    accounts: {
      securities: {
        name: '测试证券账户',
        type: 'securities',
        broker: '测试券商',
        balance: 100000
      },
      crypto: {
        name: '测试加密货币账户',
        type: 'crypto',
        broker: 'Binance',
        balance: 50000
      }
    },
    assets: {
      stock: {
        symbol: '000001.SZ',
        name: '平安银行',
        type: 'stock',
        quantity: 1000,
        average_cost: 12.00
      },
      crypto: {
        symbol: 'BTC',
        name: '比特币',
        type: 'crypto',
        quantity: 0.5,
        average_cost: 45000
      }
    }
  }
};

// 测试工具函数
export const TestUtils = {
  /**
   * 等待指定时间
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 生成随机测试数据
   */
  generateRandomData: {
    email: () => `test.${Date.now()}@assetwise.test`,
    username: () => `testuser_${Date.now()}`,
    accountName: () => `测试账户_${Date.now()}`,
    assetSymbol: () => `TEST${Math.floor(Math.random() * 1000)}`,
    amount: (min = 1000, max = 100000) => Math.floor(Math.random() * (max - min) + min)
  },
  
  /**
   * 验证数据格式
   */
  validators: {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    currency: (amount) => typeof amount === 'number' && amount >= 0,
    date: (dateString) => !isNaN(Date.parse(dateString)),
    uuid: (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  },
  
  /**
   * 清理测试数据
   */
  cleanup: {
    localStorage: () => {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
    },
    indexedDB: async () => {
      if (typeof window !== 'undefined' && window.indexedDB) {
        try {
          const databases = await window.indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.includes('assetwise')) {
              window.indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (error) {
          console.warn('清理IndexedDB失败:', error);
        }
      }
    }
  },
  
  /**
   * Mock数据生成器
   */
  mockData: {
    user: (overrides = {}) => ({
      id: 'test-user-id',
      email: 'test@assetwise.test',
      username: 'testuser',
      full_name: '测试用户',
      subscription_type: 'professional',
      created_at: new Date().toISOString(),
      ...overrides
    }),
    
    account: (userId, overrides = {}) => ({
      id: 'test-account-id',
      user_id: userId,
      name: '测试账户',
      type: 'securities',
      broker: '测试券商',
      currency: 'CNY',
      balance: 100000,
      is_active: true,
      created_at: new Date().toISOString(),
      ...overrides
    }),
    
    asset: (userId, accountId, overrides = {}) => ({
      id: 'test-asset-id',
      user_id: userId,
      account_id: accountId,
      symbol: '000001.SZ',
      name: '平安银行',
      type: 'stock',
      quantity: 1000,
      average_cost: 12.00,
      current_price: 12.50,
      total_value: 12500,
      profit_loss: 500,
      profit_loss_percentage: 4.17,
      created_at: new Date().toISOString(),
      ...overrides
    }),
    
    transaction: (userId, accountId, overrides = {}) => ({
      id: 'test-transaction-id',
      user_id: userId,
      account_id: accountId,
      type: 'buy',
      symbol: '000001.SZ',
      name: '平安银行',
      quantity: 1000,
      price: 12.00,
      amount: 12000,
      fee: 6.00,
      transaction_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      ...overrides
    })
  }
};

// 测试断言工具
export const TestAssertions = {
  /**
   * 断言API响应格式
   */
  assertApiResponse: (response, expectedFields = []) => {
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.error).toBeNull();
    
    if (expectedFields.length > 0 && response.data) {
      expectedFields.forEach(field => {
        expect(response.data).toHaveProperty(field);
      });
    }
  },
  
  /**
   * 断言数据库记录格式
   */
  assertDatabaseRecord: (record, requiredFields = []) => {
    expect(record).toBeDefined();
    expect(record.id).toBeDefined();
    expect(record.created_at).toBeDefined();
    expect(record.updated_at).toBeDefined();
    
    requiredFields.forEach(field => {
      expect(record).toHaveProperty(field);
    });
  },
  
  /**
   * 断言用户权限
   */
  assertUserPermissions: (user, expectedSubscription) => {
    expect(user).toBeDefined();
    expect(user.subscription_type).toBe(expectedSubscription);
  },
  
  /**
   * 断言财务数据精度
   */
  assertFinancialPrecision: (amount, expectedPrecision = 2) => {
    expect(typeof amount).toBe('number');
    expect(amount).toBeGreaterThanOrEqual(0);
    
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(expectedPrecision);
  }
};

// 性能测试工具
export const PerformanceUtils = {
  /**
   * 测量函数执行时间
   */
  measureExecutionTime: async (fn, label = 'Function') => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`${label} 执行时间: ${duration.toFixed(2)}ms`);
    
    return {
      result,
      duration,
      start,
      end
    };
  },
  
  /**
   * 测量内存使用
   */
  measureMemoryUsage: (label = 'Memory') => {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      console.log(`${label} 内存使用:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
      return memory;
    }
    return null;
  },
  
  /**
   * 批量性能测试
   */
  batchPerformanceTest: async (tests, iterations = 10) => {
    const results = {};
    
    for (const [name, testFn] of Object.entries(tests)) {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const { duration } = await PerformanceUtils.measureExecutionTime(testFn, `${name} #${i + 1}`);
        times.push(duration);
      }
      
      results[name] = {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        times
      };
    }
    
    return results;
  }
};

// 安全测试工具
export const SecurityUtils = {
  /**
   * 测试SQL注入防护
   */
  testSqlInjection: {
    payloads: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ],
    
    testInput: (inputValue) => {
      return SecurityUtils.testSqlInjection.payloads.some(payload => 
        inputValue.includes(payload)
      );
    }
  },
  
  /**
   * 测试XSS防护
   */
  testXssProtection: {
    payloads: [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>"
    ],
    
    testInput: (inputValue) => {
      return SecurityUtils.testXssProtection.payloads.some(payload => 
        inputValue.includes(payload)
      );
    }
  },
  
  /**
   * 测试认证绕过
   */
  testAuthBypass: {
    invalidTokens: [
      '',
      'invalid-token',
      'Bearer invalid',
      'null',
      'undefined'
    ],
    
    testToken: (token) => {
      return SecurityUtils.testAuthBypass.invalidTokens.includes(token);
    }
  }
};

export default {
  TEST_CONFIG,
  TestUtils,
  TestAssertions,
  PerformanceUtils,
  SecurityUtils
};