"use client"

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List,
  RefreshCw,
  Cloud,
  CloudOff,
  DollarSign
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
import { AssetGrid, AssetCardSkeleton, type AssetData } from '@/components/assets/asset-card'
import { AssetListView } from '@/components/assets/asset-list-view'
import { AddAssetDialog } from '@/components/assets/add-asset-dialog'
import { EditAssetDialog } from '@/components/assets/edit-asset-dialog'
import { AssetDetailDialog } from '@/components/assets/asset-detail-dialog'
import { PriceManagementDialog } from '@/components/assets/price-management-dialog'
import { ExportDialog } from '@/components/assets/export-dialog'
import { SellAssetDialog } from '@/components/assets/sell-asset-dialog'
import { DeleteConfirmationDialog } from '@/components/assets/delete-confirmation-dialog'
import { LocaleProvider, useLocale } from '@/contexts/locale-context'
import { assetStorage } from '@/lib/asset-storage'
import { settingsManager } from '@/lib/settings'
import { priceManager } from '@/lib/price-manager'
import { dataSyncHelper } from '@/lib/data-sync-helper'

// 全面的资产分类定义
const ASSET_CATEGORIES = {
  // 股票类
  '股票': ['科技股', '金融股', '消费股', '医疗股', '能源股', '工业股', '房地产股', '公用事业股'],
  // 债券类
  '债券': ['国债', '企业债', '可转债', '地方债', '金融债', '短期债券', '长期债券'],
  // 基金类
  '基金': ['股票基金', '债券基金', '混合基金', '货币基金', 'ETF基金', '指数基金', 'QDII基金'],
  // 虚拟货币
  '虚拟货币': ['比特币', '以太坊', '其他主流币', '山寨币', '稳定币', 'DeFi代币', 'NFT'],
  // 房地产
  '房地产': ['住宅', '商业地产', '工业地产', 'REITs', '土地', '海外房产', '房地产基金'],
  // 现金及等价物
  '现金': ['活期存款', '定期存款', '货币基金', '银行理财', '国债逆回购', '大额存单'],
  // 保险
  '保险': ['寿险', '重疾险', '意外险', '年金险', '投连险', '万能险', '教育金'],
  // 贵金属
  '贵金属': ['黄金', '白银', '铂金', '钯金', '黄金ETF', '贵金属基金'],
  // 大宗商品
  '大宗商品': ['原油', '天然气', '农产品', '工业金属', '商品期货', '商品基金'],
  // 另类投资
  '另类投资': ['私募股权', '对冲基金', '艺术品', '收藏品', '酒类投资', '版权投资']
}

