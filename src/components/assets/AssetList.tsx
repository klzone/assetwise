'use client'

import React, { useState, useEffect } from 'react'
import { useUserStore } from '@/store'
import { supabaseDataService } from '@/lib/services/supabase-data.service'
import { Database } from '@/lib/types/database-new.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Plus, TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react'

type Asset = Database['public']['Tables']['assets']['Row']
type AssetInsert = Database['public']['Tables']['assets']['Insert']

interface AssetData {
  assets: Asset[]
  totalValue: number
  totalProfitLoss: number
  totalProfitLossPercentage: number
  dayChange: number
  dayChangePercentage: number
}

export default function AssetList() {
  const { user, isAuthenticated } = useUserStore()
  const [assetData, setAssetData] = useState<AssetData>({
    assets: [],
    totalValue: 0,
    totalProfitLoss: 0,
    totalProfitLossPercentage: 0,
    dayChange: 0,
    dayChangePercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // 新资产表单状态
  const [newAsset, setNewAsset] = useState<Partial<AssetInsert>>({
    symbol: '',
    name: '',
    type: 'stock',
    quantity: 0,
    average_cost: 0,
    current_price: 0
  })

  // 计算资产数据
  const calculateAssetData = (assets: Asset[]): AssetData => {
    const totalValue = assets.reduce((sum, asset) => sum + asset.market_value, 0)
    const totalProfitLoss = assets.reduce((sum, asset) => sum + asset.profit_loss, 0)
    const totalProfitLossPercentage = totalValue > 0 ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100 : 0
    const dayChange = assets.reduce((sum, asset) => sum + asset.day_change, 0)
    const dayChangePercentage = totalValue > 0 ? (dayChange / totalValue) * 100 : 0

    return {
      assets,
      totalValue,
      totalProfitLoss,
      totalProfitLossPercentage,
      dayChange,
      dayChangePercentage
    }
  }

  // 加载用户资产
  const loadAssets = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const assets = await supabaseDataService.getAssets(user.id)
      const calculatedData = calculateAssetData(assets)
      setAssetData(calculatedData)
    } catch (err) {
      console.error('加载资产失败:', err)
      setError('加载资产时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 添加新资产
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !newAsset.symbol || !newAsset.name) return

    try {
      const assetData: AssetInsert = {
        user_id: user.id,
        symbol: newAsset.symbol,
        name: newAsset.name,
        type: newAsset.type || 'stock',
        quantity: newAsset.quantity || 0,
        average_cost: newAsset.average_cost || 0,
        current_price: newAsset.current_price || 0,
        market_value: (newAsset.quantity || 0) * (newAsset.current_price || 0),
        profit_loss: ((newAsset.current_price || 0) - (newAsset.average_cost || 0)) * (newAsset.quantity || 0),
        profit_loss_percentage: newAsset.average_cost ? (((newAsset.current_price || 0) - (newAsset.average_cost || 0)) / (newAsset.average_cost || 0)) * 100 : 0,
        day_change: 0,
        day_change_rate: 0,
        weight: 0
      }

      const result = await supabaseDataService.createAsset(assetData)
      if (result.success) {
        await loadAssets() // 重新加载资产列表
        setNewAsset({
          symbol: '',
          name: '',
          type: 'stock',
          quantity: 0,
          average_cost: 0,
          current_price: 0
        })
        setShowAddDialog(false)
      } else {
        setError(result.error || '添加资产失败')
      }
    } catch (err) {
      console.error('添加资产错误:', err)
      setError('添加资产时发生错误')
    }
  }

  // 删除资产
  const handleDeleteAsset = async (assetId: number) => {
    if (!confirm('确定要删除这个资产吗？')) return

    try {
      const result = await supabaseDataService.deleteAsset(assetId.toString())
      if (result.success) {
        await loadAssets() // 重新加载资产列表
      } else {
        setError(result.error || '删除资产失败')
      }
    } catch (err) {
      console.error('删除资产错误:', err)
      setError('删除资产时发生错误')
    }
  }

  // 格式化货币
  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // 格式化百分比
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  // 获取资产类型标签颜色
  const getAssetTypeColor = (type: string) => {
    const colors = {
      stock: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      crypto: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      forex: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      commodity: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      bond: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      fund: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      cash: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return colors[type as keyof typeof colors] || colors.stock
  }

  // 获取资产类型中文名
  const getAssetTypeName = (type: string) => {
    const names = {
      stock: '股票',
      crypto: '加密货币',
      forex: '外汇',
      commodity: '商品',
      bond: '债券',
      fund: '基金',
      cash: '现金'
    }
    return names[type as keyof typeof names] || type
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAssets()
    }
  }, [user, isAuthenticated])

  if (!isAuthenticated || !user) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="请先登录"
        description="登录后即可查看您的资产组合"
      />
    )
  }

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">资产组合</h1>
          <p className="text-muted-foreground">管理您的投资资产</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {viewMode === 'list' ? '网格视图' : '列表视图'}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加资产
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>添加新资产</DialogTitle>
                <DialogDescription>
                  添加一个新的投资资产到您的组合中
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAsset} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">资产代码</Label>
                    <Input
                      id="symbol"
                      value={newAsset.symbol || ''}
                      onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value})}
                      placeholder="例如: AAPL"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">资产类型</Label>
                    <Select
                      value={newAsset.type || 'stock'}
                      onValueChange={(value) => setNewAsset({...newAsset, type: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">股票</SelectItem>
                        <SelectItem value="crypto">加密货币</SelectItem>
                        <SelectItem value="forex">外汇</SelectItem>
                        <SelectItem value="commodity">商品</SelectItem>
                        <SelectItem value="bond">债券</SelectItem>
                        <SelectItem value="fund">基金</SelectItem>
                        <SelectItem value="cash">现金</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">资产名称</Label>
                  <Input
                    id="name"
                    value={newAsset.name || ''}
                    onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                    placeholder="例如: 苹果公司"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">持有数量</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={newAsset.quantity || 0}
                      onChange={(e) => setNewAsset({...newAsset, quantity: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="average_cost">平均成本</Label>
                    <Input
                      id="average_cost"
                      type="number"
                      step="0.01"
                      value={newAsset.average_cost || 0}
                      onChange={(e) => setNewAsset({...newAsset, average_cost: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_price">当前价格</Label>
                    <Input
                      id="current_price"
                      type="number"
                      step="0.01"
                      value={newAsset.current_price || 0}
                      onChange={(e) => setNewAsset({...newAsset, current_price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    取消
                  </Button>
                  <Button type="submit">添加资产</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 资产概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总市值</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(assetData.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总盈亏</CardTitle>
            {assetData.totalProfitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${assetData.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(assetData.totalProfitLoss)}
            </div>
            <p className={`text-xs ${assetData.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(assetData.totalProfitLossPercentage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日变化</CardTitle>
            {assetData.dayChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${assetData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(assetData.dayChange)}
            </div>
            <p className={`text-xs ${assetData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(assetData.dayChangePercentage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">资产数量</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetData.assets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 资产列表 */}
      {assetData.assets.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="暂无资产"
          description="开始添加您的第一个投资资产"
          action={
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加资产
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>资产明细</CardTitle>
            <CardDescription>您的投资组合详细信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>资产信息</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">持有数量</TableHead>
                  <TableHead className="text-right">当前价格</TableHead>
                  <TableHead className="text-right">市值</TableHead>
                  <TableHead className="text-right">盈亏</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetData.assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">{asset.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAssetTypeColor(asset.type)}>
                        {getAssetTypeName(asset.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.current_price || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(asset.market_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={asset.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        <div>{formatCurrency(asset.profit_loss)}</div>
                        <div className="text-xs">
                          {formatPercentage(asset.profit_loss_percentage)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}