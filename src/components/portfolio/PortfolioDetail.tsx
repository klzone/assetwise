import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  PieChart,
  BarChart3,
  AlertTriangle,
  Plus,
  Edit,
  Download,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Portfolio, 
  PortfolioAsset, 
  RebalanceRecommendation 
} from '@/lib/types/portfolio.types';
import { portfolioService } from '@/lib/services/portfolio.service';
import { cn } from '@/lib/utils';

interface PortfolioDetailProps {
  portfolioId: string;
  onBack: () => void;
  onEdit: (portfolio: Portfolio) => void;
  onAddAsset: (portfolioId: string) => void;
}

export const PortfolioDetail: React.FC<PortfolioDetailProps> = ({
  portfolioId,
  onBack,
  onEdit,
  onAddAsset
}) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [recommendations, setRecommendations] = useState<RebalanceRecommendation[]>([]);
  const [riskMetrics, setRiskMetrics] = useState({
    volatility: 0,
    beta: 0,
    sharpeRatio: 0,
    maxDrawdown: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolioData();
  }, [portfolioId]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [portfolioData, assetsData, recommendationsData, riskData] = await Promise.all([
        portfolioService.getPortfolioById(portfolioId),
        portfolioService.getPortfolioAssets(portfolioId),
        portfolioService.getRebalanceRecommendations(portfolioId),
        portfolioService.calculatePortfolioRisk(portfolioId)
      ]);

      if (!portfolioData) {
        setError('投资组合不存在');
        return;
      }

      setPortfolio(portfolioData);
      setAssets(assetsData);
      setRecommendations(recommendationsData);
      setRiskMetrics(riskData);
    } catch (err) {
      setError('加载投资组合数据失败');
      console.error('加载投资组合数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await portfolioService.exportPortfolioData(portfolioId);
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_${portfolio?.name}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || '导出失败');
      }
    } catch (err) {
      setError('导出过程中发生错误');
      console.error('导出失败:', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'conservative':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'aggressive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelText = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'conservative':
        return '保守型';
      case 'moderate':
        return '稳健型';
      case 'aggressive':
        return '激进型';
      default:
        return '未知';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || '投资组合不存在'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const returnAmount = portfolio.total_value - portfolio.target_value;
  const returnPercentage = portfolio.target_value > 0 ? 
    (returnAmount / portfolio.target_value) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 头部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{portfolio.name}</h1>
            <p className="text-muted-foreground">{portfolio.description || portfolio.investment_goal}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadPortfolioData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={() => onEdit(portfolio)}>
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </Button>
        </div>
      </div>

      {/* 投资组合概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当前价值</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(portfolio.total_value)}</div>
            <p className="text-xs text-muted-foreground">
              目标: {formatCurrency(portfolio.target_value)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收益</CardTitle>
            {returnAmount >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              returnAmount >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(returnAmount)}
            </div>
            <p className={cn(
              "text-xs",
              returnPercentage >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatPercentage(returnPercentage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">风险等级</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getRiskLevelColor(portfolio.risk_level)}>
              {getRiskLevelText(portfolio.risk_level)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              投资期限: {portfolio.time_horizon}年
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">资产数量</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => onAddAsset(portfolioId)}
            >
              添加资产
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 详细信息标签页 */}
      <Tabs defaultValue="allocation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocation">资产配置</TabsTrigger>
          <TabsTrigger value="assets">持仓明细</TabsTrigger>
          <TabsTrigger value="rebalance">重新平衡</TabsTrigger>
          <TabsTrigger value="risk">风险分析</TabsTrigger>
        </TabsList>

        {/* 资产配置 */}
        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>资产配置对比</CardTitle>
              <CardDescription>目标配置 vs 当前配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {portfolio.target_allocation.map((target, index) => {
                const current = portfolio.current_allocation.find(c => c.asset_type === target.asset_type);
                const deviation = current ? current.current_percentage - target.target_percentage : -target.target_percentage;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{target.asset_type}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>目标: {target.target_percentage.toFixed(1)}%</span>
                        <span>当前: {current?.current_percentage.toFixed(1) || '0.0'}%</span>
                        <span className={cn(
                          "font-medium",
                          Math.abs(deviation) > portfolio.rebalance_threshold ? "text-red-600" : "text-green-600"
                        )}>
                          {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={target.target_percentage} className="h-2 bg-gray-200" />
                      <Progress 
                        value={current?.current_percentage || 0} 
                        className={cn(
                          "h-2",
                          Math.abs(deviation) > portfolio.rebalance_threshold ? "bg-red-100" : "bg-green-100"
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>目标价值: {formatCurrency(target.target_value)}</span>
                      <span>当前价值: {formatCurrency(current?.current_value || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 持仓明细 */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">持仓明细</h3>
            <Button onClick={() => onAddAsset(portfolioId)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加资产
            </Button>
          </div>

          {assets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">暂无持仓资产</h3>
                <p className="text-muted-foreground text-center mb-4">
                  添加资产到投资组合中开始跟踪您的投资表现
                </p>
                <Button onClick={() => onAddAsset(portfolioId)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  添加资产
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => {
                const unrealizedGain = (asset.current_price - asset.average_price) * asset.quantity;
                const unrealizedGainPercentage = asset.average_price > 0 ? 
                  ((asset.current_price - asset.average_price) / asset.average_price) * 100 : 0;

                return (
                  <Card key={asset.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{asset.symbol}</CardTitle>
                        <Badge variant="outline">{asset.asset_type}</Badge>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {asset.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">持仓数量</span>
                          <div className="font-medium">{asset.quantity.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">当前价格</span>
                          <div className="font-medium">{formatCurrency(asset.current_price)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">平均成本</span>
                          <div className="font-medium">{formatCurrency(asset.average_price)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">市值</span>
                          <div className="font-medium">{formatCurrency(asset.current_value)}</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">配置比例</span>
                          <span>{asset.current_percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={asset.current_percentage} className="h-1" />
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">未实现损益</span>
                          <div className={cn(
                            "text-sm font-medium",
                            unrealizedGain >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(unrealizedGain)}
                            <span className="ml-1">
                              ({formatPercentage(unrealizedGainPercentage)})
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 重新平衡建议 */}
        <TabsContent value="rebalance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                重新平衡建议
              </CardTitle>
              <CardDescription>
                基于{portfolio.rebalance_threshold}%的偏离阈值分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <TrendingUp className="h-8 w-8 mx-auto" />
                  </div>
                  <h3 className="font-semibold mb-1">配置良好</h3>
                  <p className="text-muted-foreground text-sm">
                    当前资产配置在目标范围内，无需重新平衡
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rec.asset_symbol}</span>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {getPriorityText(rec.priority)}优先级
                          </Badge>
                        </div>
                        <Badge variant={rec.recommended_action === 'buy' ? 'default' : 'destructive'}>
                          {rec.recommended_action === 'buy' ? '买入' : '卖出'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">当前配置</span>
                          <div className="font-medium">{rec.current_percentage.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">目标配置</span>
                          <div className="font-medium">{rec.target_percentage.toFixed(1)}%</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">偏离程度</span>
                          <span className={cn(
                            "font-medium",
                            Math.abs(rec.deviation) > portfolio.rebalance_threshold ? "text-red-600" : "text-yellow-600"
                          )}>
                            {rec.deviation >= 0 ? '+' : ''}{rec.deviation.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">建议金额</span>
                          <span className="font-medium">{formatCurrency(rec.recommended_amount)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-3">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风险分析 */}
        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>风险指标</CardTitle>
                <CardDescription>基于历史数据的风险评估</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">波动率</span>
                    <div className="text-lg font-semibold">
                      {(riskMetrics.volatility * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Beta系数</span>
                    <div className="text-lg font-semibold">
                      {riskMetrics.beta.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">夏普比率</span>
                    <div className="text-lg font-semibold">
                      {riskMetrics.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">最大回撤</span>
                    <div className="text-lg font-semibold text-red-600">
                      -{(riskMetrics.maxDrawdown * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>风险评估</CardTitle>
                <CardDescription>基于当前配置的风险分析</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">风险水平</span>
                      <Badge className={getRiskLevelColor(portfolio.risk_level)}>
                        {getRiskLevelText(portfolio.risk_level)}
                      </Badge>
                    </div>
                    <Progress 
                      value={portfolio.risk_level === 'conservative' ? 30 : 
                             portfolio.risk_level === 'moderate' ? 60 : 90} 
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">分散化程度</span>
                      <span className="text-sm font-medium">
                        {Math.min((assets.length / 10) * 100, 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((assets.length / 10) * 100, 100)} 
                      className="h-2"
                    />
                  </div>

                  <div className="pt-2 text-sm text-muted-foreground">
                    <p>
                      当前投资组合的风险水平为{getRiskLevelText(portfolio.risk_level)}，
                      适合{portfolio.time_horizon}年的投资期限。
                      建议定期检查和调整资产配置以保持风险水平。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};