function AssetsPageContent() {
  const { formatCurrency, formatPercent, getProfitLossColorClass } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterCategory, setFilterCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null)
  const [editingAsset, setEditingAsset] = useState<AssetData | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assets, setAssets] = useState<AssetData[]>([])
  const [syncStatus, setSyncStatus] = useState({ lastSync: 0, needsSync: false })

  // 初始化数据和设置
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // 首先清理重复数据
        console.log('🧹 清理重复数据...')
        assetStorage.cleanupDuplicateAssets()
        assetStorage.cleanupDuplicateTransactions()
        
        // 检查是否有新下载的云端数据需要加载
        if (dataSyncHelper.checkForNewCloudData()) {
          console.log('🔄 发现新的云端数据，正在加载...')
          const result = await dataSyncHelper.loadCloudDataToApp()
          if (result.success) {
            console.log('✅ 云端数据加载成功:', result.message)
            // 确保在云端数据加载成功后立即更新资产列表
            const updatedAssets = assetStorage.getLocalAssets()
            setAssets(updatedAssets)
          } else {
            console.warn('⚠️ 云端数据加载失败:', result.message)
          }
        }
        
        // 加载本地资产数据
        const localAssets = assetStorage.getLocalAssets()
        setAssets(localAssets)
        
        // 加载用户设置
        const settings = settingsManager.getSettings()
        setViewMode(settings.defaultView)
        
        // 检查同步状态
        const status = assetStorage.getSyncStatus()
        setSyncStatus(status)
        
        // 如果需要同步且开启了自动同步，则执行同步
        if (status.needsSync && settings.autoSync) {
          handleSyncFromCloud()
        }
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 获取所有分类选项（包括主分类和子分类）
  const getAllCategories = () => {
    const allCategories = ['all']
    Object.entries(ASSET_CATEGORIES).forEach(([mainCategory, subCategories]) => {
      allCategories.push(mainCategory)
      allCategories.push(...subCategories)
    })
    return allCategories
  }

  const categories = getAllCategories()

  // 过滤和排序资产
  const filteredAssets = assets
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

  // 计算总计数据
  const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0)
  const totalCost = assets.reduce((sum, asset) => sum + asset.totalCost, 0)
  const totalProfit = totalValue - totalCost
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  // 双向云端同步处理
  const handleSyncFromCloud = async () => {
    setIsSyncing(true)
    try {
      console.log('🔄 开始双向同步...')
      
      // 1. 先上传本地数据到云端
      const localAssets = assetStorage.getLocalAssets()
      if (localAssets.length > 0) {
        console.log('📤 上传本地数据到云端:', localAssets.length, '项资产')
        const uploadSuccess = await assetStorage.syncToCloud(localAssets)
        if (uploadSuccess) {
          console.log('✅ 本地数据上传成功')
        } else {
          console.warn('⚠️ 本地数据上传失败')
        }
      }
      
      // 2. 然后从云端下载最新数据
      console.log('📥 从云端下载最新数据...')
      const cloudAssets = await assetStorage.syncFromCloud()
      setAssets(cloudAssets)
      setSyncStatus(assetStorage.getSyncStatus())
      
      console.log('✅ 双向同步完成')
    } catch (error) {
      console.error('❌ 同步失败:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAssetClick = (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (asset) {
      setSelectedAsset(asset)
      setDetailDialogOpen(true)
    }
  }

  const handleAssetView = (id: string) => {
    handleAssetClick(id)
  }

  const handleAssetEdit = (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (asset) {
      setEditingAsset(asset)
      setEditDialogOpen(true)
    }
  }

  const handleAssetDelete = (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (asset) {
      setSelectedAsset(asset)
      setDeleteDialogOpen(true)
    }
  }

  const handleSoftDelete = (id: string) => {
    const success = assetStorage.deleteAsset(id)
    if (success) {
      setAssets(assetStorage.getLocalAssets())
      setSyncStatus(assetStorage.getSyncStatus())
      // 关闭所有对话框
      setDetailDialogOpen(false)
      setDeleteDialogOpen(false)
      setSelectedAsset(null)
    }
  }

  const handlePermanentDelete = (id: string) => {
    const success = assetStorage.permanentDeleteAsset(id)
    if (success) {
      setAssets(assetStorage.getLocalAssets())
      setSyncStatus(assetStorage.getSyncStatus())
      // 关闭所有对话框
      setDetailDialogOpen(false)
      setDeleteDialogOpen(false)
      setSelectedAsset(null)
    }
  }

  const handleAddAsset = (assetData: any) => {
    const newAsset = assetStorage.addAsset({
      name: assetData.name,
      symbol: assetData.symbol.toUpperCase(),
      logo: assetData.logo || '',
      category: assetData.category,
      currentPrice: parseFloat(assetData.purchasePrice),
      purchasePrice: parseFloat(assetData.purchasePrice),
      quantity: parseInt(assetData.quantity),
      totalValue: parseFloat(assetData.purchasePrice) * parseInt(assetData.quantity),
      totalCost: parseFloat(assetData.purchasePrice) * parseInt(assetData.quantity),
      profitLoss: 0,
      profitLossPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      allocation: 0,
      lastUpdated: '刚刚',
      riskLevel: assetData.riskLevel || 'medium'
    })

    setAssets(assetStorage.getLocalAssets())
    setSyncStatus(assetStorage.getSyncStatus())
  }

  const handleSaveAsset = (id: string, updates: Partial<AssetData>) => {
    const success = assetStorage.updateAsset(id, updates)
    if (success) {
      setAssets(assetStorage.getLocalAssets())
      setSyncStatus(assetStorage.getSyncStatus())
    }
  }

  const handleSellAsset = (id: string, sellData: any) => {
    const success = assetStorage.sellAsset(id, {
      sellPrice: parseFloat(sellData.sellPrice),
      sellQuantity: parseInt(sellData.sellQuantity),
      sellDate: sellData.sellDate,
      notes: sellData.notes
    })
    
    if (success) {
      setAssets(assetStorage.getLocalAssets())
      setSyncStatus(assetStorage.getSyncStatus())
      setDetailDialogOpen(false) // 关闭详情对话框
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // 使用 priceManager 更新价格，而不是随机模拟
      const symbols = assets.map(asset => asset.symbol)
      
      // 更新价格数据（不会随机波动，只更新时间戳）
      await priceManager.updatePricesFromAPI(symbols)
      
      // 重新计算资产价值和盈亏
      const updatedAssets = assets.map(asset => {
        // 获取最新价格数据
        const priceData = priceManager.getAssetPriceData(asset.symbol)
        // 如果没有价格数据，保持原价格
        const currentPrice = priceData?.currentPrice || asset.currentPrice
        
        // 计算新的总价值和盈亏
        const totalValue = currentPrice * asset.quantity
        const profitLoss = totalValue - asset.totalCost
        const profitLossPercent = asset.totalCost > 0 ? (profitLoss / asset.totalCost) * 100 : 0
        
        // 计算日涨跌
        const dayChange = priceData?.change || 0
        const dayChangePercent = priceData?.changePercent || 0
        
        return {
          ...asset,
          currentPrice,
          totalValue,
          profitLoss,
          profitLossPercent,
          dayChange,
          dayChangePercent,
          lastUpdated: '刚刚'
        }
      })
      
      // 保存更新后的数据
      assetStorage.saveLocalAssets(updatedAssets)
      setAssets(updatedAssets)
      setSyncStatus(assetStorage.getSyncStatus())
    } catch (error) {
      console.error('刷新价格失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    // 保存用户偏好设置
    settingsManager.updateSettings({ defaultView: mode })
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSyncFromCloud} 
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : syncStatus.needsSync ? (
              <CloudOff className="h-4 w-4 mr-2" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? '同步中' : syncStatus.needsSync ? '需要同步' : '已同步'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPriceDialogOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            价格管理
          </Button>
          <ExportDialog assets={filteredAssets} />
          <AddAssetDialog onAddAsset={handleAddAsset} />
        </div>
      </div>

      {/* 总览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总资产价值</span>
            <Badge variant="secondary">{assets.length} 项</Badge>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总投入成本</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
        </div>
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总盈亏</span>
          </div>
          <p className={`text-2xl font-bold ${getProfitLossColorClass(totalProfit)}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总收益率</span>
          </div>
          <p className={`text-2xl font-bold ${getProfitLossColorClass(totalProfitPercent)}`}>
            {formatPercent(totalProfitPercent)}
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
              onClick={() => handleViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
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
          viewMode === 'grid' ? (
            <AssetGrid
              assets={filteredAssets}
              onView={handleAssetView}
              onEdit={handleAssetEdit}
              onDelete={handleAssetDelete}
              onClick={handleAssetClick}
            />
          ) : (
            <AssetListView
              assets={filteredAssets}
              onView={handleAssetView}
              onEdit={handleAssetEdit}
              onDelete={handleAssetDelete}
              onClick={handleAssetClick}
            />
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">未找到匹配的资产</p>
              <p className="text-sm">尝试调整搜索条件或添加新的资产</p>
            </div>
            <AddAssetDialog 
              onAddAsset={handleAddAsset}
              trigger={
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  添加资产
                </Button>
              }
            />
          </div>
        )}

        {/* 资产详情对话框 */}
        <AssetDetailDialog
          asset={selectedAsset}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onEdit={handleAssetEdit}
          onDelete={handleAssetDelete}
          onSell={(asset) => {
            setSelectedAsset(asset);
            setSellDialogOpen(true);
          }}
        />

        {/* 卖出资产对话框 */}
        <SellAssetDialog
          asset={selectedAsset}
          open={sellDialogOpen}
          onOpenChange={setSellDialogOpen}
          onSell={(sellData) => {
            if (selectedAsset) {
              handleSellAsset(selectedAsset.id, sellData);
            }
          }}
        />

        {/* 资产编辑对话框 */}
        <EditAssetDialog
          asset={editingAsset}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveAsset}
        />

        {/* 价格管理对话框 */}
        <PriceManagementDialog
          assets={assets}
          open={priceDialogOpen}
          onOpenChange={setPriceDialogOpen}
          onPriceUpdate={(updates: Array<{id: string, currentPrice: number}>) => {
            // 批量更新资产价格
            updates.forEach(update => {
              const asset = assets.find(a => a.id === update.id);
              if (asset) {
                assetStorage.updateAsset(update.id, {
                  currentPrice: update.currentPrice,
                  totalValue: update.currentPrice * asset.quantity
                });
              }
            });
            setAssets(assetStorage.getLocalAssets());
            setSyncStatus(assetStorage.getSyncStatus());
          }}
        />

        {/* 删除确认对话框 */}
        <DeleteConfirmationDialog
          asset={selectedAsset}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSoftDelete={handleSoftDelete}
          onPermanentDelete={handlePermanentDelete}
        />
      </div>
    </div>
  )
}

export default function AssetsPage() {
  return (
    <LocaleProvider>
      <AssetsPageContent />
    </LocaleProvider>
  )
}