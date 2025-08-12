'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAppStore } from '@/store';

// 翻译字典
const translations = {
  zh: {
    // 通用
    'loading': '正在加载...',
    'save': '保存',
    'cancel': '取消',
    'confirm': '确认',
    'delete': '删除',
    'edit': '编辑',
    'add': '添加',
    'search': '搜索',
    'filter': '筛选',
    'export': '导出',
    'import': '导入',
    'settings': '设置',
    'profile': '个人资料',
    'logout': '退出登录',
    
    // 导航
    'dashboard': '仪表板',
    'accounts': '投资账户',
    'assets': '资产分析',
    'transactions': '交易记录',
    'reviews': '复盘日志',
    'plans': '投资计划',
    'upgrade': '升级',
    'system-monitor': '系统监控',
    
    // 主题和语言
    'theme': '主题',
    'language': '语言',
    'light': '浅色',
    'dark': '咖啡色',
    'system': '跟随系统',
    'chinese': '中文',
    'english': 'English',
    'appSettings': '应用设置',
    
    // 颜色约定
    'profit': '盈利',
    'loss': '亏损',
  },
  en: {
    // 通用
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'filter': 'Filter',
    'export': 'Export',
    'import': 'Import',
    'settings': 'Settings',
    'profile': 'Profile',
    'logout': 'Logout',
    
    // 导航
    'dashboard': 'Dashboard',
    'accounts': 'Accounts',
    'assets': 'Assets',
    'transactions': 'Transactions',
    'reviews': 'Reviews',
    'plans': 'Plans',
    'upgrade': 'Upgrade',
    'system-monitor': 'System Monitor',
    
    // 主题和语言
    'theme': 'Theme',
    'language': 'Language',
    'light': 'Light',
    'dark': 'Coffee',
    'system': 'System',
    'chinese': '中文',
    'english': 'English',
    'appSettings': 'App Settings',
    
    // 颜色约定
    'profit': 'Profit',
    'loss': 'Loss',
  }
};

type Language = 'zh' | 'en';
type TranslationKey = keyof typeof translations.zh;

interface I18nContextType {
  language: Language;
  t: (key: TranslationKey) => string;
  getProfitLossColors: () => any;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language } = useAppStore();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // 根据语言返回盈亏颜色
  const getProfitLossColors = () => {
    if (language === 'zh') {
      // 中文：红涨绿跌
      return {
        profit: 'text-red-600',
        loss: 'text-green-600',
        profitBg: 'bg-red-50 text-red-700',
        lossBg: 'bg-green-50 text-green-700',
        profitBorder: 'border-red-200',
        lossBorder: 'border-green-200'
      };
    } else {
      // 英文：绿涨红跌
      return {
        profit: 'text-green-600',
        loss: 'text-red-600',
        profitBg: 'bg-green-50 text-green-700',
        lossBg: 'bg-red-50 text-red-700',
        profitBorder: 'border-green-200',
        lossBorder: 'border-red-200'
      };
    }
  };

  const value: I18nContextType = {
    language,
    t,
    getProfitLossColors
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// 导出翻译函数供非组件使用
export function getTranslation(language: Language, key: TranslationKey): string {
  return translations[language][key] || key;
}
