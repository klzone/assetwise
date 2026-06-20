/**
 * 密码策略模块单元测试
 */

import { PasswordPolicy } from '@/lib/security/password-policy';
import { TestDataFactory, TestEnvironment } from '@/lib/testing/test-utils';

describe('PasswordPolicy', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  describe('validatePassword', () => {
    it('应该拒绝过短的密码', () => {
      const result = PasswordPolicy.validatePassword('short');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('密码长度至少需要 10 位');
    });

    it('应该拒绝常见弱密码', () => {
      const result = PasswordPolicy.validatePassword('password123');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('密码过于简单');
    });

    it('应该拒绝字符类型不足的密码', () => {
      const result = PasswordPolicy.validatePassword('lowercaseonly');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.feedback).toContain('密码必须包含至少3种字符类型');
    });

    it('应该接受强密码', () => {
      const result = PasswordPolicy.validatePassword('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
      expect(result.feedback).toContain('密码强度良好');
    });

    it('应该为超长复杂密码给出最高分', () => {
      const result = PasswordPolicy.validatePassword('VeryStrongPassword123!@#$%^&*()_+');
      
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.isValid).toBe(true);
    });

    it('应该检测连续字符', () => {
      const result = PasswordPolicy.validatePassword('Password123456!');
      
      expect(result.feedback).toContain('密码不应包含连续的字符序列');
      expect(result.score).toBeLessThan(4);
    });

    it('应该检测重复字符', () => {
      const result = PasswordPolicy.validatePassword('Passworddd123!');
      
      expect(result.feedback).toContain('密码不应包含过多重复字符');
      expect(result.score).toBeLessThan(4);
    });

    it('应该检查唯一字符数量', () => {
      const result = PasswordPolicy.validatePassword('AAAAAAAAAA');
      
      expect(result.feedback).toContain('密码应包含至少 6 个不同字符');
      expect(result.isValid).toBe(false);
    });
  });

  describe('generatePasswordSuggestion', () => {
    it('应该生成符合要求的密码', () => {
      const password = PasswordPolicy.generatePasswordSuggestion();
      
      expect(password).toHaveLength(12);
      
      // 验证生成的密码符合策略
      const validation = PasswordPolicy.validatePassword(password);
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(3);
    });

    it('应该每次生成不同的密码', () => {
      const password1 = PasswordPolicy.generatePasswordSuggestion();
      const password2 = PasswordPolicy.generatePasswordSuggestion();
      
      expect(password1).not.toBe(password2);
    });

    it('生成的密码应该包含所有字符类型', () => {
      const password = PasswordPolicy.generatePasswordSuggestion();
      
      expect(password).toMatch(/[a-z]/); // 小写字母
      expect(password).toMatch(/[A-Z]/); // 大写字母
      expect(password).toMatch(/[0-9]/); // 数字
      expect(password).toMatch(/[!@#$%^&*()]/); // 特殊字符
    });
  });

  describe('getStrengthColor', () => {
    it('应该为不同强度返回正确的颜色类', () => {
      expect(PasswordPolicy.getStrengthColor(0)).toBe('text-red-500');
      expect(PasswordPolicy.getStrengthColor(1)).toBe('text-red-400');
      expect(PasswordPolicy.getStrengthColor(2)).toBe('text-yellow-500');
      expect(PasswordPolicy.getStrengthColor(3)).toBe('text-blue-500');
      expect(PasswordPolicy.getStrengthColor(4)).toBe('text-green-500');
    });

    it('应该为无效分数返回默认颜色', () => {
      expect(PasswordPolicy.getStrengthColor(-1)).toBe('text-gray-500');
      expect(PasswordPolicy.getStrengthColor(5)).toBe('text-gray-500');
    });
  });

  describe('getStrengthText', () => {
    it('应该为不同强度返回正确的文本', () => {
      expect(PasswordPolicy.getStrengthText(0)).toBe('非常弱');
      expect(PasswordPolicy.getStrengthText(1)).toBe('弱');
      expect(PasswordPolicy.getStrengthText(2)).toBe('一般');
      expect(PasswordPolicy.getStrengthText(3)).toBe('强');
      expect(PasswordPolicy.getStrengthText(4)).toBe('非常强');
    });

    it('应该为无效分数返回默认文本', () => {
      expect(PasswordPolicy.getStrengthText(-1)).toBe('未知');
      expect(PasswordPolicy.getStrengthText(5)).toBe('未知');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空字符串', () => {
      const result = PasswordPolicy.validatePassword('');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
    });

    it('应该处理只有空格的字符串', () => {
      const result = PasswordPolicy.validatePassword('          ');
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
    });

    it('应该处理极长的密码', () => {
      const longPassword = 'A'.repeat(200) + 'b1!';
      const result = PasswordPolicy.validatePassword(longPassword);
      
      // 应该仍然能够处理，不会崩溃
      expect(typeof result.score).toBe('number');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('应该处理Unicode字符', () => {
      const unicodePassword = 'Password123!你好世界';
      const result = PasswordPolicy.validatePassword(unicodePassword);
      
      // 应该能正确处理Unicode字符
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成密码验证', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        PasswordPolicy.validatePassword('TestPassword123!');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 1000次验证应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('应该在合理时间内生成密码建议', () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        PasswordPolicy.generatePasswordSuggestion();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 100次生成应该在50ms内完成
      expect(duration).toBeLessThan(50);
    });
  });

  describe('安全性测试', () => {
    it('生成的密码应该具有足够的熵', () => {
      const passwords = new Set();
      
      // 生成100个密码，应该都不相同
      for (let i = 0; i < 100; i++) {
        const password = PasswordPolicy.generatePasswordSuggestion();
        passwords.add(password);
      }
      
      expect(passwords.size).toBe(100);
    });

    it('应该正确识别常见攻击模式', () => {
      const attackPatterns = [
        'qwertyuiop123!',  // 键盘模式
        'abcdefghij123!',  // 字母序列
        '1234567890aB!',   // 数字序列
        'PasswordPass1!',  // 重复模式
      ];

      attackPatterns.forEach(pattern => {
        const result = PasswordPolicy.validatePassword(pattern);
        expect(result.score).toBeLessThan(3); // 应该被识别为弱密码
      });
    });
  });
});