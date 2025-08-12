import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  PieChart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Portfolio, PortfolioSummary } from '@/lib/types/portfolio.types';
import { portfolioService } from '@/lib/services/portfolio.service';
import { cn } from '@/lib/utils';

interface PortfolioListProps {
  userId: string;
  onCreatePortfolio: () => void;
  onEditPortfolio: (portfolio: Portfolio) => void;
  onViewPortfolio: (portfolioId: string) => void;
  onDeletePortfolio: (portfolioId: string) => void;
}

export const PortfolioList: React.FC<PortfolioListProps> = ({
  userId,
  onCreatePortfolio,
  onEditPortfolio,
  onViewPortfolio,
  onDeletePortfolio
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolios();
    loadSummary();
  }, [userId]);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolios(userId);
      setPortfolios(data);
      setError(null);
    } catch (err) {
      setError('加载投资组合失败');
      console.error('加载投资组合失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await portfolioService.getPortfolioSummary(userId);
      setSummary(summaryData);
    } catch (err) {
      console.error('加载投资组合摘要失败:', err);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (window.confirm('确定要删除这个投资组合吗？此操作不可撤销。')) {
      const result = await portfolioService.deletePortfolio(portfolioId);
      if (result.success) {
        await loadPortfolios();
        await loadSummary();
      } else {
        setError(result.error || '删除投资组合失败');
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 投资组合摘要 */}
      {summary && summary.total_portfolios > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">投资组合总数</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_portfolios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总资产价值</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_value)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总收益</CardTitle>
              {summary.total_return >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                summary.total_return >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(summary.total_return)}
              </div>
              <p className={cn(
                "text-xs",
                summary.total_return_percentage >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercentage(summary.total_return_percentage)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最佳表现</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium truncate">
                {summary.best_performing_portfolio.name}
              </div>
              <p className="text-xs text-green-600">
                {formatPercentage(summary.best_performing_portfolio.return_percentage)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 投资组合列表 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">我的投资组合</h2>
          <p className="text-muted-foreground">
            管理您的投资组合，跟踪资产配置和表现
          </p>
        </div>
        <Button onClick={onCreatePortfolio} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          创建投资组合
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">还没有投资组合</h3>
            <p className="text-muted-foreground text-center mb-4">
              创建您的第一个投资组合，开始管理您的资产配置
            </p>
            <Button onClick={onCreatePortfolio} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              创建投资组合
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => {
            const returnAmount = portfolio.total_value - portfolio.target_value;
            const returnPercentage = portfolio.target_value > 0 ? 
              (returnAmount / portfolio.target_value) * 100 : 0;

            return (
              <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg truncate">{portfolio.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {portfolio.description || portfolio.investment_goal}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewPortfolio(portfolio.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditPortfolio(portfolio)}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 投资组合价值 */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">当前价值</span>
                      <span className="font-semibold">{formatCurrency(portfolio.total_value)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">收益</span>
                      <span className={cn(
                        "text-sm font-medium",
                        returnAmount >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(returnAmount)} ({formatPercentage(returnPercentage)})
                      </span>
                    </div>
                  </div>

                  {/* 风险等级和投资期限 */}
                  <div className="flex items-center justify-between">
                    <Badge className={getRiskLevelColor(portfolio.risk_level)}>
                      {getRiskLevelText(portfolio.risk_level)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {portfolio.time_horizon}年期
                    </span>
                  </div>

                  {/* 资产配置进度 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">资产配置</span>
                      <span className="text-sm text-muted-foreground">
                        {portfolio.current_allocation.length}个类别
                      </span>
                    </div>
                    {portfolio.current_allocation.slice(0, 3).map((allocation, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">{allocation.asset_type}</span>
                          <span>{allocation.current_percentage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={allocation.current_percentage} 
                          className="h-1"
                        />
                      </div>
                    ))}
                    {portfolio.current_allocation.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        还有 {portfolio.current_allocation.length - 3} 个资产类别...
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onViewPortfolio(portfolio.id)}
                      className="flex-1"
                    >
                      查看详情
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEditPortfolio(portfolio)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};