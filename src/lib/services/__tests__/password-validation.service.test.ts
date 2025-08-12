import { PasswordValidationService } from '../password-validation.service';

/**
 * 密码验证服务单元测试
 */
describe('PasswordValidationService', () => {
  describe('validatePassword', () => {
    it('应该拒绝短密码', () => {
      const result = PasswordValidationService.validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码长度至少为8个字符');
    });

    it('应该拒绝没有大写字母的密码', () => {
      const result = PasswordValidationService.validatePassword('12345678a!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码必须包含至少1个大写字母');
    });

    it('应该拒绝没有小写字母的密码', () => {
      const result = PasswordValidationService.validatePassword('12345678A!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码必须包含至少1个小写字母');
    });

    it('应该拒绝没有数字的密码', () => {
      const result = PasswordValidationService.validatePassword('AbcdEfgh!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码必须包含至少1个数字');
    });

    it('应该拒绝没有特殊字符的密码', () => {
      const result = PasswordValidationService.validatePassword('Abcd1234');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('密码必须包含至少1个特殊字符');
    });

    it('应该接受符合所有规则的强密码', () => {
      const result = PasswordValidationService.validatePassword('Abcd1234!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该为强密码提供高分数', () => {
      const result = PasswordValidationService.validatePassword('C0mpl3x!P@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    it('应该为弱密码提供低分数', () => {
      // 虽然这个密码不符合验证规则，但我们仍然可以测试它的分数计算
      const result = PasswordValidationService.validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(50);
    });
  });
});