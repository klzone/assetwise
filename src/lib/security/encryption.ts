/**
 * 数据加密工具
 * 实现敏感数据的加密、解密和安全存储
 */

import CryptoJS from 'crypto-js';

export class DataEncryption {
  private static readonly ALGORITHM = 'AES';
  private static readonly KEY_SIZE = 256;
  private static readonly ITERATION_COUNT = 1000;
  
  /**
   * 生成随机盐值
   */
  static generateSalt(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * 生成密钥
   */
  static generateKey(password: string, salt: string): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATION_COUNT,
    });
  }

  /**
   * 加密数据
   */
  static encrypt(data: string, password: string): string {
    try {
      const salt = this.generateSalt();
      const key = this.generateKey(password, salt);
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // 组合盐值、IV和加密数据
      const result = {
        salt: salt,
        iv: iv.toString(),
        encrypted: encrypted.toString(),
      };

      return btoa(JSON.stringify(result));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * 解密数据
   */
  static decrypt(encryptedData: string, password: string): string {
    try {
      const decoded = JSON.parse(atob(encryptedData));
      const { salt, iv, encrypted } = decoded;
      
      const key = this.generateKey(password, salt);
      const ivWordArray = CryptoJS.enc.Hex.parse(iv);
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * 哈希数据（不可逆）
   */
  static hash(data: string, salt?: string): string {
    const saltToUse = salt || this.generateSalt();
    return CryptoJS.SHA256(data + saltToUse).toString();
  }

  /**
   * 验证哈希
   */
  static verifyHash(data: string, hash: string, salt: string): boolean {
    const computedHash = CryptoJS.SHA256(data + salt).toString();
    return computedHash === hash;
  }

  /**
   * 生成HMAC签名
   */
  static sign(data: string, secret: string): string {
    return CryptoJS.HmacSHA256(data, secret).toString();
  }

  /**
   * 验证HMAC签名
   */
  static verifySignature(data: string, signature: string, secret: string): boolean {
    const computedSignature = this.sign(data, secret);
    return computedSignature === signature;
  }
}

/**
 * 安全存储类
 * 用于在浏览器中安全存储敏感数据
 */
export class SecureStorage {
  private static readonly STORAGE_KEY_PREFIX = '_secure_';
  private static encryptionKey: string | null = null;

  /**
   * 初始化加密密钥
   */
  static async initialize(userSecret?: string): Promise<void> {
    try {
      // 使用用户密钥或生成临时密钥
      if (userSecret) {
        this.encryptionKey = userSecret;
      } else {
        // 尝试从安全区域获取密钥，如果不存在则生成新的
        this.encryptionKey = this.getOrCreateSessionKey();
      }
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw new Error('Secure storage initialization failed');
    }
  }

  /**
   * 获取或创建会话密钥
   */
  private static getOrCreateSessionKey(): string {
    const keyName = '_session_key_';
    let key = sessionStorage.getItem(keyName);
    
    if (!key) {
      key = DataEncryption.generateSalt(64);
      sessionStorage.setItem(keyName, key);
    }
    
    return key;
  }

  /**
   * 安全存储数据
   */
  static setItem(key: string, value: any): void {
    if (!this.encryptionKey) {
      throw new Error('Secure storage not initialized');
    }

    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = DataEncryption.encrypt(serializedValue, this.encryptionKey);
      const storageKey = this.STORAGE_KEY_PREFIX + key;
      
      localStorage.setItem(storageKey, encryptedValue);
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw new Error('Failed to store data securely');
    }
  }

  /**
   * 安全获取数据
   */
  static getItem<T = any>(key: string): T | null {
    if (!this.encryptionKey) {
      throw new Error('Secure storage not initialized');
    }

    try {
      const storageKey = this.STORAGE_KEY_PREFIX + key;
      const encryptedValue = localStorage.getItem(storageKey);
      
      if (!encryptedValue) {
        return null;
      }

      const decryptedValue = DataEncryption.decrypt(encryptedValue, this.encryptionKey);
      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * 删除安全数据
   */
  static removeItem(key: string): void {
    const storageKey = this.STORAGE_KEY_PREFIX + key;
    localStorage.removeItem(storageKey);
  }

  /**
   * 清空所有安全数据
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * 检查密钥是否有效
   */
  static isInitialized(): boolean {
    return this.encryptionKey !== null;
  }
}

/**
 * 客户端数据保护工具
 */
export class ClientDataProtection {
  /**
   * 混淆敏感字符串（用于日志等场景）
   */
  static obfuscate(value: string, visibleChars: number = 4): string {
    if (value.length <= visibleChars) {
      return '*'.repeat(value.length);
    }
    
    const visible = value.slice(0, visibleChars);
    const hidden = '*'.repeat(value.length - visibleChars);
    return visible + hidden;
  }

  /**
   * 清理内存中的敏感数据
   */
  static clearSensitiveData(obj: any): void {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          // 用随机字符覆盖原字符串
          obj[key] = DataEncryption.generateSalt(obj[key].length);
        }
        delete obj[key];
      });
    }
  }

  /**
   * 检测可能的敏感数据
   */
  static containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // 信用卡号
      /\b\d{11,18}\b/, // 身份证号
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // 邮箱
      /\b1[3-9]\d{9}\b/, // 手机号
      /password|passwd|pwd/i, // 密码字段
      /token|secret|key/i, // 令牌/密钥
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  /**
   * 生成数据指纹（用于数据完整性检查）
   */
  static generateFingerprint(data: any): string {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return DataEncryption.hash(serialized);
  }

  /**
   * 验证数据完整性
   */
  static verifyIntegrity(data: any, expectedFingerprint: string): boolean {
    const currentFingerprint = this.generateFingerprint(data);
    return currentFingerprint === expectedFingerprint;
  }
}

/**
 * React Hook for secure data management
 */
export function useSecureData() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await SecureStorage.initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize secure storage:', error);
      }
    };

    initializeStorage();
  }, []);

  const setSecureItem = useCallback((key: string, value: any) => {
    if (!isReady) {
      throw new Error('Secure storage not ready');
    }
    SecureStorage.setItem(key, value);
  }, [isReady]);

  const getSecureItem = useCallback(<T = any>(key: string): T | null => {
    if (!isReady) {
      return null;
    }
    return SecureStorage.getItem<T>(key);
  }, [isReady]);

  const removeSecureItem = useCallback((key: string) => {
    if (!isReady) {
      return;
    }
    SecureStorage.removeItem(key);
  }, [isReady]);

  return {
    isReady,
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearAll: SecureStorage.clear,
  };
}