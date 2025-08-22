'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EditIcon, 
  TrashIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  PieChartIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  PlusIcon
} from 'lucide-react';
import { Portfolio } from '@/lib/types/portfolio.types';
import { Asset } from '@/lib/types/data.types';
import { PortfolioAssetManager } from './PortfolioAssetManager';

interface PortfolioDetailProps {
  portfolio: Portfolio;
  assets: Asset[];
  onUpdate: () => void;
  onDelete: (portfolioId: string) => void;
}

export function PortfolioDetail({ portfolio, assets, onUpdate, onDelete }: PortfolioDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* 投资组合基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{portfolio.name}</CardTitle>
              <CardDescription className="mt-2">{portfolio.description}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <EditIcon className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(portfolio.id)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">总价值</p>
              <p className="text-2xl font-bold">¥{portfolio.total_value.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">总收益率</p>
              <p className={`text-2xl font-bold ${
                (portfolio.total_return_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(portfolio.total_return_percentage || 0) >= 0 ? '+' : ''}
                {(portfolio.total_return_percentage || 0).toFixed(2)}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">风险等级</p>
              <Badge variant={getRiskLevelBadge(portfolio.risk_level) as any}>
                {portfolio.risk_level === 'high' ? '高风险' : 
                 portfolio.risk_level === 'medium' ? '中风险' : '低风险'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">再平衡阈值</p>
              <p className="text-lg font-semibold">{portfolio.rebalance_threshold}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 投资目标和时间期限 */}
      <Card>
        <CardHeader>
          <CardTitle>投资策略</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">投资目标</h4>
              <p className="text-muted-foreground">{portfolio.investment_goal}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">投资期限</h4>
              <p className="text-muted-foreground">{portfolio.time_horizon}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细信息标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">配置概览</TabsTrigger>
          <TabsTrigger value="assets">资产管理</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 资产配置 */}
          <Card>
            <CardHeader>
              <CardTitle>资产配置</CardTitle>
              <CardDescription>当前配置与目标配置对比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.current_allocation.map((allocation, index) => {
                  const target = portfolio.target_allocation.find(t => t.asset_type === allocation.asset_type);
                  const deviation = allocation.current_percentage - (target?.target_percentage || 0);
                  const isOverThreshold = Math.abs(deviation) > portfolio.rebalance_threshold;

                  return (
                    <div key={allocation.asset_type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{allocation.asset_type}</span>
                          {isOverThreshold && (
                            <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            当前: {allocation.current_percentage.toFixed(1)}% | 
                            目标: {target?.target_percentage.toFixed(1) || 0}%
                          </div>
                          <div className={`text-xs ${
                            Math.abs(deviation) <= portfolio.rebalance_threshold 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            偏差: {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Progress value={allocation.current_percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            ¥{allocation.current_value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 需要再平衡提醒 */}
          {portfolio.current_allocation.some(allocation => {
            const target = portfolio.target_allocation.find(t => t.asset_type === allocation.asset_type);
            const deviation = Math.abs(allocation.current_percentage - (target?.target_percentage || 0));
            return deviation > portfolio.rebalance_threshold;
          }) && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangleIcon className="h-5 w-5" />
                  <span>需要再平衡</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  您的投资组合配置偏离目标超过设定阈值，建议进行再平衡调整以优化风险收益比。
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <PortfolioAssetManager 
            portfolio={portfolio}
            assets={assets}
            onUpdate={onUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}