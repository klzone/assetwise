'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { StockPortfolio, StockHolding } from '@/types/portfolio.types';

interface StockPortfolioDetailProps {
  portfolio: StockPortfolio;
  onAddStock: (stock: Omit<StockHolding, 'id'>) => void;
  onUpdatePortfolio: (portfolio: StockPortfolio) => void;
}

export function StockPortfolioDetail({ 
  portfolio, 
  onAddStock, 
  onUpdatePortfolio 
}: StockPortfolioDetailProps) {
  const [showAddStockDialog, setShowAddStockDialog] = useState(false);
  const [showEditStockDialog, setShowEditStockDialog] = useState(false);
  const [editingStock, setEditingStock] = useState<StockHolding | null>(null);
  const [newStock, setNewStock] = useState({
    code: '',
    name: '',
    currentPrice: '',
    holdingAmount: '',
    shares: '',
    costPrice: '',
    peRatio: '',
    pbRatio: '',
    dividendYield: '',
    sector: '',
    exchange: 'SH' // 默认上海证券交易所
  });

  const addStock = () => {
    if (!newStock.code || !newStock.name || !newStock.currentPrice || !newStock.holdingAmount) {
      alert('请填写完整的股票信息');
      return;
    }

    const currentPrice = parseFloat(newStock.currentPrice);
    const holdingAmount = parseFloat(newStock.holdingAmount);
    const shares = newStock.shares ? parseFloat(newStock.shares) : holdingAmount / currentPrice;
    const costPrice = newStock.costPrice ? parseFloat(newStock.costPrice) : currentPrice;
    const marketValue = shares * currentPrice;
    
    const stock: Omit<StockHolding, 'id'> = {
      code: newStock.code,
      name: newStock.name,
      assetType: 'stock',
      currentPrice,
      holdingAmount,
      marketValue,
      shares,
      costPrice,
      profit: marketValue - (shares * costPrice),
      profitRate: costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0,
      peRatio: newStock.peRatio ? parseFloat(newStock.peRatio) : undefined,
      pbRatio: newStock.pbRatio ? parseFloat(newStock.pbRatio) : undefined,
      dividendYield: newStock.dividendYield ? parseFloat(newStock.dividendYield) : undefined,
      sector: newStock.sector || undefined,
      exchange: newStock.exchange || undefined
    };

    onAddStock(stock);
    
    setNewStock({
      code: '',
      name: '',
      currentPrice: '',
      holdingAmount: '',
      shares: '',
      costPrice: '',
      peRatio: '',
      pbRatio: '',
      dividendYield: '',
      sector: '',
      exchange: 'SH'
    });
    setShowAddStockDialog(false);
  };

  const editStock = (stock: StockHolding) => {
    setEditingStock(stock);
    setNewStock({
      code: stock.code,
      name: stock.name,
      currentPrice: stock.currentPrice.toString(),
      holdingAmount: stock.holdingAmount.toString(),
      shares: stock.shares?.toString() || '',
      costPrice: stock.costPrice?.toString() || '',
      peRatio: stock.peRatio?.toString() || '',
      pbRatio: stock.pbRatio?.toString() || '',
      dividendYield: stock.dividendYield?.toString() || '',
      sector: stock.sector || '',
      exchange: stock.exchange || 'SH'
    });
    setShowEditStockDialog(true);
  };

  const updateStock = () => {
    if (!editingStock || !newStock.code || !newStock.name || !newStock.currentPrice || !newStock.holdingAmount) {
      alert('请填写完整的股票信息');
      return;
    }

    const currentPrice = parseFloat(newStock.currentPrice);
    const holdingAmount = parseFloat(newStock.holdingAmount);
    const shares = newStock.shares ? parseFloat(newStock.shares) : holdingAmount / currentPrice;
    const costPrice = newStock.costPrice ? parseFloat(newStock.costPrice) : currentPrice;
    const marketValue = shares * currentPrice;
    
    const updatedHolding: StockHolding = {
      ...editingStock,
      code: newStock.code,
      name: newStock.name,
      currentPrice,
      holdingAmount,
      marketValue,
      shares,
      costPrice,
      profit: marketValue - (shares * costPrice),
      profitRate: costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0,
      peRatio: newStock.peRatio ? parseFloat(newStock.peRatio) : undefined,
      pbRatio: newStock.pbRatio ? parseFloat(newStock.pbRatio) : undefined,
      dividendYield: newStock.dividendYield ? parseFloat(newStock.dividendYield) : undefined,
      sector: newStock.sector || undefined,
      exchange: newStock.exchange || undefined
    };

    const updatedPortfolio: StockPortfolio = {
      ...portfolio,
      holdings: portfolio.holdings.map(h => h.id === editingStock.id ? updatedHolding : h),
      updatedAt: new Date().toISOString()
    };

    // 重新计算组合总值
    recalculatePortfolio(updatedPortfolio);
    onUpdatePortfolio(updatedPortfolio);
    
    setNewStock({
      code: '',
      name: '',
      currentPrice: '',
      holdingAmount: '',
      shares: '',
      costPrice: '',
      peRatio: '',
      pbRatio: '',
      dividendYield: '',
      sector: '',
      exchange: 'SH'
    });
    setEditingStock(null);
    setShowEditStockDialog(false);
  };

  const deleteStock = (stockId: string) => {
    if (confirm('确定要删除这只股票吗？')) {
      const updatedPortfolio: StockPortfolio = {
        ...portfolio,
        holdings: portfolio.holdings.filter(h => h.id !== stockId),
        updatedAt: new Date().toISOString()
      };

      // 重新计算组合总值
      recalculatePortfolio(updatedPortfolio);
      onUpdatePortfolio(updatedPortfolio);
    }
  };

  const recalculatePortfolio = (portfolio: StockPortfolio) => {
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

  const getSectorColor = (sector?: string) => {
    const colors: Record<string, string> = {
      '科技': 'bg-blue-100 text-blue-800',
      '金融': 'bg-green-100 text-green-800',
      '医药': 'bg-red-100 text-red-800',
      '消费': 'bg-purple-100 text-purple-800',
      '制造': 'bg-orange-100 text-orange-800',
      '能源': 'bg-yellow-100 text-yellow-800',
      '房地产': 'bg-gray-100 text-gray-800'
    };
    return colors[sector || ''] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {portfolio.name}
              <Badge variant="outline">股票组合</Badge>
            </CardTitle>
            {portfolio.description && (
              <CardDescription>{portfolio.description}</CardDescription>
            )}
          </div>
          <Dialog open={showAddStockDialog} onOpenChange={setShowAddStockDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                添加股票
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加股票</DialogTitle>
                <DialogDescription>
                  向组合中添加新的股票持仓
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock-code">股票代码</Label>
                    <Input
                      id="stock-code"
                      placeholder="000001"
                      value={newStock.code}
                      onChange={(e) => setNewStock({...newStock, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock-name">股票名称</Label>
                    <Input
                      id="stock-name"
                      placeholder="平安银行"
                      value={newStock.name}
                      onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="current-price">当前价格</Label>
                    <Input
                      id="current-price"
                      type="number"
                      step="0.01"
                      placeholder="12.50"
                      value={newStock.currentPrice}
                      onChange={(e) => setNewStock({...newStock, currentPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="holding-amount">持有金额</Label>
                    <Input
                      id="holding-amount"
                      type="number"
                      placeholder="10000"
                      value={newStock.holdingAmount}
                      onChange={(e) => setNewStock({...newStock, holdingAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shares">持有股数</Label>
                    <Input
                      id="shares"
                      type="number"
                      placeholder="800"
                      value={newStock.shares}
                      onChange={(e) => setNewStock({...newStock, shares: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost-price">成本价格</Label>
                    <Input
                      id="cost-price"
                      type="number"
                      step="0.01"
                      placeholder="11.80"
                      value={newStock.costPrice}
                      onChange={(e) => setNewStock({...newStock, costPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exchange">交易所</Label>
                    <Select value={newStock.exchange} onValueChange={(value) => setNewStock({...newStock, exchange: value})}>
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pe-ratio">市盈率</Label>
                    <Input
                      id="pe-ratio"
                      type="number"
                      step="0.01"
                      placeholder="15.6"
                      value={newStock.peRatio}
                      onChange={(e) => setNewStock({...newStock, peRatio: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pb-ratio">市净率</Label>
                    <Input
                      id="pb-ratio"
                      type="number"
                      step="0.01"
                      placeholder="1.2"
                      value={newStock.pbRatio}
                      onChange={(e) => setNewStock({...newStock, pbRatio: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dividend-yield">股息率(%)</Label>
                    <Input
                      id="dividend-yield"
                      type="number"
                      step="0.01"
                      placeholder="3.5"
                      value={newStock.dividendYield}
                      onChange={(e) => setNewStock({...newStock, dividendYield: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sector">行业</Label>
                  <Select value={newStock.sector} onValueChange={(value) => setNewStock({...newStock, sector: value})}>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddStockDialog(false)}>
                  取消
                </Button>
                <Button onClick={addStock}>
                  添加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 编辑股票对话框 */}
          <Dialog open={showEditStockDialog} onOpenChange={setShowEditStockDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>编辑股票</DialogTitle>
                <DialogDescription>
                  修改股票持仓信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* 与添加股票相同的表单字段 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-stock-code">股票代码</Label>
                    <Input
                      id="edit-stock-code"
                      placeholder="000001"
                      value={newStock.code}
                      onChange={(e) => setNewStock({...newStock, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-stock-name">股票名称</Label>
                    <Input
                      id="edit-stock-name"
                      placeholder="平安银行"
                      value={newStock.name}
                      onChange={(e) => setNewStock({...newStock, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-current-price">当前价格</Label>
                    <Input
                      id="edit-current-price"
                      type="number"
                      step="0.01"
                      placeholder="12.50"
                      value={newStock.currentPrice}
                      onChange={(e) => setNewStock({...newStock, currentPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-holding-amount">持有金额</Label>
                    <Input
                      id="edit-holding-amount"
                      type="number"
                      placeholder="10000"
                      value={newStock.holdingAmount}
                      onChange={(e) => setNewStock({...newStock, holdingAmount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-shares">持有股数</Label>
                    <Input
                      id="edit-shares"
                      type="number"
                      placeholder="800"
                      value={newStock.shares}
                      onChange={(e) => setNewStock({...newStock, shares: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-cost-price">成本价格</Label>
                    <Input
                      id="edit-cost-price"
                      type="number"
                      step="0.01"
                      placeholder="11.80"
                      value={newStock.costPrice}
                      onChange={(e) => setNewStock({...newStock, costPrice: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-exchange">交易所</Label>
                    <Select value={newStock.exchange} onValueChange={(value) => setNewStock({...newStock, exchange: value})}>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditStockDialog(false)}>
                  取消
                </Button>
                <Button onClick={updateStock}>
                  保存
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

        {/* 股票持仓 */}
        <div>
          <h4 className="font-medium mb-3">股票持仓</h4>
          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无股票持仓</p>
              <p className="text-sm">点击"添加股票"开始构建您的组合</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.holdings.map(holding => (
                <div key={holding.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{holding.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {holding.code}
                          {holding.exchange && (
                            <Badge variant="outline" className="text-xs">
                              {holding.exchange}
                            </Badge>
                          )}
                          {holding.sector && (
                            <Badge className={`text-xs ${getSectorColor(holding.sector)}`}>
                              {holding.sector}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editStock(holding)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteStock(holding.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">当前价格</div>
                      <div>¥{holding.currentPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">持有金额</div>
                      <div>¥{holding.holdingAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">持有股数</div>
                      <div>{holding.shares?.toFixed(0) || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">权重</div>
                      <div>{holding.weight?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                  {holding.peRatio && (
                    <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                      <div>
                        <div className="text-muted-foreground">市盈率</div>
                        <div>{holding.peRatio.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">市净率</div>
                        <div>{holding.pbRatio?.toFixed(2) || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">股息率</div>
                        <div>{holding.dividendYield?.toFixed(2) || '-'}%</div>
                      </div>
                    </div>
                  )}
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