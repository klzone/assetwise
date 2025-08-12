/**
 * 数据加密服务
 * 提供本地数据的加密和解密功能
 */

import CryptoJS from 'crypto-js';

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  salt: string;
  iv: string;
  timestamp: number;
}

class EncryptionService {
  private config: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256,
    iterations: 10000
  };

  /**
   * 生成密钥
   */
  private generateKey(password: string, salt: string): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.config.keySize / 32,
      iterations: this.config.iterations
    });
  }

  /**
   * 生成随机盐值
   */
  private generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  /**
   * 生成随机初始化向量
   */
  private generateIV(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  /**
   * 加密数据
   */
  encrypt(data: any, password: string): EncryptedData {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = this.generateKey(password, salt);

      // 将数据转换为JSON字符串
      const jsonData = JSON.stringify(data);

      // 使用AES加密
      const encrypted = CryptoJS.AES.encrypt(jsonData, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        data: encrypted.toString(),
        salt,
        iv,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 解密数据
   */
  decrypt<T = any>(encryptedData: EncryptedData, password: string): T {
    try {
      const { data, salt, iv } = encryptedData;
      const key = this.generateKey(password, salt);

      // 解密数据
      const decrypted = CryptoJS.AES.decrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // 转换为UTF-8字符串
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('解密失败：密码可能不正确');
      }

      // 解析JSON
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('数据解密失败：密码可能不正确');
    }
  }

  /**
   * 验证密码
   */
  verifyPassword(encryptedData: EncryptedData, password: string): boolean {
    try {
      this.decrypt(encryptedData, password);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成密码哈希（用于验证）
   */
  hashPassword(password: string): string {
    const salt = this.generateSalt();
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: this.config.keySize / 32,
      iterations: this.config.iterations
    });
    return `${salt}:${hash.toString()}`;
  }

  /**
   * 验证密码哈希
   */
  verifyPasswordHash(password: string, hash: string): boolean {
    try {
      const [salt, storedHash] = hash.split(':');
      const computedHash = CryptoJS.PBKDF2(password, salt, {
        keySize: this.config.keySize / 32,
        iterations: this.config.iterations
      });
      return computedHash.toString() === storedHash;
    } catch {
      return false;
    }
  }

  /**
   * 加密敏感字段
   */
  encryptSensitiveFields(data: any, sensitiveFields: string[], password: string): any {
    const result = { ...data };
    
    sensitiveFields.forEach(field => {
      if (result[field] !== undefined) {
        result[field] = this.encrypt(result[field], password);
      }
    });

    return result;
  }

  /**
   * 解密敏感字段
   */
  decryptSensitiveFields(data: any, sensitiveFields: string[], password: string): any {
    const result = { ...data };
    
    sensitiveFields.forEach(field => {
      if (result[field] && typeof result[field] === 'object' && result[field].data) {
        try {
          result[field] = this.decrypt(result[field], password);
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error);
          // 保持原始加密数据
        }
      }
    });

    return result;
  }

  /**
   * 生成安全的随机密码
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * 检查密码强度
   */
  checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('密码长度至少需要8位');
    }

    // 包含大写字母
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含大写字母');
    }

    // 包含小写字母
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含小写字母');
    }

    // 包含数字
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含数字');
    }

    // 包含特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('建议包含特殊字符');
    }

    // 长度奖励
    if (password.length >= 12) {
      score += 1;
    }

    const isStrong = score >= 4;

    return {
      score,
      feedback,
      isStrong
    };
  }
}

export const encryptionService = new EncryptionService();
