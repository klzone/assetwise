'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Portfolio } from '@/lib/types/portfolio.types';

interface PortfolioAllocationChartProps {
  portfolio: Portfolio;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PortfolioAllocationChart({ portfolio }: PortfolioAllocationChartProps) {
  // 准备饼图数据
  const pieData = portfolio.current_allocation.map((allocation, index) => ({
    name: allocation.asset_type,
    value: allocation.current_percentage,
    color: COLORS[index % COLORS.length]
  }));

  // 准备对比图数据
  const comparisonData = portfolio.target_allocation.map(target => {
    const current = portfolio.current_allocation.find(c => c.asset_type === target.asset_type);
    return {
      asset_type: target.asset_type,
      target: target.target_percentage,
      current: current?.current_percentage || 0,
      deviation: (current?.current_percentage || 0) - target.target_percentage
    };
  });

  const getDeviationColor = (deviation: number) => {
    if (Math.abs(deviation) <= portfolio.rebalance_threshold) return 'text-green-600';
    if (Math.abs(deviation) <= portfolio.rebalance_threshold * 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDeviationBadge = (deviation: number) => {
    if (Math.abs(deviation) <= portfolio.rebalance_threshold) return 'secondary';
    if (Math.abs(deviation) <= portfolio.rebalance_threshold * 2) return 'default';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* 当前配置饼图 */}
      <Card>
        <CardHeader>
          <CardTitle>当前资产配置</CardTitle>
          <CardDescription>投资组合中各资产类型的实际分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {portfolio.current_allocation.map((allocation, index) => (
                <div key={allocation.asset_type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{allocation.asset_type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{allocation.current_percentage.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        ¥{allocation.current_value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Progress value={allocation.current_percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 目标配置对比 */}
      <Card>
        <CardHeader>
          <CardTitle>目标配置对比</CardTitle>
          <CardDescription>当前配置与目标配置的对比分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 对比柱状图 */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="asset_type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" fill="#8884d8" name="目标配置" />
                  <Bar dataKey="current" fill="#82ca9d" name="当前配置" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 偏差详情 */}
            <div className="space-y-3">
              <h4 className="font-medium">配置偏差分析</h4>
              {comparisonData.map((item) => (
                <div key={item.asset_type} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{item.asset_type}</span>
                    <Badge variant={getDeviationBadge(item.deviation)}>
                      {Math.abs(item.deviation) <= portfolio.rebalance_threshold ? '正常' :
                       Math.abs(item.deviation) <= portfolio.rebalance_threshold * 2 ? '轻微偏差' : '需要调整'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">
                        目标: {item.target.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        当前: {item.current.toFixed(1)}%
                      </span>
                      <span className={`font-medium ${getDeviationColor(item.deviation)}`}>
                        {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 配置建议 */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">配置建议</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                {comparisonData.some(item => Math.abs(item.deviation) > portfolio.rebalance_threshold) ? (
                  <>
                    <p>• 您的投资组合存在配置偏差，建议进行再平衡调整</p>
                    <p>• 再平衡阈值: {portfolio.rebalance_threshold}%</p>
                    <p>• 查看"再平衡"标签页获取具体调整建议</p>
                  </>
                ) : (
                  <>
                    <p>• 您的投资组合配置良好，无需调整</p>
                    <p>• 所有资产类型的偏差都在可接受范围内</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}