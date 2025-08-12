/**
 * AssetWise 数据验证工具
 * 提供表单验证、数据校验和业务规则验证
 */

import { z } from 'zod';
import {
  AssetType,
  TransactionType,
  CurrencyCode,
  PlanStatus,
  ReviewType,
  CreateAssetForm,
  CreateTransactionForm,
  CreatePlanForm,
  CreateReviewForm
} from '../types/core.types';

// ============= 基础验证规则 =============

/** 货币金额验证 */
export const currencyAmountSchema = z.number()
  .min(0, '金额不能为负数')
  .max(999999999999, '金额过大')
  .refine((val) => Number.isFinite(val), '请输入有效的数字');

/** 百分比验证 */
export const percentageSchema = z.number()
  .min(-100, '百分比不能小于-100%')
  .max(1000, '百分比不能大于1000%');

/** 数量验证 */
export const quantitySchema = z.number()
  .min(0, '数量不能为负数')
  .max(999999999, '数量过大');

/** 价格验证 */
export const priceSchema = z.number()
  .min(0.0001, '价格必须大于0')
  .max(999999999, '价格过大');

/** 日期验证 */
export const dateSchema = z.union([
  z.string().datetime('请输入有效的日期时间格式'),
  z.date()
]).transform((val: string | Date) => typeof val === 'string' ? new Date(val) : val);

/** 标签验证 */
export const tagsSchema = z.array(z.string().min(1).max(20))
  .max(10, '标签数量不能超过10个')
  .optional();

/** 资产类型验证 */
export const assetTypeSchema = z.enum([
  'stock', 'fund', 'bond', 'crypto', 'commodity', 'real_estate', 'cash', 'other'
] as const);

/** 交易类型验证 */
export const transactionTypeSchema = z.enum([
  'buy', 'sell', 'dividend', 'interest', 'fee', 'transfer_in', 'transfer_out', 'split', 'merge'
] as const);

/** 货币代码验证 */
export const currencyCodeSchema = z.enum(['CNY', 'USD', 'EUR', 'JPY', 'HKD', 'GBP'] as const);

// ============= 表单验证模式 =============

/** 创建资产表单验证 */
export const createAssetFormSchema = z.object({
  name: z.string()
    .min(1, '资产名称不能为空')
    .max(100, '资产名称不能超过100个字符')
    .trim(),
  
  symbol: z.string()
    .min(1, '资产代码不能为空')
    .max(20, '资产代码不能超过20个字符')
    .regex(/^[A-Z0-9._-]+$/i, '资产代码只能包含字母、数字、点、下划线和连字符')
    .trim()
    .toUpperCase(),
  
  type: assetTypeSchema,
  
  market: z.string()
    .max(50, '市场名称不能超过50个字符')
    .optional()
    .transform((val: string | undefined) => val?.trim() || undefined),
  
  currency: currencyCodeSchema,
  
  quantity: quantitySchema,
  
  average_cost: priceSchema,
  
  description: z.string()
    .max(500, '描述不能超过500个字符')
    .optional()
    .transform((val: string | undefined) => val?.trim() || undefined),
  
  tags: tagsSchema
}).refine((data: any) => {
  // 业务规则验证：现金类资产的数量应该等于成本
  if (data.type === 'cash') {
    return Math.abs(data.quantity - data.average_cost) < 0.01;
  }
  return true;
}, {
  message: '现金类资产的数量应该等于金额',
  path: ['quantity']
});

/** 创建交易表单验证 */
export const createTransactionFormSchema = z.object({
  asset_id: z.union([z.string(), z.number()])
    .refine(val => val !== '' && val !== 0, '请选择资产'),
  
  type: transactionTypeSchema,
  
  quantity: quantitySchema,
  
  price: priceSchema,
  
  fee: currencyAmountSchema.default(0),
  
  trade_date: dateSchema,
  
  notes: z.string()
    .max(500, '备注不能超过500个字符')
    .optional()
    .transform((val: string | undefined) => val?.trim() || undefined),
  
  broker: z.string()
    .max(100, '券商名称不能超过100个字符')
    .optional()
    .transform((val: string | undefined) => val?.trim() || undefined),
  
  order_id: z.string()
    .max(50, '订单号不能超过50个字符')
    .optional()
    .transform((val: string | undefined) => val?.trim() || undefined)
}).refine((data: any) => {
  // 业务规则验证：卖出数量不能为0
  if (data.type === 'sell' && data.quantity <= 0) {
    return false;
  }
  return true;
}, {
  message: '卖出数量必须大于0',
  path: ['quantity']
}).refine((data: any) => {
  // 业务规则验证：交易日期不能是未来
  const now = new Date();
  const tradeDate = new Date(data.trade_date);
  return tradeDate <= now;
}, {
  message: '交易日期不能是未来时间',
  path: ['trade_date']
});

