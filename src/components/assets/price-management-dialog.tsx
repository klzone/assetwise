'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3 } from 'lucide-react'
import { AssetData } from './asset-card'
import { priceManager, PriceData, PriceHistory } from '@/lib/price-manager'
import { useToast } from '@/hooks/use-toast'
import { useLocale } from '@/contexts/locale-context'

interface PriceManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assets: AssetData[]
  onPriceUpdate: (updates: Array<{id: string, currentPrice: number}>) => void
}

export function PriceManagementDialog({
  open,
  onOpenChange,
  assets,
  onPriceUpdate
}: PriceManagementDialogProps) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const { toast } = useToast()
  const { getProfitLossColorClass } = useLocale()

  // 加载价格数据
  useEffect(() => {
    if (open) {
      loadPriceData()
      // 初始化手动输入框
      const initialPrices: Record<string, string> = {}
      assets.forEach(asset => {
        const priceData = priceManager.getAssetPriceData(asset.symbol)
        const currentPrice = priceData?.currentPrice;
        const purchasePrice = asset.purchasePrice || 0;
        
        initialPrices[asset.symbol] = currentPrice !== undefined ? 
          currentPrice.toString() : 
          purchasePrice.toString();
      })
      setManualPrices(initialPrices)
    }
  }, [open, assets])

  // 加载选中资产的价格历史
  useEffect(() => {
    if (selectedAsset) {
      const history = priceManager.getPriceHistory(selectedAsset, 30)
      setPriceHistory(history)
    }
  }, [selectedAsset])

  const loadPriceData = () => {
    const storedPrices = priceManager.getStoredPrices()
    setPrices(storedPrices)
  }

  // 手动更新单个资产价格
  const handleManualUpdate = (symbol: string) => {
    const priceStr = manualPrices[symbol]
    const price = parseFloat(priceStr)
    
    if (isNaN(price) || price <= 0) {
      toast({
        title: "价格无效",
        description: "请输入有效的价格数值",
        variant: "destructive"
      })
      return
    }

    try {
      const updatedPrice = priceManager.updateAssetPrice(symbol, price)
      setPrices(prev => ({ ...prev, [symbol]: updatedPrice }))
      
      toast({
        title: "价格更新成功",
        description: `${symbol} 的价格已更新为 ¥${(price || 0).toFixed(2)}`
      })
      
      // 找到对应的资产ID并更新
      const asset = assets.find(a => a.symbol === symbol)
      if (asset) {
        onPriceUpdate([{
          id: asset.id,
          currentPrice: price
        }])
      }
    } catch (error) {
      toast({
        title: "更新失败",
        description: "价格更新时发生错误",
        variant: "destructive"
      })
    }
  }

  // 批量更新所有价格
  const handleBatchUpdate = async () => {
    setUpdating(true)
    try {
      const symbols = assets.map(asset => asset.symbol)
      const updatedPrices = await priceManager.updatePricesFromAPI(symbols)
      setPrices(updatedPrices)
      
      // 更新手动输入框的值
      const newManualPrices: Record<string, string> = {}
      Object.entries(updatedPrices).forEach(([symbol, priceData]) => {
        newManualPrices[symbol] = priceData.currentPrice.toString()
      })
      setManualPrices(prev => ({ ...prev, ...newManualPrices }))
      
      // 准备批量更新数据
      const updates = assets.map(asset => {
        const priceData = updatedPrices[asset.symbol]
        return {
          id: asset.id,
          currentPrice: priceData ? priceData.currentPrice : asset.currentPrice
        }
      })
      
      toast({
        title: "批量更新完成",
        description: `已更新 ${symbols.length} 个资产的价格数据`
      })
      
      onPriceUpdate(updates)
    } catch (error) {
      toast({
        title: "批量更新失败",
        description: "更新价格时发生错误",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  // 格式化价格变化
  const formatPriceChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0
    const icon = isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
    const colorClass = getProfitLossColorClass(change) // 使用 locale 上下文中的颜色类
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        {icon}
        <span>¥{Math.abs(change || 0).toFixed(2)}</span>
        <span>({(changePercent || 0) >= 0 ? '+' : ''}{(changePercent || 0).toFixed(2)}%)</span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            价格数据管理
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">手动更新</TabsTrigger>
            <TabsTrigger value="batch">批量更新</TabsTrigger>
            <TabsTrigger value="history">价格历史</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid gap-4">
              {assets.map(asset => {
                const priceData = prices[asset.symbol]
                const profitLoss = priceManager.calculateAssetProfitLoss(asset, priceData?.currentPrice)
                
                return (
                  <Card key={asset.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{asset.name}</CardTitle>
                          <CardDescription>{asset.symbol} • {asset.category}</CardDescription>
                        </div>
                        <Badge variant={priceData?.source === 'manual' ? 'secondary' : 'default'}>
                          {priceData?.source === 'manual' ? '手动' : priceData?.source === 'api' ? 'API' : '模拟'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">购买价格</Label>
                          <div className="font-medium">¥{(asset.purchasePrice || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">当前价格</Label>
                          <div className="font-medium">¥{(profitLoss.currentPrice || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">持仓盈亏</Label>
                          <div className={`font-medium ${getProfitLossColorClass(profitLoss.profitLoss || 0)}`}>
                            ¥{(profitLoss.profitLoss || 0).toFixed(2)} ({(profitLoss.profitLossPercent || 0) >= 0 ? '+' : ''}{(profitLoss.profitLossPercent || 0).toFixed(2)}%)
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">日涨跌</Label>
                          <div>
                            {priceData ? formatPriceChange(priceData.change, priceData.changePercent) : (
                              <span className="text-muted-foreground">无数据</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`price-${asset.symbol}`}>更新价格</Label>
                          <Input
                            id={`price-${asset.symbol}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={manualPrices[asset.symbol] || ''}
                            onChange={(e) => setManualPrices(prev => ({
                              ...prev,
                              [asset.symbol]: e.target.value
                            }))}
                            placeholder="输入新价格"
                          />
                        </div>
                        <Button
                          onClick={() => handleManualUpdate(asset.symbol)}
                          disabled={!manualPrices[asset.symbol] || parseFloat(manualPrices[asset.symbol]) <= 0}
                        >
                          更新
                        </Button>
                      </div>
                      
                      {priceData && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>最后更新: {priceData.lastUpdated}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>批量价格更新</CardTitle>
                <CardDescription>
                  从数据源批量获取所有资产的最新价格信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{assets.length}</div>
                    <div className="text-muted-foreground">总资产数</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Object.values(prices).filter(p => p.source === 'api').length}
                    </div>
                    <div className="text-muted-foreground">API数据</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Object.values(prices).filter(p => p.source === 'manual').length}
                    </div>
                    <div className="text-muted-foreground">手动数据</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {priceManager.getSymbolsNeedingUpdate(assets).length}
                    </div>
                    <div className="text-muted-foreground">需要更新</div>
                  </div>
                </div>
                
                <Button
                  onClick={handleBatchUpdate}
                  disabled={updating}
                  className="w-full"
                  size="lg"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      批量更新所有价格
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-muted-foreground">
                  <p>• 批量更新将从数据源获取最新价格</p>
                  <p>• 更新过程可能需要几秒钟时间</p>
                  <p>• 建议每5-10分钟更新一次</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    选择资产
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assets.map(asset => (
                      <Button
                        key={asset.id}
                        variant={selectedAsset === asset.symbol ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedAsset(asset.symbol)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>价格历史 (30天)</CardTitle>
                  {selectedAsset && (
                    <CardDescription>
                      {selectedAsset} 的价格变化记录
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedAsset ? (
                    priceHistory.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {priceHistory.map((record, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm">{record.date}</span>
                            <span className="font-medium">¥{(record.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>暂无价格历史记录</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>请选择一个资产查看价格历史</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}