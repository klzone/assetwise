/**
 * 密码策略和验证
 * 实现强密码策略，包括长度、复杂度和常见密码检查
 */

// 常见弱密码列表（简化版）
const COMMON_WEAK_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345',
  'qwerty', 'abc123', 'password123', 'admin', 'root',
  '111111', '123123', 'welcome', 'login', 'pass'
];

export interface PasswordStrength {
  score: number; // 0-4 (0: 非常弱, 4: 非常强)
  feedback: string[];
  isValid: boolean;
}

export class PasswordPolicy {
  static readonly MIN_LENGTH = 10;
  static readonly MIN_UNIQUE_CHARS = 6;
  static readonly REQUIRED_CHAR_TYPES = 3; // 至少需要3种字符类型

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // 基本长度检查
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`密码长度至少需要 ${this.MIN_LENGTH} 位`);
      return { score: 0, feedback, isValid: false };
    }

    // 检查是否为常见弱密码
    if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
      feedback.push('密码过于简单，请选择更复杂的密码');
      return { score: 0, feedback, isValid: false };
    }

    // 字符类型检查
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const charTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars]
      .filter(Boolean).length;

    if (charTypes < this.REQUIRED_CHAR_TYPES) {
      feedback.push('密码必须包含至少3种字符类型（大写字母、小写字母、数字、特殊字符）');
      score = 1;
    } else {
      score = 2;
    }

    // 长度加分
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // 复杂度检查
    const uniqueChars = new Set(password).size;
    if (uniqueChars < this.MIN_UNIQUE_CHARS) {
      feedback.push(`密码应包含至少 ${this.MIN_UNIQUE_CHARS} 个不同字符`);
      score = Math.max(score - 1, 1);
    }

    // 连续字符检查
    if (this.hasSequentialChars(password)) {
      feedback.push('密码不应包含连续的字符序列');
      score = Math.max(score - 1, 1);
    }

    // 重复字符检查
    if (this.hasRepeatingChars(password)) {
      feedback.push('密码不应包含过多重复字符');
      score = Math.max(score - 1, 1);
    }

    // 生成反馈信息
    if (score >= 3 && feedback.length === 0) {
      feedback.push('密码强度良好');
    }

    return {
      score: Math.min(score, 4),
      feedback,
      isValid: score >= 2 && feedback.length === 1 // 只有正面反馈才算有效
    };
  }

  /**
   * 检查连续字符
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = ['123456789', 'abcdefghij', 'qwertyuiop'];
    return sequences.some(seq => 
      password.toLowerCase().includes(seq) || 
      password.toLowerCase().includes(seq.split('').reverse().join(''))
    );
  }

  /**
   * 检查重复字符
   */
  private static hasRepeatingChars(password: string): boolean {
    // 检查是否有超过2个连续相同字符
    for (let i = 0; i < password.length - 2; i++) {
      if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
        return true;
      }
    }
    return false;
  }

  /**
   * 生成强密码建议
   */
  static generatePasswordSuggestion(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()';
    
    let password = '';
    
    // 确保每种字符类型都有
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(special);
    
    // 添加更多随机字符
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 4; i < 12; i++) {
      password += this.getRandomChar(allChars);
    }
    
    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  private static getRandomChar(chars: string): string {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  /**
   * 密码强度颜色映射
   */
  static getStrengthColor(score: number): string {
    switch (score) {
      case 0: return 'text-red-500';
      case 1: return 'text-red-400';
      case 2: return 'text-yellow-500';
      case 3: return 'text-blue-500';
      case 4: return 'text-green-500';
      default: return 'text-gray-500';
    }
  }

  /**
   * 密码强度文本
   */
  static getStrengthText(score: number): string {
    switch (score) {
      case 0: return '非常弱';
      case 1: return '弱';
      case 2: return '一般';
      case 3: return '强';
      case 4: return '非常强';
      default: return '未知';
    }
  }
}