/** 创建投资计划表单验证 */
export const createPlanFormSchema = z.object({
  name: z.string()
    .min(1, '计划名称不能为空')
    .max(100, '计划名称不能超过100个字符')
    .trim(),
  
  description: z.string()
    .max(1000, '计划描述不能超过1000个字符')
    .optional()
    .transform((val: string | undefined) => val?.trim() || undefined),
  
  target_amount: currencyAmountSchema
    .min(1, '目标金额必须大于0'),
  
  target_date: dateSchema,
  
  currency: currencyCodeSchema,
  
  risk_level: z.number()
    .int('风险等级必须是整数')
    .min(1, '风险等级最小为1')
    .max(5, '风险等级最大为5'),
  
  expected_return: percentageSchema
    .min(0, '预期收益率不能为负数')
    .max(100, '预期收益率不能超过100%'),
  
  asset_ids: z.array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),
  
  tags: tagsSchema
}).refine((data: any) => {
  // 业务规则验证：目标日期必须是未来
  const now = new Date();
  const targetDate = new Date(data.target_date);
  return targetDate > now;
}, {
  message: '目标日期必须是未来时间',
  path: ['target_date']
}).refine((data: any) => {
  // 业务规则验证：高风险等级应该有合理的预期收益率
  if (data.risk_level >= 4 && data.expected_return < 5) {
    return false;
  }
  return true;
}, {
  message: '高风险投资的预期收益率应该相应提高',
  path: ['expected_return']
});

/** 创建复盘日志表单验证 */
export const createReviewFormSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(200, '标题不能超过200个字符')
    .trim(),
  
  content: z.string()
    .min(10, '内容至少需要10个字符')
    .max(10000, '内容不能超过10000个字符')
    .trim(),
  
  type: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'trade', 'strategy'] as const),
  
  review_date: dateSchema,
  
  asset_ids: z.array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),
  
  transaction_ids: z.array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),
  
  plan_id: z.union([z.string(), z.number()])
    .optional(),
  
  tags: tagsSchema,
  
  rating: z.number()
    .int('评分必须是整数')
    .min(1, '评分最小为1')
    .max(5, '评分最大为5')
    .optional(),
  
  keywords: z.array(z.string().min(1).max(20))
    .max(20, '关键词数量不能超过20个')
    .optional()
    .default([])
}).refine((data: any) => {
  // 业务规则验证：复盘日期不能是未来
  const now = new Date();
  const reviewDate = new Date(data.review_date);
  return reviewDate <= now;
}, {
  message: '复盘日期不能是未来时间',
  path: ['review_date']
});

// ============= 业务规则验证函数 =============

/** 验证资产代码唯一性 */
export const validateAssetSymbolUnique = async (
  symbol: string, 
  existingAssets: Array<{symbol: string}>,
  excludeId?: string | number
): Promise<{isValid: boolean, error?: string}> => {
  const normalizedSymbol = symbol.toUpperCase().trim();
  const exists = existingAssets.some(asset => 
    asset.symbol.toUpperCase() === normalizedSymbol && 
    (excludeId === undefined || asset.symbol !== excludeId)
  );
  
  return {
    isValid: !exists,
    error: exists ? '资产代码已存在' : undefined
  };
};

/** 验证交易数量是否足够 */
export const validateTransactionQuantity = (
  transactionType: TransactionType,
  quantity: number,
  currentHolding: number
): {isValid: boolean, error?: string} => {
  if (transactionType === 'sell' && quantity > currentHolding) {
    return {
      isValid: false,
      error: `卖出数量(${quantity})不能超过持有数量(${currentHolding})`
    };
  }
  
  return { isValid: true };
};

