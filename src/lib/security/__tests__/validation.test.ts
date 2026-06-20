/**
 * 数据验证模块单元测试
 */

import {
  BaseValidation,
  UserValidation,
  AssetValidation,
  TransactionValidation,
  ApiValidation,
  ValidationUtils,
} from '@/lib/security/validation';
import { TestDataFactory, TestEnvironment } from '@/lib/testing/test-utils';

describe('BaseValidation', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  describe('email验证', () => {
    it('应该接受有效的邮箱地址', () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@domain.co.uk',
        'test123@test-domain.com',
        'chinese@测试.com',
      ];

      validEmails.forEach(email => {
        const result = BaseValidation.email.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝无效的邮箱地址', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'test@',
        'test..test@domain.com',
        'test@domain',
        '',
        'a'.repeat(100) + '@domain.com', // 过长
      ];

      invalidEmails.forEach(email => {
        const result = BaseValidation.email.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it('应该拒绝一次性邮箱域名', () => {
      const disposableEmails = [
        'test@10minutemail.com',
        'user@tempmail.org',
        'temp@guerrillamail.com',
      ];

      disposableEmails.forEach(email => {
        const result = BaseValidation.email.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('password验证', () => {
    it('应该接受强密码', () => {
      const validPasswords = [
        'StrongPass123!',
        'MySecureP@ssw0rd',
        'Complex!Password123',
      ];

      validPasswords.forEach(password => {
        const result = BaseValidation.password.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝弱密码', () => {
      const invalidPasswords = [
        'short',           // 太短
        'lowercase123!',   // 缺少大写字母
        'UPPERCASE123!',   // 缺少小写字母
        'NoNumbers!',      // 缺少数字
        'NoSpecialChars123', // 缺少特殊字符
        'a'.repeat(130),   // 太长
      ];

      invalidPasswords.forEach(password => {
        const result = BaseValidation.password.safeParse(password);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('username验证', () => {
    it('应该接受有效的用户名', () => {
      const validUsernames = [
        'validuser',
        'user_name',
        'user-name',
        'user123',
        'UserName',
      ];

      validUsernames.forEach(username => {
        const result = BaseValidation.username.safeParse(username);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝无效的用户名', () => {
      const invalidUsernames = [
        'ab',              // 太短
        '123user',         // 以数字开头
        'user@name',       // 包含非法字符
        'admin',           // 禁用的用户名
        'root',            // 禁用的用户名
        'a'.repeat(31),    // 太长
      ];

      invalidUsernames.forEach(username => {
        const result = BaseValidation.username.safeParse(username);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('phone验证', () => {
    it('应该接受有效的中国大陆手机号', () => {
      const validPhones = [
        '13812345678',
        '15987654321',
        '18612345678',
        '19876543210',
      ];

      validPhones.forEach(phone => {
        const result = BaseValidation.phone.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝无效的手机号', () => {
      const invalidPhones = [
        '12812345678',     // 错误的开头
        '1381234567',      // 位数不够
        '138123456789',    // 位数过多
        'abcdefghijk',     // 非数字
        '',                // 空字符串
      ];

      invalidPhones.forEach(phone => {
        const result = BaseValidation.phone.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('amount验证', () => {
    it('应该接受有效的金额', () => {
      const validAmounts = [
        0.01,
        100,
        999999999.99,
        1234.56,
      ];

      validAmounts.forEach(amount => {
        const result = BaseValidation.amount.safeParse(amount);
        expect(result.success).toBe(true);
      });
    });

    it('应该拒绝无效的金额', () => {
      const invalidAmounts = [
        0,                 // 太小
        -100,              // 负数
        1000000000,        // 太大
        123.456,           // 小数位过多
      ];

      invalidAmounts.forEach(amount => {
        const result = BaseValidation.amount.safeParse(amount);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('assetSymbol验证', () => {
    it('应该接受有效的资产代码', () => {
      const validSymbols = [
        'AAPL',
        'BTC-USD',
        'TSLA',
        'SPY',
        'QQQ',
      ];

      validSymbols.forEach(symbol => {
        const result = BaseValidation.assetSymbol.safeParse(symbol);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(symbol.toUpperCase());
        }
      });
    });

    it('应该自动转换为大写', () => {
      const result = BaseValidation.assetSymbol.safeParse('aapl');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('AAPL');
      }
    });

    it('应该拒绝无效的资产代码', () => {
      const invalidSymbols = [
        '',                // 空字符串
        'a'.repeat(21),    // 太长
        'AAPL@',           // 包含非法字符
        '12345',           // 纯数字（虽然技术上可能有效，但规则不允许）
      ];

      invalidSymbols.forEach(symbol => {
        const result = BaseValidation.assetSymbol.safeParse(symbol);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('UserValidation', () => {
  describe('register验证', () => {
    it('应该接受有效的注册数据', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        username: 'testuser',
        fullName: '测试用户',
        acceptTerms: true,
      };

      const result = UserValidation.register.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('应该拒绝密码不匹配的数据', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
        username: 'testuser',
        fullName: '测试用户',
        acceptTerms: true,
      };

      const result = UserValidation.register.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('confirmPassword')
        )).toBe(true);
      }
    });

    it('应该拒绝未同意条款的数据', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        username: 'testuser',
        fullName: '测试用户',
        acceptTerms: false,
      };

      const result = UserValidation.register.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('login验证', () => {
    it('应该接受有效的登录数据', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const result = UserValidation.login.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('应该接受没有rememberMe的数据', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = UserValidation.login.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('AssetValidation', () => {
  describe('create验证', () => {
    it('应该接受有效的资产创建数据', () => {
      const validData = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'stock' as const,
        exchange: 'NASDAQ',
        currentPrice: 150.00,
        description: '苹果公司',
      };

      const result = AssetValidation.create.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('应该拒绝缺少必需字段的数据', () => {
      const invalidData = {
        // 缺少symbol
        name: 'Apple Inc.',
        type: 'stock' as const,
      };

      const result = AssetValidation.create.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('应该拒绝无效的资产类型', () => {
      const invalidData = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'invalid_type',
      };

      const result = AssetValidation.create.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('TransactionValidation', () => {
  describe('create验证', () => {
    it('应该接受有效的交易创建数据', () => {
      const validData = {
        type: 'buy' as const,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        price: 150.00,
        amount: 1500.00,
        fee: 5.00,
        transactionDate: '2024-01-01T10:00:00Z',
        notes: '购买苹果股票',
      };

      const result = TransactionValidation.create.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('应该拒绝负数数量', () => {
      const invalidData = {
        type: 'buy' as const,
        quantity: -10,
        amount: 1500.00,
        transactionDate: '2024-01-01T10:00:00Z',
      };

      const result = TransactionValidation.create.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('ValidationUtils', () => {
  describe('safeParse', () => {
    it('应该返回成功结果对于有效数据', () => {
      const result = ValidationUtils.safeParse(
        BaseValidation.email,
        'test@example.com'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
        expect(result.error).toBeNull();
      }
    });

    it('应该返回错误结果对于无效数据', () => {
      const result = ValidationUtils.safeParse(
        BaseValidation.email,
        'invalid-email'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
        expect(Array.isArray(result.error)).toBe(true);
      }
    });
  });

  describe('sanitizeHtml', () => {
    it('应该转义HTML特殊字符', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      
      const result = ValidationUtils.sanitizeHtml(input);
      expect(result).toBe(expected);
    });

    it('应该处理所有危险字符', () => {
      const input = '<>"\'&/';
      const expected = '&lt;&gt;&quot;&#x27;&amp;&#x2F;';
      
      const result = ValidationUtils.sanitizeHtml(input);
      expect(result).toBe(expected);
    });
  });

  describe('validateFileType', () => {
    it('应该接受允许的文件类型', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const allowedTypes = ['image/jpeg', 'image/png'];
      
      const result = ValidationUtils.validateFileType(file, allowedTypes);
      expect(result).toBe(true);
    });

    it('应该拒绝不允许的文件类型', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const allowedTypes = ['image/jpeg', 'image/png'];
      
      const result = ValidationUtils.validateFileType(file, allowedTypes);
      expect(result).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    it('应该验证有效的图片文件', async () => {
      // 创建一个模拟的图片文件
      const file = new File(['fake-image-content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };
      
      global.Image = jest.fn(() => mockImage) as any;
      global.URL.createObjectURL = jest.fn(() => 'mocked-url');
      
      const validatePromise = ValidationUtils.validateImageFile(file);
      
      // 模拟图片加载成功
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);
      
      const result = await validatePromise;
      expect(result).toBe(true);
    });
  });
});