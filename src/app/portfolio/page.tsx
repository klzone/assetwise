'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  PlusIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  PieChartIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { Portfolio, PortfolioAsset, RebalanceRecommendation } from '@/lib/types/portfolio.types';
import { Asset } from '@/lib/types/data.types';
import { PortfolioService } from '@/lib/services/portfolio.service';
import { AssetStorage } from '@/lib/asset-storage';
import { PortfolioForm } from '@/components/portfolio/PortfolioForm';
import { PortfolioDetail } from '@/components/portfolio/PortfolioDetail';
import { PortfolioAllocationChart } from '@/components/portfolio/PortfolioAllocationChart';
import { PortfolioPerformanceChart } from '@/components/portfolio/PortfolioPerformanceChart';
import { RebalanceRecommendations } from '@/components/portfolio/RebalanceRecommendations';

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const portfolioService = new PortfolioService();
  const assetStorage = new AssetStorage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 加载投资组合数据
      const portfolioData = await portfolioService.getUserPortfolios('user-1');
      setPortfolios(portfolioData);

      // 加载资产数据
      const assetData = await assetStorage.getAllAssets();
      setAssets(assetData);

      // 如果有投资组合且没有选中的，选中第一个
      if (portfolioData.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(portfolioData[0]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (portfolioData: any) => {
    try {
      const result = await portfolioService.createPortfolio('user-1', portfolioData);
      if (result.success && result.data) {
        await loadData();
        setSelectedPortfolio(result.data);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('创建投资组合失败:', error);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      const result = await portfolioService.deletePortfolio(portfolioId);
      if (result.success) {
        await loadData();
        if (selectedPortfolio?.id === portfolioId) {
          setSelectedPortfolio(portfolios.length > 1 ? portfolios[0] : null);
        }
      }
    } catch (error) {
      console.error('删除投资组合失败:', error);
    }
  };

  const calculateTotalValue = () => {
    return portfolios.reduce((sum, portfolio) => sum + portfolio.total_value, 0);
  };

  const calculateTotalReturn = () => {
    const totalValue = calculateTotalValue();
    if (totalValue === 0) return 0;
    
    const totalReturn = portfolios.reduce((sum, portfolio) => {
      return sum + (portfolio.total_value * (portfolio.total_return_percentage || 0) / 100);
    }, 0);
    
    return (totalReturn / totalValue) * 100;
  };

  const getBestPerformingPortfolio = () => {
    if (portfolios.length === 0) return null;
    return portfolios.reduce((best, current) => 
      (current.total_return_percentage || 0) > (best.total_return_percentage || 0) ? current : best
    );
  };

  const getWorstPerformingPortfolio = () => {
    if (portfolios.length === 0) return null;
    return portfolios.reduce((worst, current) => 
      (current.total_return_percentage || 0) < (worst.total_return_percentage || 0) ? current : worst
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCwIcon className="h-8 w-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">投资组合管理</h1>
          <p className="text-muted-foreground mt-1">管理和分析您的投资组合</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          创建投资组合
        </Button>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">投资组合总数</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产价值</CardTitle>
            <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{calculateTotalValue().toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收益率</CardTitle>
            {calculateTotalReturn() >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calculateTotalReturn() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {calculateTotalReturn().toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最佳表现</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{getBestPerformingPortfolio()?.name || '无'}</div>
            <div className="text-xs text-green-600">
              +{getBestPerformingPortfolio()?.total_return_percentage?.toFixed(2) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 投资组合列表 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>我的投资组合</CardTitle>
            <CardDescription>选择一个投资组合查看详情</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {portfolios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>还没有投资组合</p>
                <p className="text-sm">点击上方按钮创建您的第一个投资组合</p>
              </div>
            ) : (
              portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPortfolio?.id === portfolio.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedPortfolio(portfolio)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{portfolio.name}</h3>
                    <Badge variant={portfolio.risk_level === 'high' ? 'destructive' : 
                                  portfolio.risk_level === 'medium' ? 'default' : 'secondary'}>
                      {portfolio.risk_level === 'high' ? '高风险' : 
                       portfolio.risk_level === 'medium' ? '中风险' : '低风险'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{portfolio.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">¥{portfolio.total_value.toLocaleString()}</span>
                    <span className={`text-sm font-medium ${
                      (portfolio.total_return_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(portfolio.total_return_percentage || 0) >= 0 ? '+' : ''}
                      {(portfolio.total_return_percentage || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 投资组合详情 */}
        <div className="lg:col-span-2">
          {selectedPortfolio ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="allocation">配置</TabsTrigger>
                <TabsTrigger value="performance">业绩</TabsTrigger>
                <TabsTrigger value="rebalance">再平衡</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <PortfolioDetail 
                  portfolio={selectedPortfolio}
                  assets={assets}
                  onUpdate={loadData}
                  onDelete={handleDeletePortfolio}
                />
              </TabsContent>

              <TabsContent value="allocation" className="space-y-4">
                <PortfolioAllocationChart portfolio={selectedPortfolio} />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <PortfolioPerformanceChart portfolio={selectedPortfolio} />
              </TabsContent>

              <TabsContent value="rebalance" className="space-y-4">
                <RebalanceRecommendations portfolio={selectedPortfolio} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>请选择一个投资组合查看详情</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 创建投资组合对话框 */}
      {showCreateForm && (
        <PortfolioForm
          onSubmit={handleCreatePortfolio}
          onCancel={() => setShowCreateForm(false)}
          assets={assets}
        />
      )}
    </div>
  );
}