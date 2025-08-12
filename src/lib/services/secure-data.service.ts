import CryptoJS from 'crypto-js';

/**
 * 安全数据服务 - 处理敏感数据的加密存储
 */
export class SecureDataService {
  private static readonly STORAGE_PREFIX = 'assetwise_secure_';
  private static readonly ENCRYPTION_KEY_STORAGE = 'assetwise_encryption_key';
  
  /**
   * 生成用户专用的加密密钥
   */
  private static generateUserKey(userId: string, userPassword: string): string {
    // 使用用户ID和密码生成唯一的加密密钥
    return CryptoJS.PBKDF2(userPassword, userId, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
  }

  /**
   * 加密数据
   */
  private static encryptData(data: any, key: string): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, key).toString();
  }

  /**
   * 解密数据
   */
  private static decryptData(encryptedData: string, key: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('数据解密失败:', error);
      return null;
    }
  }

  /**
   * 安全存储敏感数据
   */
  static setSecureItem(key: string, value: any, userId: string, userPassword: string): void {
    try {
      const encryptionKey = this.generateUserKey(userId, userPassword);
      const encryptedData = this.encryptData(value, encryptionKey);
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      
      localStorage.setItem(storageKey, encryptedData);
      
      // 存储数据完整性校验
      const checksum = CryptoJS.SHA256(encryptedData).toString();
      localStorage.setItem(`${storageKey}_checksum`, checksum);
      
    } catch (error) {
      console.error('安全存储失败:', error);
      throw new Error('数据加密存储失败');
    }
  }

  /**
   * 安全获取敏感数据
   */
  static getSecureItem(key: string, userId: string, userPassword: string): any {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      const encryptedData = localStorage.getItem(storageKey);
      const storedChecksum = localStorage.getItem(`${storageKey}_checksum`);
      
      if (!encryptedData || !storedChecksum) {
        return null;
      }

      // 验证数据完整性
      const currentChecksum = CryptoJS.SHA256(encryptedData).toString();
      if (currentChecksum !== storedChecksum) {
        console.error('数据完整性校验失败');
        this.removeSecureItem(key);
        return null;
      }

      const encryptionKey = this.generateUserKey(userId, userPassword);
      return this.decryptData(encryptedData, encryptionKey);
      
    } catch (error) {
      console.error('安全获取数据失败:', error);
      return null;
    }
  }

  /**
   * 删除安全存储的数据
   */
  static removeSecureItem(key: string): void {
    const storageKey = `${this.STORAGE_PREFIX}${key}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_checksum`);
  }

  /**
   * 清理所有安全存储的数据
   */
  static clearAllSecureData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * 验证用户密码（用于解密数据）
   */
  static async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    try {
      // 尝试解密一个测试数据来验证密码
      const testKey = `${userId}_test`;
      const testData = this.getSecureItem(testKey, userId, password);
      
      // 如果没有测试数据，创建一个
      if (testData === null) {
        this.setSecureItem(testKey, { verified: true, timestamp: Date.now() }, userId, password);
        return true;
      }
      
      return testData && testData.verified === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 更新用户密码时重新加密所有数据
   */
  static async updateUserPassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const keys = Object.keys(localStorage);
      const userDataKeys = keys.filter(key => 
        key.startsWith(this.STORAGE_PREFIX) && 
        !key.endsWith('_checksum')
      );

      // 使用旧密码解密所有数据
      const decryptedData: { [key: string]: any } = {};
      for (const storageKey of userDataKeys) {
        const dataKey = storageKey.replace(this.STORAGE_PREFIX, '');
        const data = this.getSecureItem(dataKey, userId, oldPassword);
        if (data !== null) {
          decryptedData[dataKey] = data;
        }
      }

      // 使用新密码重新加密所有数据
      for (const [dataKey, data] of Object.entries(decryptedData)) {
        this.setSecureItem(dataKey, data, userId, newPassword);
      }

      return true;
    } catch (error) {
      console.error('密码更新失败:', error);
      return false;
    }
  }
}

/**
 * 输入验证和清理服务
 */
export class InputSanitizationService {
  /**
   * HTML转义，防止XSS攻击
   */
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 清理和验证邮箱地址
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * 验证密码强度
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    // 检查常见弱密码
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('不能使用常见弱密码');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 清理用户输入的文本
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // 移除可能的HTML标签
      .substring(0, 1000); // 限制长度
  }

  /**
   * 验证数字输入
   */
  static validateNumber(value: any, min?: number, max?: number): { isValid: boolean; value: number | null } {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return { isValid: false, value: null };
    }
    
    if (min !== undefined && num < min) {
      return { isValid: false, value: null };
    }
    
    if (max !== undefined && num > max) {
      return { isValid: false, value: null };
    }
    
    return { isValid: true, value: num };
  }
}

/**
 * API安全服务
 */
export class ApiSecurityService {
  private static readonly MAX_REQUESTS_PER_MINUTE = 60;
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * 简单的速率限制
   */
  static checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      // 重置计数器
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + 60000 // 1分钟后重置
      });
      return true;
    }

    if (userRequests.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false; // 超过限制
    }

    userRequests.count++;
    return true;
  }

  /**
   * 生成CSRF令牌
   */
  static generateCSRFToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  /**
   * 验证CSRF令牌
   */
  static validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken;
  }

  /**
   * 安全的API请求头
   */
  static getSecureHeaders(csrfToken?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }
}