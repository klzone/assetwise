import { AccountType, Currency } from '@/lib/types/data.types';

// 账户类型配置
export interface AccountTypeConfig {
  key: AccountType;
  label: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  icon: string;
  color: string;
  bgColor: string;
  defaultCurrency: Currency;
  supportedCurrencies: Currency[];
  riskLevel: 'low' | 'medium' | 'high';
  category: 'investment' | 'cash' | 'alternative';
}

// 账户类型配置列表
export const ACCOUNT_TYPES: AccountTypeConfig[] = [
  {
    key: 'securities',
    label: {
      zh: '证券账户',
      en: 'Securities Account'
    },
    description: {
      zh: '用于股票、债券等证券交易',
      en: 'For stocks, bonds and other securities trading'
    },
    icon: '📈',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD', 'HKD'],
    riskLevel: 'medium',
    category: 'investment'
  },
  {
    key: 'crypto',
    label: {
      zh: '数字货币账户',
      en: 'Crypto Account'
    },
    description: {
      zh: '用于数字货币投资',
      en: 'For cryptocurrency investment'
    },
    icon: '₿',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'CNY'],
    riskLevel: 'high',
    category: 'alternative'
  },
  {
    key: 'fund',
    label: {
      zh: '基金账户',
      en: 'Fund Account'
    },
    description: {
      zh: '用于基金投资和管理',
      en: 'For fund investment and management'
    },
    icon: '🏦',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD', 'EUR'],
    riskLevel: 'medium',
    category: 'investment'
  },
  {
    key: 'bank',
    label: {
      zh: '银行账户',
      en: 'Bank Account'
    },
    description: {
      zh: '银行储蓄和理财账户',
      en: 'Bank savings and wealth management account'
    },
    icon: '🏛️',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD', 'EUR', 'HKD'],
    riskLevel: 'low',
    category: 'cash'
  },
  {
    key: 'bond',
    label: {
      zh: '债券账户',
      en: 'Bond Account'
    },
    description: {
      zh: '国债、企业债等债券投资',
      en: 'Government bonds, corporate bonds and other bond investments'
    },
    icon: '📜',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD', 'EUR'],
    riskLevel: 'low',
    category: 'investment'
  },
  {
    key: 'futures',
    label: {
      zh: '期货账户',
      en: 'Futures Account'
    },
    description: {
      zh: '期货合约交易账户',
      en: 'Futures contract trading account'
    },
    icon: '⚡',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD'],
    riskLevel: 'high',
    category: 'alternative'
  },
  {
    key: 'forex',
    label: {
      zh: '外汇账户',
      en: 'Forex Account'
    },
    description: {
      zh: '外汇交易投资账户',
      en: 'Foreign exchange trading investment account'
    },
    icon: '💱',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY'],
    riskLevel: 'high',
    category: 'alternative'
  },
  {
    key: 'cash',
    label: {
      zh: '现金账户',
      en: 'Cash Account'
    },
    description: {
      zh: '现金管理和货币市场基金',
      en: 'Cash management and money market funds'
    },
    icon: '💰',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD', 'EUR', 'HKD'],
    riskLevel: 'low',
    category: 'cash'
  },
  {
    key: 'pension',
    label: {
      zh: '养老金账户',
      en: 'Pension Account'
    },
    description: {
      zh: '退休养老金投资账户',
      en: 'Retirement pension investment account'
    },
    icon: '🏖️',
    color: 'text-teal-800',
    bgColor: 'bg-teal-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY'],
    riskLevel: 'low',
    category: 'investment'
  },
  {
    key: 'insurance',
    label: {
      zh: '保险账户',
      en: 'Insurance Account'
    },
    description: {
      zh: '保险理财和投资账户',
      en: 'Insurance wealth management and investment account'
    },
    icon: '🛡️',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100',
    defaultCurrency: 'CNY',
    supportedCurrencies: ['CNY', 'USD'],
    riskLevel: 'low',
    category: 'investment'
  },
  {
    key: 'commodity',
    label: {
      zh: '其他',
      en: 'Other'
    },
    description: {
      zh: '其他类型的投资账户',
      en: 'Other types of investment accounts'
    },
    icon: '🥇',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'CNY'],
    riskLevel: 'medium',
    category: 'alternative'
  }
];

// 币种配置
export interface CurrencyConfig {
  code: Currency;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'CNY', name: '人民币', symbol: '¥', locale: 'zh-CN' },
  { code: 'USD', name: '美元', symbol: '$', locale: 'en-US' },
  { code: 'HKD', name: '港币', symbol: 'HK$', locale: 'zh-HK' },
  { code: 'EUR', name: '欧元', symbol: '€', locale: 'de-DE' },
  { code: 'JPY', name: '日元', symbol: '¥', locale: 'ja-JP' },
  { code: 'GBP', name: '英镑', symbol: '£', locale: 'en-GB' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', locale: 'en-SG' },
  { code: 'AUD', name: '澳元', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', name: '加元', symbol: 'C$', locale: 'en-CA' }
];

// 获取账户类型配置
export const getAccountTypeConfig = (type: AccountType): AccountTypeConfig | undefined => {
  return ACCOUNT_TYPES.find(config => config.key === type);
};

// 获取本地化的账户类型标签
export const getLocalizedAccountTypeLabel = (type: AccountType, language: 'zh' | 'en' = 'zh'): string => {
  const config = getAccountTypeConfig(type);
  return config ? config.label[language] : type;
};

// 获取本地化的账户类型描述
export const getLocalizedAccountTypeDescription = (type: AccountType, language: 'zh' | 'en' = 'zh'): string => {
  const config = getAccountTypeConfig(type);
  return config ? config.description[language] : '';
};

// 获取币种配置
export const getCurrencyConfig = (currency: Currency): CurrencyConfig | undefined => {
  return CURRENCIES.find(config => config.code === currency);
};

// 按类别分组账户类型
export const getAccountTypesByCategory = () => {
  const grouped = ACCOUNT_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, AccountTypeConfig[]>);
  
  return grouped;
};
