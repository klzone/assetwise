"use client"

import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  Grid3X3, 
  List,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetGrid, AssetCard, AssetCardSkeleton, type AssetData } from '@/components/assets/asset-card'

// 模拟资产数据
const mockAssets: AssetData[] = [
  {
    id: '1',
    name: '苹果公司',
    symbol: 'AAPL',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop&crop=center',
    category: '科技股',
    currentPrice: 175.43,
    purchasePrice: 150.00,
    quantity: 100,
    totalValue: 17543,
    totalCost: 15000,
    profitLoss: 2543,
    profitLossPercent: 16.95,
    dayChange: 2.15,
    dayChangePercent: 1.24,
    allocation: 25.3,
    lastUpdated: '2小时前',
    riskLevel: 'medium'
  },
  {
    id: '2',
    name: '微软公司',
    symbol: 'MSFT',
    logo: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=100&h=100&fit=crop&crop=center',
    category: '科技股',
    currentPrice: 378.85,
    purchasePrice: 320.00,
    quantity: 50,
    totalValue: 18942.5,
    totalCost: 16000,
    profitLoss: 2942.5,
    profitLossPercent: 18.39,
    dayChange: -1.25,
    dayChangePercent: -0.33,
    allocation: 27.4,
    lastUpdated: '1小时前',
    riskLevel: 'low'
  },
  {
    id: '3',
    name: '特斯拉',
    symbol: 'TSLA',
    logo: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=100&h=100&fit=crop&crop=center',
    category: '新能源',
    currentPrice: 248.50,
    purchasePrice: 280.00,
    quantity: 75,
    totalValue: 18637.5,
    totalCost: 21000,
    profitLoss: -2362.5,
    profitLossPercent: -11.25,
    dayChange: 5.75,
    dayChangePercent: 2.37,
    allocation: 26.9,
    lastUpdated: '30分钟前',
    riskLevel: 'high'
  },
  {
    id: '4',
    name: '亚马逊',
    symbol: 'AMZN',
    logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&h=100&fit=crop&crop=center',
    category: '电商',
    currentPrice: 145.32,
    purchasePrice: 135.00,
    quantity: 80,
    totalValue: 11625.6,
    totalCost: 10800,
    profitLoss: 825.6,
    profitLossPercent: 7.64,
    dayChange: 0.85,
    dayChangePercent: 0.59,
    allocation: 16.8,
    lastUpdated: '45分钟前',
    riskLevel: 'medium'
  },
  {
    id: '5',
    name: '谷歌',
    symbol: 'GOOGL',
    logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&h=100&fit=crop&crop=center',
    category: '科技股',
    currentPrice: 142.65,
    purchasePrice: 125.00,
    quantity: 60,
    totalValue: 8559,
    totalCost: 7500,
    profitLoss: 1059,
    profitLossPercent: 14.12,
    dayChange: -0.45,
    dayChangePercent: -0.31,
    allocation: 12.4,
    lastUpdated: '1小时前',
    riskLevel: 'low'
  },
  {
    id: '6',
    name: '比特币ETF',
    symbol: 'BTCETF',
    category: '加密货币',
    currentPrice: 45.80,
    purchasePrice: 38.50,
    quantity: 200,
    totalValue: 9160,
    totalCost: 7700,
    profitLoss: 1460,
    profitLossPercent: 18.96,
    dayChange: 2.30,
    dayChangePercent: 5.29,
    allocation: 13.2,
    lastUpdated: '15分钟前',
    riskLevel: 'high'
  }
]

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterCategory, setFilterCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(false)

  // 过滤和排序资产
  const filteredAssets = mockAssets
    .filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || asset.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'value':
          return b.totalValue - a.totalValue
        case 'profit':
          return b.profitLoss - a.profitLoss
        case 'change':
          return b.dayChangePercent - a.dayChangePercent
        default:
          return 0
      }
    })

  // 获取所有分类
  const categories = Array.from(new Set(mockAssets.map(asset => asset.category)))

  // 计算总计数据
  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.totalValue, 0)
  const totalCost = mockAssets.reduce((sum, asset) => sum + asset.totalCost, 0)
  const totalProfit = totalValue - totalCost
  const totalProfitPercent = (totalProfit / totalCost) * 100

  const handleAssetView = (id: string) => {
    console.log('查看资产:', id)
  }

  const handleAssetEdit = (id: string) => {
    console.log('编辑资产:', id)
  }

  const handleAssetDelete = (id: string) => {
    console.log('删除资产:', id)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className="space-y-8">
      {/* 页面标题和操作区域 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">资产管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的投资组合，跟踪资产表现
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            添加资产
          </Button>
        </div>
      </div>

      {/* 总览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总资产价值</span>
            <Badge variant="secondary">{mockAssets.length} 项</Badge>
          </div>
          <p className="text-2xl font-bold">¥{totalValue.toLocaleString()}</p>
        </div>
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总投入成本</span>
          </div>
          <p className="text-2xl font-bold">¥{totalCost.toLocaleString()}</p>
        </div>
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总盈亏</span>
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toLocaleString()}
          </p>
        </div>
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总收益率</span>
          </div>
          <p className={`text-2xl font-bold ${totalProfitPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* 搜索和筛选工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索资产名称或代码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">按名称</SelectItem>
              <SelectItem value="value">按价值</SelectItem>
              <SelectItem value="profit">按盈亏</SelectItem>
              <SelectItem value="change">按涨跌</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 资产列表 */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <AssetCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredAssets.length > 0 ? (
          <AssetGrid
            assets={filteredAssets}
            onView={handleAssetView}
            onEdit={handleAssetEdit}
            onDelete={handleAssetDelete}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">未找到匹配的资产</p>
              <p className="text-sm">尝试调整搜索条件或添加新的资产</p>
            </div>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              添加资产
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}