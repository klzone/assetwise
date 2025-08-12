/**
 * 安全存储服务
 * 提供加密的本地数据存储功能
 */

import { encryptionService, EncryptedData } from './encryption.service';

export interface SecureStorageConfig {
  keyPrefix: string;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

export interface StorageMetadata {
  version: string;
  encrypted: boolean;
  compressed: boolean;
  timestamp: number;
  checksum?: string;
}

class SecureStorageService {
  private config: SecureStorageConfig = {
    keyPrefix: 'assetwise_secure_',
    encryptionEnabled: true,
    compressionEnabled: false
  };

  private password: string | null = null;
  private isInitialized = false;

  /**
   * 初始化安全存储
   */
  async initialize(password?: string): Promise<void> {
    if (password) {
      this.password = password;
    }
    this.isInitialized = true;
  }

  /**
   * 设置加密密码
   */
  setPassword(password: string): void {
    this.password = password;
  }

  /**
   * 检查是否已初始化
   */
  private checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SecureStorageService not initialized');
    }
  }

  /**
   * 生成存储键
   */
  private generateKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * 计算数据校验和
   */
  private calculateChecksum(data: string): string {
    // 简单的校验和计算，实际项目中可以使用更复杂的算法
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 压缩数据（简化实现）
   */
  private compressData(data: string): string {
    // 这里可以实现真正的压缩算法，如LZ77等
    // 目前只是简单的返回原数据
    return data;
  }

  /**
   * 解压数据（简化实现）
   */
  private decompressData(data: string): string {
    // 对应压缩算法的解压实现
    return data;
  }

  /**
   * 存储数据
   */
  async setItem<T>(key: string, value: T, options?: { encrypt?: boolean }): Promise<void> {
    this.checkInitialized();

    try {
      const storageKey = this.generateKey(key);
      const shouldEncrypt = options?.encrypt !== false && this.config.encryptionEnabled && this.password;

      // 序列化数据
      let serializedData = JSON.stringify(value);

      // 压缩数据
      if (this.config.compressionEnabled) {
        serializedData = this.compressData(serializedData);
      }

      // 创建元数据
      const metadata: StorageMetadata = {
        version: '1.0',
        encrypted: shouldEncrypt,
        compressed: this.config.compressionEnabled,
        timestamp: Date.now(),
        checksum: this.calculateChecksum(serializedData)
      };

      let finalData: any;

      if (shouldEncrypt && this.password) {
        // 加密数据
        const encryptedData = encryptionService.encrypt(serializedData, this.password);
        finalData = {
          metadata,
          data: encryptedData
        };
      } else {
        // 不加密
        finalData = {
          metadata,
          data: serializedData
        };
      }

      // 存储到localStorage
      localStorage.setItem(storageKey, JSON.stringify(finalData));
    } catch (error) {
      console.error('Failed to store data:', error);
      throw new Error(`存储数据失败: ${error.message}`);
    }
  }

  /**
   * 获取数据
   */
  async getItem<T>(key: string): Promise<T | null> {
    this.checkInitialized();

    try {
      const storageKey = this.generateKey(key);
      const storedData = localStorage.getItem(storageKey);

      if (!storedData) {
        return null;
      }

      const parsedData = JSON.parse(storedData);
      const { metadata, data } = parsedData;

      let finalData: string;

      if (metadata.encrypted) {
        if (!this.password) {
          throw new Error('需要密码才能解密数据');
        }
        // 解密数据
        finalData = encryptionService.decrypt(data as EncryptedData, this.password);
      } else {
        finalData = data as string;
      }

      // 验证校验和
      if (metadata.checksum && this.calculateChecksum(finalData) !== metadata.checksum) {
        throw new Error('数据校验失败，可能已被篡改');
      }

      // 解压数据
      if (metadata.compressed) {
        finalData = this.decompressData(finalData);
      }

      // 反序列化数据
      return JSON.parse(finalData);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      throw new Error(`获取数据失败: ${error.message}`);
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    this.checkInitialized();

    try {
      const storageKey = this.generateKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove data:', error);
      throw new Error(`删除数据失败: ${error.message}`);
    }
  }

  /**
   * 检查数据是否存在
   */
  async hasItem(key: string): Promise<boolean> {
    this.checkInitialized();

    try {
      const storageKey = this.generateKey(key);
      return localStorage.getItem(storageKey) !== null;
    } catch (error) {
      console.error('Failed to check data existence:', error);
      return false;
    }
  }

  /**
   * 获取所有键
   */
  async getAllKeys(): Promise<string[]> {
    this.checkInitialized();

    try {
      const keys: string[] = [];
      const prefix = this.config.keyPrefix;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.checkInitialized();

    try {
      const keys = await this.getAllKeys();
      for (const key of keys) {
        await this.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error(`清空数据失败: ${error.message}`);
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    totalSize: number;
    encryptedKeys: number;
    unencryptedKeys: number;
  }> {
    this.checkInitialized();

    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;
      let encryptedKeys = 0;
      let unencryptedKeys = 0;

      for (const key of keys) {
        const storageKey = this.generateKey(key);
        const data = localStorage.getItem(storageKey);
        if (data) {
          totalSize += data.length;
          const parsedData = JSON.parse(data);
          if (parsedData.metadata?.encrypted) {
            encryptedKeys++;
          } else {
            unencryptedKeys++;
          }
        }
      }

      return {
        totalKeys: keys.length,
        totalSize,
        encryptedKeys,
        unencryptedKeys
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalKeys: 0,
        totalSize: 0,
        encryptedKeys: 0,
        unencryptedKeys: 0
      };
    }
  }

  /**
   * 验证密码
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const keys = await this.getAllKeys();
      
      // 找到第一个加密的数据项进行验证
      for (const key of keys) {
        const storageKey = this.generateKey(key);
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.metadata?.encrypted) {
            return encryptionService.verifyPassword(parsedData.data, password);
          }
        }
      }
      
      // 如果没有加密数据，认为密码正确
      return true;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * 更改加密密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    this.checkInitialized();

    if (!await this.verifyPassword(oldPassword)) {
      throw new Error('原密码不正确');
    }

    try {
      const keys = await this.getAllKeys();
      
      // 临时存储解密的数据
      const tempData: { [key: string]: any } = {};
      
      // 使用旧密码解密所有数据
      this.setPassword(oldPassword);
      for (const key of keys) {
        tempData[key] = await this.getItem(key);
      }
      
      // 使用新密码重新加密并存储
      this.setPassword(newPassword);
      for (const key of keys) {
        await this.setItem(key, tempData[key]);
      }
      
    } catch (error) {
      console.error('Failed to change password:', error);
      throw new Error(`更改密码失败: ${error.message}`);
    }
  }
}

export const secureStorageService = new SecureStorageService();
