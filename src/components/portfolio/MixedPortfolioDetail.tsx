'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EditIcon, TrashIcon, TrendingUpIcon, PieChartIcon } from 'lucide-react';
import { MixedPortfolio, Holding, AssetType, FundHolding, StockHolding } from '@/types/portfolio.types';

interface MixedPortfolioDetailProps {
  portfolio: MixedPortfolio;
  onAddAsset: (asset: Omit<Holding, 'id'>) => void;
  onUpdatePortfolio: (portfolio: MixedPortfolio) => void;
}

export function MixedPortfolioDetail({ 
  portfolio, 
  onAddAsset, 
  onUpdatePortfolio 
}: MixedPortfolioDetailProps) {
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false);
  const [showEditAssetDialog, setShowEditAssetDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Holding | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>('fund');
  const [newAsset, setNewAsset] = useState({
    code: '',
    name: '',
    assetType: 'fund' as AssetType,
    holdingAmount: '',
    shares: '',
    costPrice: '',
    // 基金字段
    nav: '',
    fundType: '',
    fundCompany: '',
    // 股票字段
    currentPrice: '',
    peRatio: '',
    pbRatio: '',
    dividendYield: '',
    sector: '',
    exchange: 'SH'
  });

  const resetForm = () => {
    setNewAsset({
      code: '',
      name: '',
      assetType: 'fund',
      holdingAmount: '',
      shares: '',
      costPrice: '',
      nav: '',
      fundType: '',
      fundCompany: '',
      currentPrice: '',
      peRatio: '',
      pbRatio: '',
      dividendYield: '',
      sector: '',
      exchange: 'SH'
    });
    setSelectedAssetType('fund');
  };

  const addAsset = () => {
    if (!newAsset.code || !newAsset.name || !newAsset.holdingAmount) {
      alert('请填写完整的资产信息');
      return;
    }

    const holdingAmount = parseFloat(newAsset.holdingAmount);
    let asset: Omit<Holding, 'id'>;

    if (selectedAssetType === 'fund') {
      if (!newAsset.nav) {
        alert('请填写基金净值');
        return;
      }
      const nav = parseFloat(newAsset.nav);
      const shares = newAsset.shares ? parseFloat(newAsset.shares) : holdingAmount / nav;
      const costPrice = newAsset.costPrice ? parseFloat(newAsset.costPrice) : nav;

      asset = {
        code: newAsset.code,
        name: newAsset.name,
        assetType: 'fund',
        nav,
        holdingAmount,
        shares,
        costPrice,
        profit: holdingAmount - (shares * costPrice),
        profitRate: costPrice > 0 ? ((nav - costPrice) / costPrice) * 100 : 0
      } as FundHolding;
    } else if (selectedAssetType === 'stock') {
      if (!newAsset.currentPrice) {
        alert('请填写股票当前价格');
        return;
      }
      const currentPrice = parseFloat(newAsset.currentPrice);
      const shares = newAsset.shares ? parseFloat(newAsset.shares) : holdingAmount / currentPrice;
      const costPrice = newAsset.costPrice ? parseFloat(newAsset.costPrice) : currentPrice;
      const marketValue = shares * currentPrice;

      asset = {
        code: newAsset.code,
        name: newAsset.name,
        assetType: 'stock',
        currentPrice,
        holdingAmount,
        marketValue,
        shares,
        costPrice,
        profit: marketValue - (shares * costPrice),
        profitRate: costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0,
        peRatio: newAsset.peRatio ? parseFloat(newAsset.peRatio) : undefined,
        pbRatio: newAsset.pbRatio ? parseFloat(newAsset.pbRatio) : undefined,
        dividendYield: newAsset.dividendYield ? parseFloat(newAsset.dividendYield) : undefined,
        sector: newAsset.sector || undefined,
        exchange: newAsset.exchange || undefined
      } as StockHolding;
    } else {
      // 其他资产类型
      const costPrice = newAsset.costPrice ? parseFloat(newAsset.costPrice) : 1;
      asset = {
        code: newAsset.code,
        name: newAsset.name,
        assetType: selectedAssetType,
        holdingAmount,
        costPrice,
        profit: 0,
        profitRate: 0
      } as Holding;
    }

    onAddAsset(asset);
    resetForm();
    setShowAddAssetDialog(false);
  };

  const editAsset = (asset: Holding) => {
    setEditingAsset(asset);
    setSelectedAssetType(asset.assetType);
    
    if (asset.assetType === 'fund') {
      const fundAsset = asset as FundHolding;
      setNewAsset({
        code: fundAsset.code,
        name: fundAsset.name,
        assetType: 'fund',
        holdingAmount: fundAsset.holdingAmount.toString(),
        shares: fundAsset.shares?.toString() || '',
        costPrice: fundAsset.costPrice?.toString() || '',
        nav: fundAsset.nav.toString(),
        fundType: '',
        fundCompany: '',
        currentPrice: '',
        peRatio: '',
        pbRatio: '',
        dividendYield: '',
        sector: '',
        exchange: 'SH'
      });
    } else if (asset.assetType === 'stock') {
      const stockAsset = asset as StockHolding;
      setNewAsset({
        code: stockAsset.code,
        name: stockAsset.name,
        assetType: 'stock',
        holdingAmount: stockAsset.holdingAmount.toString(),
        shares: stockAsset.shares?.toString() || '',
        costPrice: stockAsset.costPrice?.toString() || '',
        nav: '',
        fundType: '',
        fundCompany: '',
        currentPrice: stockAsset.currentPrice.toString(),
        peRatio: stockAsset.peRatio?.toString() || '',
        pbRatio: stockAsset.pbRatio?.toString() || '',
        dividendYield: stockAsset.dividendYield?.toString() || '',
        sector: stockAsset.sector || '',
        exchange: stockAsset.exchange || 'SH'
      });
    }
    
    setShowEditAssetDialog(true);
  };

  const updateAsset = () => {
    if (!editingAsset || !newAsset.code || !newAsset.name || !newAsset.holdingAmount) {
      alert('请填写完整的资产信息');
      return;
    }

    const holdingAmount = parseFloat(newAsset.holdingAmount);
    let updatedAsset: Holding;

    if (selectedAssetType === 'fund') {
      if (!newAsset.nav) {
        alert('请填写基金净值');
        return;
      }
      const nav = parseFloat(newAsset.nav);
      const shares = newAsset.shares ? parseFloat(newAsset.shares) : holdingAmount / nav;
      const costPrice = newAsset.costPrice ? parseFloat(newAsset.costPrice) : nav;

      updatedAsset = {
        ...editingAsset,
        code: newAsset.code,
        name: newAsset.name,
        assetType: 'fund',
        nav,
        holdingAmount,
        shares,
        costPrice,
        profit: holdingAmount - (shares * costPrice),
        profitRate: costPrice > 0 ? ((nav - costPrice) / costPrice) * 100 : 0
      } as FundHolding;
    } else if (selectedAssetType === 'stock') {
      if (!newAsset.currentPrice) {
        alert('请填写股票当前价格');
        return;
      }
      const currentPrice = parseFloat(newAsset.currentPrice);
      const shares = newAsset.shares ? parseFloat(newAsset.shares) : holdingAmount / currentPrice;
      const costPrice = newAsset.costPrice ? parseFloat(newAsset.costPrice) : currentPrice;
      const marketValue = shares * currentPrice;

      updatedAsset = {
        ...editingAsset,
        code: newAsset.code,
        name: newAsset.name,
        assetType: 'stock',
        currentPrice,
        holdingAmount,
        marketValue,
        shares,
        costPrice,
        profit: marketValue - (shares * costPrice),
        profitRate: costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0,
        peRatio: newAsset.peRatio ? parseFloat(newAsset.peRatio) : undefined,
        pbRatio: newAsset.pbRatio ? parseFloat(newAsset.pbRatio) : undefined,
        dividendYield: newAsset.dividendYield ? parseFloat(newAsset.dividendYield) : undefined,
        sector: newAsset.sector || undefined,
        exchange: newAsset.exchange || undefined
      } as StockHolding;
    } else {
      const costPrice = newAsset.costPrice ? parseFloat(newAsset.costPrice) : 1;
      updatedAsset = {
        ...editingAsset,
        code: newAsset.code,
        name: newAsset.name,
        assetType: selectedAssetType,
        holdingAmount,
        costPrice,
        profit: 0,
        profitRate: 0
      } as Holding;
    }

    const updatedPortfolio: MixedPortfolio = {
      ...portfolio,
      holdings: portfolio.holdings.map(h => h.id === editingAsset.id ? updatedAsset : h),
      updatedAt: new Date().toISOString()
    };

    recalculatePortfolio(updatedPortfolio);
    onUpdatePortfolio(updatedPortfolio);
    
    resetForm();
    setEditingAsset(null);
    setShowEditAssetDialog(false);
  };

  const deleteAsset = (assetId: string) => {
    if (confirm('确定要删除这个资产吗？')) {
      const updatedPortfolio: MixedPortfolio = {
        ...portfolio,
        holdings: portfolio.holdings.filter(h => h.id !== assetId),
        updatedAt: new Date().toISOString()
      };

      recalculatePortfolio(updatedPortfolio);
      onUpdatePortfolio(updatedPortfolio);
    }
  };

  const recalculatePortfolio = (portfolio: MixedPortfolio) => {
    let totalValue = 0;
    let totalProfit = 0;
    
    portfolio.holdings.forEach(holding => {
      totalValue += holding.holdingAmount;
      if (holding.profit) {
        totalProfit += holding.profit;
      }
    });
    
    portfolio.totalValue = totalValue;
    portfolio.totalProfit = totalProfit;
    portfolio.totalProfitRate = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;
    
    // 计算权重
    portfolio.holdings.forEach(holding => {
      holding.weight = totalValue > 0 ? (holding.holdingAmount / totalValue) * 100 : 0;
    });
  };

  const getAssetTypeColor = (assetType: AssetType) => {
    const colors: Record<AssetType, string> = {
      fund: 'bg-blue-100 text-blue-800',
      stock: 'bg-green-100 text-green-800',
      bond: 'bg-purple-100 text-purple-800',
      crypto: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[assetType] || 'bg-gray-100 text-gray-800';
  };

  const getAssetTypeName = (assetType: AssetType) => {
    const names: Record<AssetType, string> = {
      fund: '基金',
      stock: '股票',
      bond: '债券',
      crypto: '数字货币',
      other: '其他'
    };
    return names[assetType] || '未知';
  };

  // 计算资产分布
  const assetDistribution = portfolio.holdings.reduce((acc, holding) => {
    acc[holding.assetType] = (acc[holding.assetType] || 0) + holding.holdingAmount;
    return acc;
  }, {} as Record<AssetType, number>);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {portfolio.name}
              <Badge variant="outline">混合组合</Badge>
            </CardTitle>
            {portfolio.description && (
              <CardDescription>{portfolio.description}</CardDescription>
            )}
          </div>
          <Dialog open={showAddAssetDialog} onOpenChange={setShowAddAssetDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                添加资产
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加资产</DialogTitle>
                <DialogDescription>
                  向混合组合中添加新的资产持仓
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="asset-type">资产类型</Label>
                  <Select value={selectedAssetType} onValueChange={(value: AssetType) => setSelectedAssetType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fund">基金</SelectItem>
                      <SelectItem value="stock">股票</SelectItem>
                      <SelectItem value="bond">债券</SelectItem>
                      <SelectItem value="crypto">数字货币</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="asset-code">代码</Label>
                    <Input
                      id="asset-code"
                      placeholder="000001"
                      value={newAsset.code}
                      onChange={(e) => setNewAsset({...newAsset, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="asset-name">名称</Label>
                    <Input
                      id="asset-name"
                      placeholder="资产名称"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="holding-amount">持有金额</Label>
                    <Input
                      id="holding-amount"
                      type="number"
                      placeholder="10000"
                      value={newAsset.holdingAmount}
                      onChange={(e) => setNewAsset({...newAsset, holdingAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost-price">成本价格</Label>
                    <Input
                      id="cost-price"
                      type="number"
                      step="0.01"
                      placeholder="成本价格"
                      value={newAsset.costPrice}
                      onChange={(e) => setNewAsset({...newAsset, costPrice: e.target.value})}
                    />
                  </div>
                </div>

                {/* 基金特有字段 */}
                {selectedAssetType === 'fund' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nav">净值</Label>
                      <Input
                        id="nav"
                        type="number"
                        step="0.0001"
                        placeholder="1.5420"
                        value={newAsset.nav}
                        onChange={(e) => setNewAsset({...newAsset, nav: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="shares">持有份额</Label>
                      <Input
                        id="shares"
                        type="number"
                        placeholder="6500"
                        value={newAsset.shares}
                        onChange={(e) => setNewAsset({...newAsset, shares: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* 股票特有字段 */}
                {selectedAssetType === 'stock' && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="current-price">当前价格</Label>
                        <Input
                          id="current-price"
                          type="number"
                          step="0.01"
                          placeholder="12.50"
                          value={newAsset.currentPrice}
                          onChange={(e) => setNewAsset({...newAsset, currentPrice: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shares">持有股数</Label>
                        <Input
                          id="shares"
                          type="number"
                          placeholder="800"
                          value={newAsset.shares}
                          onChange={(e) => setNewAsset({...newAsset, shares: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="exchange">交易所</Label>
                        <Select value={newAsset.exchange} onValueChange={(value) => setNewAsset({...newAsset, exchange: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SH">上海证券交易所</SelectItem>
                            <SelectItem value="SZ">深圳证券交易所</SelectItem>
                            <SelectItem value="BJ">北京证券交易所</SelectItem>
                            <SelectItem value="HK">香港交易所</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="sector">行业</Label>
                      <Select value={newAsset.sector} onValueChange={(value) => setNewAsset({...newAsset, sector: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择行业" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="科技">科技</SelectItem>
                          <SelectItem value="金融">金融</SelectItem>
                          <SelectItem value="医药">医药</SelectItem>
                          <SelectItem value="消费">消费</SelectItem>
                          <SelectItem value="制造">制造</SelectItem>
                          <SelectItem value="能源">能源</SelectItem>
                          <SelectItem value="房地产">房地产</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddAssetDialog(false)}>
                  取消
                </Button>
                <Button onClick={addAsset}>
                  添加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* 组合统计 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">总资产</div>
            <div className="text-lg font-semibold">¥{portfolio.totalValue.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">总盈亏</div>
            <div className={`text-lg font-semibold ${portfolio.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {portfolio.totalProfit >= 0 ? '+' : ''}¥{portfolio.totalProfit.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">收益率</div>
            <div className={`text-lg font-semibold ${portfolio.totalProfitRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {portfolio.totalProfitRate >= 0 ? '+' : ''}{portfolio.totalProfitRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 资产分布 */}
        {Object.keys(assetDistribution).length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              资产分布
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(assetDistribution).map(([assetType, value]) => (
                <div key={assetType} className="text-center p-2 border rounded">
                  <Badge className={`text-xs ${getAssetTypeColor(assetType as AssetType)}`}>
                    {getAssetTypeName(assetType as AssetType)}
                  </Badge>
                  <div className="text-sm font-medium mt-1">
                    ¥{value.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((value / portfolio.totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 资产持仓 */}
        <div>
          <h4 className="font-medium mb-3">资产持仓</h4>
          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无资产持仓</p>
              <p className="text-sm">点击"添加资产"开始构建您的混合组合</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.holdings.map(holding => (
                <div key={holding.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {holding.name}
                          <Badge className={`text-xs ${getAssetTypeColor(holding.assetType)}`}>
                            {getAssetTypeName(holding.assetType)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {holding.code}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editAsset(holding)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAsset(holding.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">
                        {holding.assetType === 'fund' ? '净值' : 
                         holding.assetType === 'stock' ? '当前价格' : '价格'}
                      </div>
                      <div>
                        ¥{holding.assetType === 'fund' 
                          ? (holding as FundHolding).nav.toFixed(4)
                          : holding.assetType === 'stock'
                          ? (holding as StockHolding).currentPrice.toFixed(2)
                          : (holding.costPrice || 0).toFixed(2)
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">持有金额</div>
                      <div>¥{holding.holdingAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        {holding.assetType === 'fund' ? '份额' : 
                         holding.assetType === 'stock' ? '股数' : '数量'}
                      </div>
                      <div>{holding.shares?.toFixed(holding.assetType === 'stock' ? 0 : 2) || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">权重</div>
                      <div>{holding.weight?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                  {holding.profit !== undefined && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>盈亏:</span>
                        <span className={holding.profit >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {holding.profit >= 0 ? '+' : ''}¥{holding.profit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>收益率:</span>
                        <span className={holding.profitRate && holding.profitRate >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {holding.profitRate && holding.profitRate >= 0 ? '+' : ''}{holding.profitRate?.toFixed(2) || 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}