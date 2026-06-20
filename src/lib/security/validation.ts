/**
 * 数据验证模式
 * 使用 Zod 进行类型安全的数据验证
 */

import { z } from 'zod';

// 基础验证规则
export const BaseValidation = {
  // 邮箱验证
  email: z.string()
    .email('请输入有效的邮箱地址')
    .min(5, '邮箱地址至少需要5个字符')
    .max(100, '邮箱地址不能超过100个字符')
    .refine((email) => {
      // 排除常见的一次性邮箱域名
      const disposableEmailDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com'
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return !disposableEmailDomains.includes(domain);
    }, '不支持一次性邮箱地址'),

  // 密码验证
  password: z.string()
    .min(10, '密码至少需要10个字符')
    .max(128, '密码不能超过128个字符')
    .refine((password) => {
      // 检查字符类型
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const types = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
      return types >= 3;
    }, '密码必须包含至少3种字符类型（大写字母、小写字母、数字、特殊字符）'),

  // 用户名验证
  username: z.string()
    .min(3, '用户名至少需要3个字符')
    .max(30, '用户名不能超过30个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符')
    .refine((username) => {
      // 检查是否以数字开头
      return !/^\d/.test(username);
    }, '用户名不能以数字开头')
    .refine((username) => {
      // 禁用的用户名
      const forbiddenNames = [
        'admin', 'root', 'administrator', 'system', 'user',
        'test', 'guest', 'anonymous', 'null', 'undefined'
      ];
      return !forbiddenNames.includes(username.toLowerCase());
    }, '该用户名不可用'),

  // 手机号验证（中国大陆）
  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),

  // 金额验证
  amount: z.number()
    .min(0.01, '金额必须大于0')
    .max(999999999.99, '金额过大')
    .refine((amount) => {
      // 检查小数位数
      const decimalPlaces = (amount.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    }, '金额最多支持2位小数'),

  // 资产代码验证
  assetSymbol: z.string()
    .min(1, '资产代码不能为空')
    .max(20, '资产代码不能超过20个字符')
    .regex(/^[A-Z0-9.-]+$/, '资产代码只能包含大写字母、数字、点和连字符')
    .transform((symbol) => symbol.toUpperCase()),

  // URL验证
  url: z.string()
    .url('请输入有效的URL')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, '只支持HTTP和HTTPS协议'),

  // 文件大小验证（字节）
  fileSize: z.number()
    .min(1, '文件不能为空')
    .max(10 * 1024 * 1024, '文件大小不能超过10MB'),

  // 日期验证
  date: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, '请输入有效的日期')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const hundredYearsAgo = new Date(now.getFullYear() - 100, 0, 1);
      const tenYearsLater = new Date(now.getFullYear() + 10, 11, 31);
      return parsed >= hundredYearsAgo && parsed <= tenYearsLater;
    }, '日期必须在合理范围内'),
};

// 用户相关验证模式
export const UserValidation = {
  // 用户注册
  register: z.object({
    email: BaseValidation.email,
    password: BaseValidation.password,
    confirmPassword: z.string(),
    username: BaseValidation.username,
    fullName: z.string()
      .min(2, '姓名至少需要2个字符')
      .max(50, '姓名不能超过50个字符')
      .regex(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, '姓名只能包含中文、英文和空格'),
    acceptTerms: z.boolean().refine(val => val === true, '必须同意服务条款'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  }),

  // 用户登录
  login: z.object({
    email: BaseValidation.email,
    password: z.string().min(1, '请输入密码'),
    rememberMe: z.boolean().optional(),
  }),

  // 密码重置
  resetPassword: z.object({
    token: z.string().min(1, '重置令牌不能为空'),
    password: BaseValidation.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  }),

  // 个人资料更新
  updateProfile: z.object({
    fullName: z.string()
      .min(2, '姓名至少需要2个字符')
      .max(50, '姓名不能超过50个字符')
      .optional(),
    phone: BaseValidation.phone.optional(),
    bio: z.string()
      .max(500, '个人简介不能超过500个字符')
      .optional(),
    location: z.string()
      .max(100, '地址不能超过100个字符')
      .optional(),
  }),
};

// 资产相关验证模式
export const AssetValidation = {
  // 创建资产
  create: z.object({
    symbol: BaseValidation.assetSymbol,
    name: z.string()
      .min(1, '资产名称不能为空')
      .max(100, '资产名称不能超过100个字符'),
    type: z.enum(['stock', 'crypto', 'forex', 'commodity', 'bond', 'fund', 'real_estate', 'option', 'futures']),
    exchange: z.string()
      .max(50, '交易所名称不能超过50个字符')
      .optional(),
    currentPrice: BaseValidation.amount.optional(),
    description: z.string()
      .max(1000, '描述不能超过1000个字符')
      .optional(),
  }),

  // 更新资产
  update: z.object({
    id: z.string().uuid('无效的资产ID'),
    name: z.string()
      .min(1, '资产名称不能为空')
      .max(100, '资产名称不能超过100个字符')
      .optional(),
    currentPrice: BaseValidation.amount.optional(),
    description: z.string()
      .max(1000, '描述不能超过1000个字符')
      .optional(),
  }),
};

// 交易相关验证模式
export const TransactionValidation = {
  // 创建交易
  create: z.object({
    type: z.enum(['buy', 'sell', 'dividend', 'deposit', 'withdraw']),
    symbol: BaseValidation.assetSymbol.optional(),
    name: z.string()
      .min(1, '交易名称不能为空')
      .max(100, '交易名称不能超过100个字符')
      .optional(),
    quantity: z.number()
      .min(0.000001, '数量必须大于0')
      .max(999999999, '数量过大')
      .optional(),
    price: BaseValidation.amount.optional(),
    amount: BaseValidation.amount,
    fee: z.number()
      .min(0, '手续费不能为负数')
      .max(999999, '手续费过大')
      .optional(),
    tax: z.number()
      .min(0, '税费不能为负数')
      .max(999999, '税费过大')
      .optional(),
    transactionDate: BaseValidation.date,
    notes: z.string()
      .max(500, '备注不能超过500个字符')
      .optional(),
  }),
};

// 通用API响应验证
export const ApiValidation = {
  // 分页参数
  pagination: z.object({
    page: z.number().int().min(1, '页码必须从1开始'),
    limit: z.number().int().min(1).max(100, '每页最多显示100条记录'),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),

  // 搜索参数
  search: z.object({
    query: z.string()
      .min(1, '搜索关键词不能为空')
      .max(100, '搜索关键词不能超过100个字符'),
    type: z.string().optional(),
    filters: z.record(z.any()).optional(),
  }),
};

// 验证工具函数
export const ValidationUtils = {
  /**
   * 安全地解析和验证数据
   */
  safeParse: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    try {
      return {
        success: true as const,
        data: schema.parse(data),
        error: null,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false as const,
          data: null,
          error: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        };
      }
      throw error;
    }
  },

  /**
   * 清理HTML输入，防止XSS攻击
   */
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * 验证文件类型
   */
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  /**
   * 验证图片文件
   */
  validateImageFile: (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  },
};