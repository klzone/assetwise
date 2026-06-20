'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCwIcon, 
  ExternalLinkIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  PlusIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon
} from 'lucide-react';
import { TiantianFundImportService, TiantianFundPortfolio } from '@/lib/services/tiantian-fund-import.service';

interface TiantianFundPortfolioCardProps {
  portfolio?: any; // 现有的天天基金组合
  onUpdate?: () => void;
  onImport?: (portfolioData: any) => void;
}

export function TiantianFundPortfolioCard({ 
  portfolio, 
  onUpdate, 
  onImport 
}: TiantianFundPortfolioCardProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tiantianData, setTiantianData] = useState<TiantianFundPortfolio | null>(null);

  const tiantianService = new TiantianFundImportService();

  // 处理导入天天基金组合
  const handleImport = async () => {
    if (!importUrl.trim()) {
      setError('请输入天天基金组合链接');
      return;
    }

    if (!tiantianService.validateTiantianUrl(importUrl)) {
      setError('请输入有效的天天基金组合链接');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 导入天天基金数据
      const result = await tiantianService.syncToLocalStorage(importUrl);
      
      if (result.success && result.data) {
        setSuccess('天天基金组合导入成功！');
        setTiantianData(result.data);
        
        // 通知父组件
        if (onImport) {
          onImport(result.data);
        }
        
        // 延迟关闭对话框
        setTimeout(() => {
          setShowImportDialog(false);
          setImportUrl('');
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || '导入失败');
      }
    } catch (error) {
      console.error('导入天天基金组合失败:', error);
      setError('导入失败，请检查链接是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 处理更新天天基金组合
  const handleUpdate = async () => {
    if (!portfolio?.tiantianUrl) {
      setError('没有找到天天基金链接');
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const result = await tiantianService.syncToLocalStorage(portfolio.tiantianUrl);
      
      if (result.success) {
        setSuccess('组合数据更新成功！');
        
        // 通知父组件刷新
        if (onUpdate) {
          onUpdate();
        }
        
        // 清除成功消息
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || '更新失败');
      }
    } catch (error) {
      console.error('更新天天基金组合失败:', error);
      setError('更新失败，请检查网络连接');
    } finally {
      setUpdating(false);
    }
  };

  // 获取基金类型颜色
  const getFundTypeColor = (type: string) => {
    switch (type) {
      case '混合型':
        return 'bg-blue-100 text-blue-800';
      case '债券型':
        return 'bg-green-100 text-green-800';
      case '指数型':
        return 'bg-purple-100 text-purple-800';
      case '货币型':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 如果没有天天基金组合，显示导入按钮
  if (!portfolio) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <ExternalLinkIcon className="h-5 w-5" />
            天天基金组合
          </CardTitle>
          <CardDescription>
            导入您的天天基金组合，实时同步净值和收益数据
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                导入天天基金组合
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>导入天天基金组合</DialogTitle>
                <DialogDescription>
                  请输入您的天天基金组合链接，我们将自动同步组合数据
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-url">天天基金组合链接</Label>
                  <Input
                    id="import-url"
                    placeholder="https://tradeh5.tiantianfunds.cn/tradeh5/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    请从天天基金APP或网页版复制组合链接
                  </p>
                </div>

                {error && (
                  <Alert>
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm">
                      <p className="font-medium mb-1">如何获取组合链接：</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>打开天天基金APP或网页版</li>
                        <li>进入您的投资组合页面</li>
                        <li>点击分享按钮复制链接</li>
                        <li>将链接粘贴到上方输入框</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportUrl('');
                    setError(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleImport} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    '导入组合'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // 显示已导入的天天基金组合
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ExternalLinkIcon className="h-5 w-5" />
              {portfolio.name}
            </CardTitle>
            <CardDescription>{portfolio.description}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="h-4 w-4" />
              )}
            </Button>
            {portfolio.tiantianUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(portfolio.tiantianUrl, '_blank')}
              >
                <ExternalLinkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 组合统计 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">总资产</div>
            <div className="text-lg font-semibold">¥{portfolio.totalValue?.toLocaleString() || '0'}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">总盈亏</div>
            <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
              (portfolio.totalProfit || 0) >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {(portfolio.totalProfit || 0) >= 0 ? (
                <TrendingUpIcon className="h-4 w-4" />
              ) : (
                <TrendingDownIcon className="h-4 w-4" />
              )}
              {(portfolio.totalProfit || 0) >= 0 ? '+' : ''}¥{(portfolio.totalProfit || 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">收益率</div>
            <div className={`text-lg font-semibold ${
              (portfolio.totalProfitRate || 0) >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {(portfolio.totalProfitRate || 0) >= 0 ? '+' : ''}{(portfolio.totalProfitRate || 0).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 基金持仓 */}
        <div>
          <h4 className="font-medium mb-3">基金持仓 ({portfolio.holdings?.length || 0}只)</h4>
          {portfolio.holdings && portfolio.holdings.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {portfolio.holdings.map((holding: any, index: number) => (
                <div key={holding.id || index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{holding.name}</span>
                        {holding.code && (
                          <Badge variant="outline" className="text-xs">{holding.code}</Badge>
                        )}
                        {holding.fundType && (
                          <Badge className={`text-xs ${getFundTypeColor(holding.fundType)}`}>
                            {holding.fundType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ¥{holding.holdingAmount?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {holding.weight?.toFixed(2) || '0'}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-muted-foreground">净值: </span>
                      <span>¥{holding.nav?.toFixed(4) || '0'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">份额: </span>
                      <span>{holding.shares?.toFixed(2) || '0'}</span>
                    </div>
                    <div className={`${
                      (holding.profitRate || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {(holding.profitRate || 0) >= 0 ? '+' : ''}{(holding.profitRate || 0).toFixed(2)}%
                    </div>
                  </div>
                  
                  {/* 权重进度条 */}
                  <div className="mt-2">
                    <Progress value={holding.weight || 0} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">暂无基金持仓数据</p>
            </div>
          )}
        </div>

        {/* 最后更新时间 */}
        {portfolio.updatedAt && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
            最后更新: {new Date(portfolio.updatedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}