/** 验证投资计划的资产分配 */
export const validatePlanAssetAllocation = (
  assetIds: Array<string | number>,
  availableAssets: Array<{id: string | number, type: AssetType}>
): {isValid: boolean, errors: string[]} => {
  const errors: string[] = [];
  
  // 检查资产是否存在
  const invalidAssets = assetIds.filter(id => 
    !availableAssets.some(asset => asset.id === id)
  );
  
  if (invalidAssets.length > 0) {
    errors.push(`以下资产不存在: ${invalidAssets.join(', ')}`);
  }
  
  // 检查资产类型多样性
  const assetTypes = new Set(
    assetIds
      .map(id => availableAssets.find(asset => asset.id === id)?.type)
      .filter(Boolean)
  );
  
  if (assetTypes.size === 1 && assetIds.length > 1) {
    errors.push('建议选择不同类型的资产以分散风险');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/** 验证复盘日志的关联数据 */
export const validateReviewLogReferences = (
  assetIds: Array<string | number>,
  transactionIds: Array<string | number>,
  planId: string | number | undefined,
  availableAssets: Array<{id: string | number}>,
  availableTransactions: Array<{id: string | number}>,
  availablePlans: Array<{id: string | number}>
): {isValid: boolean, errors: string[]} => {
  const errors: string[] = [];
  
  // 验证资产ID
  const invalidAssets = assetIds.filter(id => 
    !availableAssets.some(asset => asset.id === id)
  );
  if (invalidAssets.length > 0) {
    errors.push(`以下资产不存在: ${invalidAssets.join(', ')}`);
  }
  
  // 验证交易ID
  const invalidTransactions = transactionIds.filter(id => 
    !availableTransactions.some(transaction => transaction.id === id)
  );
  if (invalidTransactions.length > 0) {
    errors.push(`以下交易记录不存在: ${invalidTransactions.join(', ')}`);
  }
  
  // 验证计划ID
  if (planId && !availablePlans.some(plan => plan.id === planId)) {
    errors.push('关联的投资计划不存在');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============= 数据清理和格式化函数 =============

/** 清理和格式化资产数据 */
export const sanitizeAssetData = (data: any): Partial<CreateAssetForm> => {
  return {
    name: typeof data.name === 'string' ? data.name.trim() : '',
    symbol: typeof data.symbol === 'string' ? data.symbol.trim().toUpperCase() : '',
    type: data.type as AssetType,
    market: typeof data.market === 'string' ? data.market.trim() || undefined : undefined,
    currency: data.currency as CurrencyCode,
    quantity: Number(data.quantity) || 0,
    average_cost: Number(data.average_cost) || 0,
    description: typeof data.description === 'string' ? data.description.trim() || undefined : undefined,
    tags: Array.isArray(data.tags) ? data.tags.filter((tag: any) => typeof tag === 'string' && tag.trim()) : []
  };
};

/** 清理和格式化交易数据 */
export const sanitizeTransactionData = (data: any): Partial<CreateTransactionForm> => {
  return {
    asset_id: data.asset_id,
    type: data.type as TransactionType,
    quantity: Number(data.quantity) || 0,
    price: Number(data.price) || 0,
    fee: Number(data.fee) || 0,
    trade_date: data.trade_date,
    notes: typeof data.notes === 'string' ? data.notes.trim() || undefined : undefined,
    broker: typeof data.broker === 'string' ? data.broker.trim() || undefined : undefined,
    order_id: typeof data.order_id === 'string' ? data.order_id.trim() || undefined : undefined
  };
};

// ============= 导出验证函数 =============

/** 验证创建资产表单 */
export const validateCreateAssetForm = (data: unknown) => {
  return createAssetFormSchema.safeParse(data);
};

/** 验证创建交易表单 */
export const validateCreateTransactionForm = (data: unknown) => {
  return createTransactionFormSchema.safeParse(data);
};

/** 验证创建计划表单 */
export const validateCreatePlanForm = (data: unknown) => {
  return createPlanFormSchema.safeParse(data);
};

/** 验证创建复盘表单 */
export const validateCreateReviewForm = (data: unknown) => {
  return createReviewFormSchema.safeParse(data);
};

// ============= 通用验证工具 =============

/** 验证必填字段 */
export const validateRequired = (value: any, fieldName: string): {isValid: boolean, error?: string} => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName}不能为空`
    };
  }
  return { isValid: true };
};

/** 验证数字范围 */
export const validateNumberRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): {isValid: boolean, error?: string} => {
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${fieldName}必须在${min}到${max}之间`
    };
  }
  return { isValid: true };
};

/** 验证字符串长度 */
export const validateStringLength = (
  value: string, 
  minLength: number, 
  maxLength: number, 
  fieldName: string
): {isValid: boolean, error?: string} => {
  if (value.length < minLength || value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName}长度必须在${minLength}到${maxLength}个字符之间`
    };
  }
  return { isValid: true };
};

/** 验证邮箱格式 */
export const validateEmail = (email: string): {isValid: boolean, error?: string} => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: '请输入有效的邮箱地址'
    };
  }
  return { isValid: true };
};

/** 批量验证 */
export const validateBatch = (
  validations: Array<() => {isValid: boolean, error?: string}>
): {isValid: boolean, errors: string[]} => {
  const errors: string[] = [];
  
  for (const validate of validations) {
    const result = validate();
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};