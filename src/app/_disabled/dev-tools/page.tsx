'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  DatabaseIcon, 
  RefreshCwIcon, 
  TrashIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-react';
import { initializeAssetData, clearAssetData } from '@/lib/asset-data-init';
import { initializePortfolioData, clearPortfolioData } from '@/lib/portfolio-data-init';

export default function DevToolsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInitializeAssets = async () => {
    try {
      setLoading(true);
      await initializeAssetData();
      showMessage('success', '资产数据初始化完成');
    } catch (error) {
      showMessage('error', '资产数据初始化失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAssets = async () => {
    try {
      setLoading(true);
      await clearAssetData();
      showMessage('success', '资产数据清除完成');
    } catch (error) {
      showMessage('error', '资产数据清除失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializePortfolios = async () => {
    try {
      setLoading(true);
      await initializePortfolioData();
      showMessage('success', '投资组合数据初始化完成');
    } catch (error) {
      showMessage('error', '投资组合数据初始化失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearPortfolios = async () => {
    try {
      setLoading(true);
      await clearPortfolioData();
      showMessage('success', '投资组合数据清除完成');
    } catch (error) {
      showMessage('error', '投资组合数据清除失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeAll = async () => {
    try {
      setLoading(true);
      await initializeAssetData();
      await initializePortfolioData();
      showMessage('success', '所有数据初始化完成');
    } catch (error) {
      showMessage('error', '数据初始化失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setLoading(true);
      await clearPortfolioData();
      await clearAssetData();
      showMessage('success', '所有数据清除完成');
    } catch (error) {
      showMessage('error', '数据清除失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">开发工具</h1>
        <p className="text-muted-foreground mt-1">用于开发和测试的数据管理工具</p>
        <Badge variant="destructive" className="mt-2">
          仅限开发环境使用
        </Badge>
      </div>

      {/* 消息提示 */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' && <CheckCircleIcon className="h-4 w-4" />}
          {message.type === 'error' && <AlertCircleIcon className="h-4 w-4" />}
          {message.type === 'info' && <InfoIcon className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 资产数据管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DatabaseIcon className="h-5 w-5" />
              <span>资产数据管理</span>
            </CardTitle>
            <CardDescription>
              管理系统中的资产数据，包括股票、债券、基金等
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">初始化资产数据</h4>
              <p className="text-sm text-muted-foreground">
                创建示例资产数据，包括各类金融产品的基本信息
              </p>
              <Button 
                onClick={handleInitializeAssets}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                )}
                初始化资产数据
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">清除资产数据</h4>
              <p className="text-sm text-muted-foreground">
                删除所有资产数据，谨慎操作
              </p>
              <Button 
                variant="destructive"
                onClick={handleClearAssets}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                清除资产数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 投资组合数据管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DatabaseIcon className="h-5 w-5" />
              <span>投资组合数据管理</span>
            </CardTitle>
            <CardDescription>
              管理投资组合数据，包括配置策略和持仓信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">初始化投资组合数据</h4>
              <p className="text-sm text-muted-foreground">
                创建示例投资组合，包括保守型、平衡型和成长型组合
              </p>
              <Button 
                onClick={handleInitializePortfolios}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                )}
                初始化投资组合数据
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">清除投资组合数据</h4>
              <p className="text-sm text-muted-foreground">
                删除所有投资组合数据，谨慎操作
              </p>
              <Button 
                variant="destructive"
                onClick={handleClearPortfolios}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                清除投资组合数据
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 批量操作 */}
      <Card>
        <CardHeader>
          <CardTitle>批量操作</CardTitle>
          <CardDescription>
            一键执行多个数据操作，适合快速重置开发环境
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleInitializeAll}
              disabled={loading}
              size="lg"
              className="h-16"
            >
              {loading ? (
                <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <DatabaseIcon className="h-5 w-5 mr-2" />
              )}
              <div className="text-left">
                <div className="font-medium">初始化所有数据</div>
                <div className="text-xs opacity-80">创建完整的示例数据集</div>
              </div>
            </Button>

            <Button 
              variant="destructive"
              onClick={handleClearAll}
              disabled={loading}
              size="lg"
              className="h-16"
            >
              {loading ? (
                <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <TrashIcon className="h-5 w-5 mr-2" />
              )}
              <div className="text-left">
                <div className="font-medium">清除所有数据</div>
                <div className="text-xs opacity-80">删除所有示例数据</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <span className="font-medium text-foreground">1.</span>
              <span>首次使用时，建议先点击"初始化所有数据"创建完整的示例数据</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-foreground">2.</span>
              <span>资产数据是投资组合的基础，请确保先初始化资产数据</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-foreground">3.</span>
              <span>投资组合数据依赖于资产数据，会自动关联现有资产</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-foreground">4.</span>
              <span>清除操作不可逆，请谨慎使用</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium text-foreground">5.</span>
              <span>此页面仅用于开发测试，生产环境请勿使用</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}