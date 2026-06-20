"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getStoredSettings, type ColorConvention } from '@/lib/mvp-store'

export type Locale = 'zh-CN' | 'en-US'

export interface LocaleConfig {
  locale: Locale
  currency: string
  currencySymbol: string
  // 颜色配置：true表示上涨红色下跌绿色（中文习惯），false表示上涨绿色下跌红色（英文习惯）
  redForUp: boolean
  dateFormat: string
  numberFormat: Intl.NumberFormatOptions
}

const localeConfigs: Record<Locale, LocaleConfig> = {
  'zh-CN': {
    locale: 'zh-CN',
    currency: 'CNY',
    currencySymbol: '¥',
    redForUp: true, // 中文：红涨绿跌
    dateFormat: 'YYYY-MM-DD',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  'en-US': {
    locale: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
    redForUp: false, // 英文：绿涨红跌
    dateFormat: 'MM/DD/YYYY',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  }
}

interface LocaleContextType {
  config: LocaleConfig
  setLocale: (locale: Locale) => void
  formatCurrency: (amount: number | undefined | null) => string
  formatNumber: (number: number | undefined | null) => string
  formatPercent: (percent: number | undefined | null) => string
  getProfitLossColor: (value: number) => string
  getProfitLossColorClass: (value: number) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [currentLocale, setCurrentLocale] = useState<Locale>('zh-CN')
  const [colorConvention, setColorConvention] = useState<ColorConvention>('chinese')

  // 从localStorage加载语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('assetwise_locale') as Locale
    if (savedLocale && localeConfigs[savedLocale]) {
      setCurrentLocale(savedLocale)
    }
  }, [])

  useEffect(() => {
    const loadSettings = () => setColorConvention(getStoredSettings().colorConvention)

    loadSettings()
    window.addEventListener('assetwise-settings-updated', loadSettings)
    window.addEventListener('focus', loadSettings)

    return () => {
      window.removeEventListener('assetwise-settings-updated', loadSettings)
      window.removeEventListener('focus', loadSettings)
    }
  }, [])

  const config = localeConfigs[currentLocale]

  const setLocale = (locale: Locale) => {
    setCurrentLocale(locale)
    localStorage.setItem('assetwise_locale', locale)
  }

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `${config.currencySymbol}0.00`
    }
    return `${config.currencySymbol}${amount.toLocaleString(config.locale, config.numberFormat)}`
  }

  const formatNumber = (number: number | undefined | null): string => {
    if (number === undefined || number === null || isNaN(number)) {
      return '0.00'
    }
    return number.toLocaleString(config.locale, config.numberFormat)
  }

const formatPercent = (percent: number | undefined | null): string => {
  if (percent === undefined || percent === null || isNaN(percent)) {
    return '0.00%'
  }
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

  // 根据语言习惯返回盈亏颜色
  const getProfitLossColor = (value: number): string => {
    if (value === 0) return '#6b7280' // gray-500
    
    if (colorConvention === 'chinese') {
      // 中文习惯：红涨绿跌
      return value > 0 ? '#ef4444' : '#22c55e' // red-500 : green-500
    } else {
      // 英文习惯：绿涨红跌
      return value > 0 ? '#22c55e' : '#ef4444' // green-500 : red-500
    }
  }

  // 返回Tailwind CSS类名
  const getProfitLossColorClass = (value: number): string => {
    if (value === 0) return 'text-muted-foreground'
    
    if (colorConvention === 'chinese') {
      // 中文习惯：红涨绿跌
      return value > 0 ? 'text-destructive' : 'text-success'
    } else {
      // 英文习惯：绿涨红跌
      return value > 0 ? 'text-success' : 'text-destructive'
    }
  }

  const value: LocaleContextType = {
    config,
    setLocale,
    formatCurrency,
    formatNumber,
    formatPercent,
    getProfitLossColor,
    getProfitLossColorClass
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}

// 语言切换组件
export function LocaleSwitcher() {
  const { config, setLocale } = useLocale()

  return (
    <select
      value={config.locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="px-3 py-1 text-sm border rounded-md bg-background"
    >
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>
  )
}
