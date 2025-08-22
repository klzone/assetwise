'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangleIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  RefreshCwIcon,
  CheckCircleIcon,
  InfoIcon
} from 'lucide-react';
import { Portfolio, RebalanceRecommendation } from '@/lib/types/portfolio.types';
import { PortfolioService } from '@/lib/services/portfolio.service';

interface RebalanceRecommendationsProps {
  portfolio: Portfolio;
}

export function RebalanceRecommendations({ portfolio }: RebalanceRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RebalanceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  const portfolioService = new PortfolioService();

  useEffect(() => {
    loadRecommendations();
  }, [portfolio.id]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const recs = await portfolioService.getRebalanceRecommendations(portfolio.id);
      setRecommendations(recs);
    } catch (error) {
      console.error('加载再平衡建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeRebalance = async () => {
    try {
      setExecuting(true);
      // 这里应该实现实际的再平衡逻辑
      // 现在只是模拟执行
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadRecommendations();
    } catch (error) {
      console.error('执行再平衡失败:', error);
    } finally {
      setExecuting(false);
    }
  };

  const calculateTotalAdjustment = () => {
    return recommendations.reduce((sum, rec) => sum + Math.abs(rec.recommended_amount), 0);
  };

  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'sell':
        return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCwIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'buy':
        return '买入';
      case 'sell':
        return '卖出';
      default:
        return '调整';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">高优先级</Badge>;
      case 'medium':
        return <Badge variant="default">中优先级</Badge>;
      case 'low':
        return <Badge variant="secondary">低优先级</Badge>;
      default:
        return <Badge variant="outline">普通</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">分析再平衡建议...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 再平衡概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCwIcon className="h-5 w-5" />
            <span>再平衡分析</span>
          </CardTitle>
          <CardDescription>
            基于目标配置和当前偏差的投资组合调整建议
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertDescription>
                您的投资组合配置良好，当前无需进行再平衡调整。
                所有资产类型的偏差都在设定的阈值（{portfolio.rebalance_threshold}%）范围内。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  检测到 {recommendations.length} 项配置偏差，建议进行再平衡调整。
                  总调整金额约 ¥{calculateTotalAdjustment().toLocaleString()}。
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{recommendations.length}</div>
                  <div className="text-sm text-muted-foreground">需要调整的资产</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">¥{calculateTotalAdjustment().toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">总调整金额</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {recommendations.filter(r => r.priority === 'high').length}
                  </div>
                  <div className="text-sm text-muted-foreground">高优先级调整</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 调整建议列表 */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>调整建议</CardTitle>
                <CardDescription>按优先级排序的具体调整方案</CardDescription>
              </div>
              <Button 
                onClick={executeRebalance}
                disabled={executing}
                className="flex items-center space-x-2"
              >
                {executing ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                <span>{executing ? '执行中...' : '执行再平衡'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                         priorityOrder[a.priority as keyof typeof priorityOrder];
                })
                .map((recommendation, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getRecommendationIcon(recommendation.action)}
                        <div>
                          <h4 className="font-medium">{recommendation.asset_symbol}</h4>
                          <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                        </div>
                      </div>
                      {getPriorityBadge(recommendation.priority)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">建议操作：</span>
                        <span className="font-medium ml-2">
                          {getActionText(recommendation.action)} ¥{recommendation.recommended_amount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">当前偏差：</span>
                        <span className="font-medium ml-2">
                          {recommendation.current_deviation > 0 ? '+' : ''}{recommendation.current_deviation.toFixed(2)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">目标偏差：</span>
                        <span className="font-medium ml-2 text-green-600">
                          {recommendation.target_deviation.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* 调整进度条 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>调整前偏差</span>
                        <span>调整后偏差</span>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={Math.abs(recommendation.current_deviation)} 
                          className="h-2"
                        />
                        <div 
                          className="absolute top-0 h-2 bg-green-500 rounded-full"
                          style={{ 
                            width: `${Math.abs(recommendation.target_deviation)}%`,
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 再平衡策略说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <InfoIcon className="h-5 w-5" />
            <span>再平衡策略</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">当前设置</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">再平衡阈值：</span>
                  <span className="font-medium">{portfolio.rebalance_threshold}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">投资目标：</span>
                  <span className="font-medium">{portfolio.investment_goal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">时间期限：</span>
                  <span className="font-medium">{portfolio.time_horizon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">风险等级：</span>
                  <Badge variant={portfolio.risk_level === 'high' ? 'destructive' : 
                                portfolio.risk_level === 'medium' ? 'default' : 'secondary'}>
                    {portfolio.risk_level === 'high' ? '高风险' : 
                     portfolio.risk_level === 'medium' ? '中风险' : '低风险'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">再平衡原则</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 当资产配置偏离目标超过设定阈值时触发再平衡</p>
                <p>• 优先调整偏差最大的资产类型</p>
                <p>• 考虑交易成本和税务影响</p>
                <p>• 保持与投资目标和风险承受能力的一致性</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">建议频率</h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• 定期检查：建议每季度检查一次配置偏差</p>
                <p>• 市场波动：重大市场事件后及时评估</p>
                <p>• 资金变化：有大额资金流入流出时重新平衡</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}