import CryptoJS from 'crypto-js'

/**
 * 生成数据校验和
 * @param data 要计算校验和的数据
 * @returns MD5校验和
 */
export function generateChecksum(data: string): string {
  return CryptoJS.MD5(data).toString()
}

/**
 * 生成设备ID
 * @returns 唯一的设备ID
 */
export function generateDeviceId(): string {
  // 尝试从localStorage获取已存在的设备ID
  const existingId = localStorage.getItem('device_id')
  if (existingId) {
    return existingId
  }

  // 生成新的设备ID
  const deviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timestamp: Date.now(),
    random: Math.random()
  }

  const deviceString = JSON.stringify(deviceInfo)
  const deviceId = CryptoJS.SHA256(deviceString).toString().substring(0, 16)
  
  // 保存到localStorage
  localStorage.setItem('device_id', deviceId)
  
  return deviceId
}

/**
 * 验证数据完整性
 * @param data 数据
 * @param checksum 校验和
 * @returns 是否验证通过
 */
export function verifyChecksum(data: string, checksum: string): boolean {
  return generateChecksum(data) === checksum
}

/**
 * 生成随机字符串
 * @param length 长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 简单的数据加密（用于本地存储）
 * @param data 要加密的数据
 * @param key 加密密钥
 * @returns 加密后的数据
 */
export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString()
}

/**
 * 简单的数据解密（用于本地存储）
 * @param encryptedData 加密的数据
 * @param key 解密密钥
 * @returns 解密后的数据
 */
export function decryptData(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}