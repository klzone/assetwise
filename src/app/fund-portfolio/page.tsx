'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  InfoIcon,
  CloudIcon,
  RefreshCwIcon,
  LinkIcon,
  DownloadIcon
} from 'lucide-react';
import { PortfolioSyncService } from '@/lib/services/portfolio-sync.service';
import { TiantianFundImportService } from '@/lib/services/tiantian-fund-import.service';
import { Portfolio, FundPortfolio, StockPortfolio, MixedPortfolio, PortfolioType, Holding, FundHolding, StockHolding } from '@/types/portfolio.types';
import { StockPortfolioDetail } from '@/components/portfolio/StockPortfolioDetail';
import { MixedPortfolioDetail } from '@/components/portfolio/MixedPortfolioDetail';

export default function FundPortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateFundDialog, setShowCreateFundDialog] = useState(false);
  const [showCreateStockDialog, setShowCreateStockDialog] = useState(false);
  const [showCreateMixedDialog, setShowCreateMixedDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [newPortfolioType, setNewPortfolioType] = useState<PortfolioType>('fund');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncService] = useState(() => new PortfolioSyncService());
  const [tiantianService] = useState(() => new TiantianFundImportService());
  const [showTiantianDialog, setShowTiantianDialog] = useState(false);
  const [tiantianUrl, setTiantianUrl] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = () => {
    try {
      const stored = localStorage.getItem('fund_portfolios');
      if (stored) {
        setPortfolios(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载投资组合失败:', error);
    }
  };

  const savePortfolios = (updatedPortfolios: Portfolio[]) => {
    try {
      localStorage.setItem('fund_portfolios', JSON.stringify(updatedPortfolios));
      setPortfolios(updatedPortfolios);
    } catch (error) {
      console.error('保存投资组合失败:', error);
      showMessage('error', '保存失败');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const syncToCloud = async () => {
    setIsLoading(true);
    try {
      const result = await syncService.syncToCloud(portfolios);
      if (result.success) {
        showMessage('success', '数据已同步到云端');
      } else {
        showMessage('error', result.message || '同步到云端失败');
      }
    } catch (error) {
      console.error('同步到云端失败:', error);
      showMessage('error', '同步到云端失败');
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromCloud = async () => {
    setIsLoading(true);
    try {
      const result = await syncService.syncFromCloud();
      if (result.success && result.data) {
        setPortfolios(result.data);
        localStorage.setItem('fund_portfolios', JSON.stringify(result.data));
        showMessage('success', `已从云端同步 ${result.data.length} 个组合`);
      } else {
        showMessage('error', result.message || '从云端同步失败');
      }
    } catch (error) {
      console.error('从云端同步失败:', error);
      showMessage('error', '从云端同步失败');
    } finally {
      setIsLoading(false);
    }
  };

  const createPortfolio = () => {
    if (!newPortfolioName.trim()) {
      showMessage('error', '请输入组合名称');
      return;
    }

    // 检查名称是否重复
    if (portfolios.some(p => p.name === newPortfolioName.trim())) {
      showMessage('error', '组合名称已存在');
      return;
    }

    const newPortfolio: Portfolio = {
      id: `portfolio_${Date.now()}`,
      name: newPortfolioName.trim(),
      description: newPortfolioDesc.trim(),
      portfolioType: newPortfolioType,
      totalValue: 0,
      totalProfit: 0,
      totalProfitRate: 0,
      holdings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPortfolios = [...portfolios, newPortfolio];
    savePortfolios(updatedPortfolios);
    
    setNewPortfolioName('');
    setNewPortfolioDesc('');
    setShowCreateFundDialog(false);
    setShowCreateStockDialog(false);
    setShowCreateMixedDialog(false);
    
    const typeName = newPortfolioType === 'fund' ? '基金' : 
                     newPortfolioType === 'stock' ? '股票' : '混合';
    showMessage('success', `${typeName}组合创建成功`);
  };

  const editPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setNewPortfolioName(portfolio.name);
    setNewPortfolioDesc(portfolio.description || '');
    setShowEditDialog(true);
  };

  const updatePortfolio = () => {
    if (!newPortfolioName.trim()) {
      showMessage('error', '请输入组合名称');
      return;
    }

    if (!editingPortfolio) return;

    // 检查名称是否与其他组合重复
    if (portfolios.some(p => p.id !== editingPortfolio.id && p.name === newPortfolioName.trim())) {
      showMessage('error', '组合名称已存在');
      return;
    }

    const updatedPortfolios = portfolios.map(p => 
      p.id === editingPortfolio.id 
        ? { ...p, name: newPortfolioName.trim(), description: newPortfolioDesc.trim(), updatedAt: new Date().toISOString() }
        : p
    );

    savePortfolios(updatedPortfolios);
    
    if (selectedPortfolio?.id === editingPortfolio.id) {
      setSelectedPortfolio(updatedPortfolios.find(p => p.id === editingPortfolio.id) || null);
    }
    
    setNewPortfolioName('');
    setNewPortfolioDesc('');
    setEditingPortfolio(null);
    setShowEditDialog(false);
    showMessage('success', '基金组合已更新');
  };

  const deletePortfolio = (portfolioId: string) => {
    if (confirm('确定要删除这个基金组合吗？')) {
      const updatedPortfolios = portfolios.filter(p => p.id !== portfolioId);
      savePortfolios(updatedPortfolios);
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(null);
      }
      showMessage('success', '基金组合已删除');
    }
  };

  const addFundToPortfolio = (portfolioId: string, fund: Omit<FundHolding, 'id'>) => {
    const updatedPortfolios = portfolios.map(portfolio => {
      if (portfolio.id === portfolioId) {
        const newHolding: FundHolding = {
          ...fund,
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        const updatedHoldings = [...portfolio.holdings, newHolding];
        const updatedPortfolio = {
          ...portfolio,
          holdings: updatedHoldings,
          updatedAt: new Date().toISOString()
        };
        
        // 重新计算组合总值
        recalculatePortfolio(updatedPortfolio);
        return updatedPortfolio;
      }
      return portfolio;
    });
    
    savePortfolios(updatedPortfolios);
    
    // 更新选中的组合
    if (selectedPortfolio?.id === portfolioId) {
      setSelectedPortfolio(updatedPortfolios.find(p => p.id === portfolioId) || null);
    }
  };

  const addStockToPortfolio = (portfolioId: string, stock: Omit<StockHolding, 'id'>) => {
    const updatedPortfolios = portfolios.map(portfolio => {
      if (portfolio.id === portfolioId) {
        const newHolding: StockHolding = {
          ...stock,
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        const updatedHoldings = [...portfolio.holdings, newHolding];
        const updatedPortfolio = {
          ...portfolio,
          holdings: updatedHoldings,
          updatedAt: new Date().toISOString()
        };
        
        // 重新计算组合总值
        recalculateStockPortfolio(updatedPortfolio as StockPortfolio);
        return updatedPortfolio;
      }
      return portfolio;
    });
    
    savePortfolios(updatedPortfolios);
    
    // 更新选中的组合
    if (selectedPortfolio?.id === portfolioId) {
      setSelectedPortfolio(updatedPortfolios.find(p => p.id === portfolioId) || null);
    }
  };

  const addHoldingToPortfolio = (portfolioId: string, holding: Omit<Holding, 'id'>) => {
    const updatedPortfolios = portfolios.map(portfolio => {
      if (portfolio.id === portfolioId) {
        const newHolding: Holding = {
          ...holding,
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        const updatedHoldings = [...portfolio.holdings, newHolding];
        const updatedPortfolio = {
          ...portfolio,
          holdings: updatedHoldings,
          updatedAt: new Date().toISOString()
        };
        
        // 重新计算组合总值
        recalculateMixedPortfolio(updatedPortfolio as MixedPortfolio);
        return updatedPortfolio;
      }
      return portfolio;
    });
    
    savePortfolios(updatedPortfolios);
    
    // 更新选中的组合
    if (selectedPortfolio?.id === portfolioId) {
      setSelectedPortfolio(updatedPortfolios.find(p => p.id === portfolioId) || null);
    }
  };

  const recalculatePortfolio = (portfolio: FundPortfolio) => {
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

  const recalculateStockPortfolio = (portfolio: StockPortfolio) => {
    let totalValue = 0;
    let totalProfit = 0;
    
    portfolio.holdings.forEach(holding => {
      const marketValue = holding.currentPrice * holding.shares;
      totalValue += marketValue;
      if (holding.profit) {
        totalProfit += holding.profit;
      }
    });
    
    portfolio.totalValue = totalValue;
    portfolio.totalProfit = totalProfit;
    portfolio.totalProfitRate = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;
    
    // 计算权重
    portfolio.holdings.forEach(holding => {
      const marketValue = holding.currentPrice * holding.shares;
      holding.weight = totalValue > 0 ? (marketValue / totalValue) * 100 : 0;
    });
  };

  const recalculateMixedPortfolio = (portfolio: MixedPortfolio) => {
    let totalValue = 0;
    let totalProfit = 0;
    
    portfolio.holdings.forEach(holding => {
      if (holding.assetType === 'fund') {
        const fundHolding = holding as FundHolding;
        totalValue += fundHolding.holdingAmount;
        if (fundHolding.profit) {
          totalProfit += fundHolding.profit;
        }
      } else if (holding.assetType === 'stock') {
        const stockHolding = holding as StockHolding;
        const marketValue = stockHolding.currentPrice * stockHolding.shares;
        totalValue += marketValue;
        if (stockHolding.profit) {
          totalProfit += stockHolding.profit;
        }
      }
    });
    
    portfolio.totalValue = totalValue;
    portfolio.totalProfit = totalProfit;
    portfolio.totalProfitRate = totalValue > 0 ? (totalProfit / (totalValue - totalProfit)) * 100 : 0;
    
    // 计算权重
    portfolio.holdings.forEach(holding => {
      let holdingValue = 0;
      if (holding.assetType === 'fund') {
        const fundHolding = holding as FundHolding;
        holdingValue = fundHolding.holdingAmount;
      } else if (holding.assetType === 'stock') {
        const stockHolding = holding as StockHolding;
        holdingValue = stockHolding.currentPrice * stockHolding.shares;
      }
      holding.weight = totalValue > 0 ? (holdingValue / totalValue) * 100 : 0;
    });
  };


  const importFromTiantianUrl = async () => {
    if (!tiantianUrl.trim()) {
      showMessage('error', '请输入天天基金组合链接');
      return;
    }

    if (!tiantianService.validateTiantianUrl(tiantianUrl)) {
      showMessage('error', '请输入有效的天天基金组合链接');
      return;
    }

    setIsLoading(true);
    try {
      const tiantianData = await tiantianService.importFromUrl(tiantianUrl);
      const assetWisePortfolio = tiantianService.convertToAssetWiseFormat(tiantianData);
      
      // 检查是否已存在相同的组合
      const existingPortfolio = portfolios.find(p => p.id === assetWisePortfolio.id);
      if (existingPortfolio) {
        // 更新现有组合
        const updatedPortfolios = portfolios.map(p => 
          p.id === assetWisePortfolio.id ? assetWisePortfolio : p
        );
        savePortfolios(updatedPortfolios);
        showMessage('success', '天天基金组合已更新');
      } else {
        // 添加新组合
        const updatedPortfolios = [...portfolios, assetWisePortfolio];
        savePortfolios(updatedPortfolios);
        showMessage('success', '天天基金组合导入成功');
      }
      
      setTiantianUrl('');
      setShowTiantianDialog(false);
    } catch (error) {
      console.error('导入天天基金组合失败:', error);
      showMessage('error', '导入失败，请检查链接是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTiantianPortfolio = async (portfolio: Portfolio) => {
    if (!portfolio.tiantianUrl) {
      showMessage('error', '该组合不是从天天基金导入的');
      return;
    }

    setIsLoading(true);
    try {
      const updatedData = await tiantianService.updatePortfolioData(portfolio.tiantianUrl);
      const updatedPortfolio = tiantianService.convertToAssetWiseFormat(updatedData);
      
      const updatedPortfolios = portfolios.map(p => 
        p.id === portfolio.id ? updatedPortfolio : p
      );
      savePortfolios(updatedPortfolios);
      
      if (selectedPortfolio?.id === portfolio.id) {
        setSelectedPortfolio(updatedPortfolio);
      }
      
      showMessage('success', '组合数据已更新');
    } catch (error) {
      console.error('更新组合失败:', error);
      showMessage('error', '更新失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const totalStats = portfolios.reduce((acc, portfolio) => ({
    totalValue: acc.totalValue + portfolio.totalValue,
    totalProfit: acc.totalProfit + portfolio.totalProfit,
    count: acc.count + 1
  }), { totalValue: 0, totalProfit: 0, count: 0 });

  const totalProfitRate = totalStats.totalValue > 0 ? 
    (totalStats.totalProfit / (totalStats.totalValue - totalStats.totalProfit)) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">投资组合管理</h1>
          <p className="text-muted-foreground mt-1">管理您的投资组合</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={syncFromCloud}
            disabled={isLoading}
          >
            <CloudIcon className="h-4 w-4 mr-2" />
            {isLoading ? '同步中...' : '从云端同步'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={syncToCloud}
            disabled={isLoading}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            {isLoading ? '上传中...' : '同步到云端'}
          </Button>
          
          <Dialog open={showTiantianDialog} onOpenChange={setShowTiantianDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="h-4 w-4 mr-2" />
                天天基金导入
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>导入天天基金组合</DialogTitle>
                <DialogDescription>
                  输入天天基金组合链接，自动导入组合数据并支持一键更新净值
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tiantian-url">天天基金组合链接</Label>
                  <Input
                    id="tiantian-url"
                    placeholder="https://tradeh5.tiantianfunds.cn/tradeh5/xxx/indexindex?SubAccountNo=xxx"
                    value={tiantianUrl}
                    onChange={(e) => setTiantianUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    请复制天天基金组合详情页面的完整链接
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowTiantianDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={importFromTiantianUrl} disabled={isLoading}>
                    {isLoading ? '导入中...' : '导入组合'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                创建组合
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>选择组合类型</DialogTitle>
                <DialogDescription>
                  请选择要创建的投资组合类型
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setShowCreateFundDialog(true);
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">基金组合</div>
                      <div className="text-sm text-muted-foreground">管理基金投资组合</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewPortfolioType('stock');
                      setShowCreateStockDialog(true);
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">股票组合</div>
                      <div className="text-sm text-muted-foreground">管理股票投资组合</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewPortfolioType('mixed');
                      setShowCreateMixedDialog(true);
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">混合组合</div>
                      <div className="text-sm text-muted-foreground">管理多种资产组合</div>
                    </div>
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateFundDialog} onOpenChange={setShowCreateFundDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建基金组合</DialogTitle>
                <DialogDescription>
                  创建一个新的基金投资组合
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="portfolio-name">组合名称</Label>
                  <Input
                    id="portfolio-name"
                    placeholder="例如：稳健增长基金组合"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="portfolio-desc">组合描述（可选）</Label>
                  <Input
                    id="portfolio-desc"
                    placeholder="例如：以大盘蓝筹基金为主的稳健型组合"
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateFundDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={() => { setNewPortfolioType('fund'); createPortfolio(); }}>
                    创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 创建股票组合对话框 */}
          <Dialog open={showCreateStockDialog} onOpenChange={setShowCreateStockDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建股票组合</DialogTitle>
                <DialogDescription>
                  创建一个新的股票投资组合
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stock-portfolio-name">组合名称</Label>
                  <Input
                    id="stock-portfolio-name"
                    placeholder="例如：价值投资股票组合"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="stock-portfolio-desc">组合描述（可选）</Label>
                  <Input
                    id="stock-portfolio-desc"
                    placeholder="例如：专注于低估值蓝筹股的价值投资组合"
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateStockDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={() => { setNewPortfolioType('stock'); createPortfolio(); }}>
                    创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 创建混合组合对话框 */}
          <Dialog open={showCreateMixedDialog} onOpenChange={setShowCreateMixedDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建混合组合</DialogTitle>
                <DialogDescription>
                  创建一个包含多种资产类型的投资组合
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mixed-portfolio-name">组合名称</Label>
                  <Input
                    id="mixed-portfolio-name"
                    placeholder="例如：均衡配置混合组合"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mixed-portfolio-desc">组合描述（可选）</Label>
                  <Input
                    id="mixed-portfolio-desc"
                    placeholder="例如：股票、基金、债券等多资产均衡配置"
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateMixedDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={() => { setNewPortfolioType('mixed'); createPortfolio(); }}>
                    创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 编辑组合对话框 */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑基金组合</DialogTitle>
                <DialogDescription>
                  修改基金投资组合信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-portfolio-name">组合名称</Label>
                  <Input
                    id="edit-portfolio-name"
                    placeholder="例如：稳健增长基金组合"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-portfolio-desc">组合描述（可选）</Label>
                  <Input
                    id="edit-portfolio-desc"
                    placeholder="例如：以大盘蓝筹基金为主的稳健型组合"
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={updatePortfolio}>
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 总览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">组合数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.count}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总资产</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalStats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总盈亏</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalStats.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalStats.totalProfit >= 0 ? '+' : ''}¥{totalStats.totalProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总收益率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfitRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalProfitRate >= 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 组合列表和详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 组合列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>我的投资组合</CardTitle>
              <CardDescription>点击查看组合详情</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {portfolios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无基金组合</p>
                    <p className="text-sm">点击"创建组合"开始管理您的基金投资</p>
                  </div>
                ) : (
                  portfolios.map(portfolio => (
                    <div
                      key={portfolio.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPortfolio?.id === portfolio.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPortfolio(portfolio)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{portfolio.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {portfolio.portfolioType === 'fund' ? '基金' : 
                             portfolio.portfolioType === 'stock' ? '股票' : '混合'}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          {portfolio.tiantianUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTiantianPortfolio(portfolio);
                              }}
                              disabled={isLoading}
                              title="更新天天基金数据"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              editPortfolio(portfolio);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePortfolio(portfolio.id);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {portfolio.description && (
                        <p className="text-sm text-muted-foreground mb-2">{portfolio.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span>¥{portfolio.totalValue.toLocaleString()}</span>
                        <span className={portfolio.totalProfitRate >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {portfolio.totalProfitRate >= 0 ? '+' : ''}{portfolio.totalProfitRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {portfolio.holdings.length} 只
                        {portfolio.portfolioType === 'fund' ? '基金' : 
                         portfolio.portfolioType === 'stock' ? '股票' : '资产'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 组合详情 */}
        <div className="lg:col-span-2">
          {selectedPortfolio ? (
            <>
              {selectedPortfolio.portfolioType === 'fund' && (
                <FundPortfolioDetail 
                  portfolio={selectedPortfolio as FundPortfolio} 
                  onAddFund={(fund) => addFundToPortfolio(selectedPortfolio.id, fund)}
                  onUpdatePortfolio={(updatedPortfolio) => {
                    const updatedPortfolios = portfolios.map(p => 
                      p.id === updatedPortfolio.id ? updatedPortfolio : p
                    );
                    savePortfolios(updatedPortfolios);
                    setSelectedPortfolio(updatedPortfolio);
                  }}
                />
              )}
              {selectedPortfolio.portfolioType === 'stock' && (
                <StockPortfolioDetail 
                  portfolio={selectedPortfolio as StockPortfolio} 
                  onAddStock={(stock) => addStockToPortfolio(selectedPortfolio.id, stock)}
                  onUpdatePortfolio={(updatedPortfolio) => {
                    const updatedPortfolios = portfolios.map(p => 
                      p.id === updatedPortfolio.id ? updatedPortfolio : p
                    );
                    savePortfolios(updatedPortfolios);
                    setSelectedPortfolio(updatedPortfolio);
                  }}
                />
              )}
              {selectedPortfolio.portfolioType === 'mixed' && (
                <MixedPortfolioDetail 
                  portfolio={selectedPortfolio as MixedPortfolio} 
                  onAddHolding={(holding) => addHoldingToPortfolio(selectedPortfolio.id, holding)}
                  onUpdatePortfolio={(updatedPortfolio) => {
                    const updatedPortfolios = portfolios.map(p => 
                      p.id === updatedPortfolio.id ? updatedPortfolio : p
                    );
                    savePortfolios(updatedPortfolios);
                    setSelectedPortfolio(updatedPortfolio);
                  }}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <p>请选择一个投资组合查看详情</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// 基金组合详情组件
function FundPortfolioDetail({ 
  portfolio, 
  onAddFund, 
  onUpdatePortfolio 
}: { 
  portfolio: FundPortfolio;
  onAddFund: (fund: Omit<FundHolding, 'id'>) => void;
  onUpdatePortfolio: (portfolio: FundPortfolio) => void;
}) {
  const [showAddFundDialog, setShowAddFundDialog] = useState(false);
  const [showEditFundDialog, setShowEditFundDialog] = useState(false);
  const [editingFund, setEditingFund] = useState<FundHolding | null>(null);
  const [newFund, setNewFund] = useState({
    code: '',
    name: '',
    nav: '',
    holdingAmount: '',
    costPrice: ''
  });

  const addFund = () => {
    if (!newFund.code || !newFund.name || !newFund.nav || !newFund.holdingAmount) {
      alert('请填写完整的基金信息');
      return;
    }

    const nav = parseFloat(newFund.nav);
    const holdingAmount = parseFloat(newFund.holdingAmount);
    const costPrice = newFund.costPrice ? parseFloat(newFund.costPrice) : nav;
    
    const fund: Omit<FundHolding, 'id'> = {
      code: newFund.code,
      name: newFund.name,
      nav,
      holdingAmount,
      shares: holdingAmount / nav,
      costPrice,
      profit: holdingAmount - (holdingAmount / nav * costPrice),
      profitRate: costPrice > 0 ? ((nav - costPrice) / costPrice) * 100 : 0
    };

    onAddFund(fund);
    
    setNewFund({
      code: '',
      name: '',
      nav: '',
      holdingAmount: '',
      costPrice: ''
    });
    setShowAddFundDialog(false);
  };

  const editFund = (fund: FundHolding) => {
    setEditingFund(fund);
    setNewFund({
      code: fund.code,
      name: fund.name,
      nav: fund.nav.toString(),
      holdingAmount: fund.holdingAmount.toString(),
      costPrice: fund.costPrice?.toString() || ''
    });
    setShowEditFundDialog(true);
  };

  const updateFund = () => {
    if (!editingFund || !newFund.code || !newFund.name || !newFund.nav || !newFund.holdingAmount) {
      alert('请填写完整的基金信息');
      return;
    }

    const nav = parseFloat(newFund.nav);
    const holdingAmount = parseFloat(newFund.holdingAmount);
    const costPrice = newFund.costPrice ? parseFloat(newFund.costPrice) : nav;
    
    const updatedHolding: FundHolding = {
      ...editingFund,
      code: newFund.code,
      name: newFund.name,
      nav,
      holdingAmount,
      shares: holdingAmount / nav,
      costPrice,
      profit: holdingAmount - (holdingAmount / nav * costPrice),
      profitRate: costPrice > 0 ? ((nav - costPrice) / costPrice) * 100 : 0
    };

    const updatedPortfolio = {
      ...portfolio,
      holdings: portfolio.holdings.map(h => h.id === editingFund.id ? updatedHolding : h),
      updatedAt: new Date().toISOString()
    };

    // 重新计算组合总值
    recalculatePortfolio(updatedPortfolio);
    onUpdatePortfolio(updatedPortfolio);
    
    setNewFund({
      code: '',
      name: '',
      nav: '',
      holdingAmount: '',
      costPrice: ''
    });
    setEditingFund(null);
    setShowEditFundDialog(false);
  };

  const deleteFund = (fundId: string) => {
    if (confirm('确定要删除这只基金吗？')) {
      const updatedPortfolio = {
        ...portfolio,
        holdings: portfolio.holdings.filter(h => h.id !== fundId),
        updatedAt: new Date().toISOString()
      };

      // 重新计算组合总值
      recalculatePortfolio(updatedPortfolio);
      onUpdatePortfolio(updatedPortfolio);
    }
  };

  const recalculatePortfolio = (portfolio: FundPortfolio) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{portfolio.name}</CardTitle>
            {portfolio.description && (
              <CardDescription>{portfolio.description}</CardDescription>
            )}
          </div>
          <Dialog open={showAddFundDialog} onOpenChange={setShowAddFundDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                添加基金
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加基金</DialogTitle>
                <DialogDescription>
                  向组合中添加新的基金持仓
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fund-code">基金代码</Label>
                    <Input
                      id="fund-code"
                      placeholder="000001"
                      value={newFund.code}
                      onChange={(e) => setNewFund({...newFund, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fund-name">基金名称</Label>
                    <Input
                      id="fund-name"
                      placeholder="华夏成长混合"
                      value={newFund.name}
                      onChange={(e) => setNewFund({...newFund, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fund-nav">当前净值</Label>
                    <Input
                      id="fund-nav"
                      type="number"
                      step="0.0001"
                      placeholder="1.5420"
                      value={newFund.nav}
                      onChange={(e) => setNewFund({...newFund, nav: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fund-amount">持有金额</Label>
                    <Input
                      id="fund-amount"
                      type="number"
                      placeholder="10000"
                      value={newFund.holdingAmount}
                      onChange={(e) => setNewFund({...newFund, holdingAmount: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fund-cost">成本净值（可选）</Label>
                  <Input
                    id="fund-cost"
                    type="number"
                    step="0.0001"
                    placeholder="1.4500"
                    value={newFund.costPrice}
                    onChange={(e) => setNewFund({...newFund, costPrice: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    不填写则使用当前净值作为成本价
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddFundDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={addFund}>
                    添加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 编辑基金对话框 */}
          <Dialog open={showEditFundDialog} onOpenChange={setShowEditFundDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑基金</DialogTitle>
                <DialogDescription>
                  修改基金持仓信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-fund-code">基金代码</Label>
                    <Input
                      id="edit-fund-code"
                      placeholder="000001"
                      value={newFund.code}
                      onChange={(e) => setNewFund({...newFund, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-fund-name">基金名称</Label>
                    <Input
                      id="edit-fund-name"
                      placeholder="华夏成长混合"
                      value={newFund.name}
                      onChange={(e) => setNewFund({...newFund, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-fund-nav">当前净值</Label>
                    <Input
                      id="edit-fund-nav"
                      type="number"
                      step="0.0001"
                      placeholder="1.5420"
                      value={newFund.nav}
                      onChange={(e) => setNewFund({...newFund, nav: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-fund-amount">持有金额</Label>
                    <Input
                      id="edit-fund-amount"
                      type="number"
                      placeholder="10000"
                      value={newFund.holdingAmount}
                      onChange={(e) => setNewFund({...newFund, holdingAmount: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-fund-cost">成本净值（可选）</Label>
                  <Input
                    id="edit-fund-cost"
                    type="number"
                    step="0.0001"
                    placeholder="1.4500"
                    value={newFund.costPrice}
                    onChange={(e) => setNewFund({...newFund, costPrice: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    不填写则使用当前净值作为成本价
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditFundDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={updateFund}>
                    保存
                  </Button>
                </div>
              </div>
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

        {/* 基金持仓 */}
        <div>
          <h4 className="font-medium mb-3">基金持仓</h4>
          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无基金持仓</p>
              <p className="text-sm">点击"添加基金"开始构建您的组合</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.holdings.map(holding => (
                <div key={holding.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{holding.name}</div>
                      <div className="text-sm text-muted-foreground">{holding.code}</div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editFund(holding)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFund(holding.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">净值</div>
                      <div>¥{holding.nav.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">持有金额</div>
                      <div>¥{holding.holdingAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">份额</div>
                      <div>{holding.shares?.toFixed(2) || 0}</div>
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
