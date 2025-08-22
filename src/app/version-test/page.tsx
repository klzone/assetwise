'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VersionBrowser } from '@/components/sync/version-browser';
import { versionService } from '@/lib/services/version.service';
import { notificationService } from '@/lib/services/notification.service';
import { 
  History, 
  GitBranch, 
  Database, 
  Plus,
  BarChart3,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { DataType } from '@/lib/types/sync.types';

export default function VersionTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [stats, setStats] = useState(versionService.getVersionStats());

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const updateStats = () => {
    setStats(versionService.getVersionStats());
  };

  const createTestVersion = (dataType: DataType) => {
    const changes = [
      {
        type: 'create' as const,
        itemId: `test_${Date.now()}`,
        itemType: dataType,
        newValue: `测试${dataType}数据`,
        timestamp: new Date()
      },
      {
        type: 'update' as const,
        itemId: `existing_${Math.floor(Math.random() * 100)}`,
        itemType: dataType,
        field: 'name',
        oldValue: '旧名称',
        newValue: '新名称',
        timestamp: new Date()
      }
    ];

    const versionId = versionService.createVersion(
      dataType,
      changes,
      {
        device: '测试设备',
        userId: 'test_user',
        syncId: `test_sync_${Date.now()}`,
        source: 'local'
      },
      `测试版本 - ${dataType}数据更新`
    );

    addTestResult(`创建了${dataType}类型的测试版本: ${versionId.slice(0, 8)}...`);
    updateStats();
  };

  const createBatchVersions = () => {
    const dataTypes: DataType[] = ['assets', 'transactions', 'plans', 'reviews'];
    const devices = ['办公电脑', '家用电脑', '移动设备'];
    
    dataTypes.forEach((dataType, index) => {
      setTimeout(() => {
        const changes = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
          type: ['create', 'update', 'delete'][Math.floor(Math.random() * 3)] as const,
          itemId: `batch_item_${i}`,
          itemType: dataType,
          field: Math.random() > 0.5 ? 'name' : undefined,
          oldValue: Math.random() > 0.5 ? '旧值' : undefined,
          newValue: `批量测试值_${i}`,
          timestamp: new Date()
        }));

        const versionId = versionService.createVersion(
          dataType,
          changes,
          {
            device: devices[index % devices.length],
            userId: 'batch_user',
            syncId: `batch_sync_${index}`,
            source: Math.random() > 0.5 ? 'local' : 'remote'
          },
          `批量测试版本 - ${dataType} (${changes.length}个变更)`
        );

        addTestResult(`批量创建版本: ${dataType} - ${versionId.slice(0, 8)}...`);
        updateStats();
      }, index * 500);
    });
  };

  const testVersionComparison = () => {
    const versions = versionService.getVersions();
    if (versions.length >= 2) {
      const comparison = versionService.compareVersions(versions[0].id, versions[1].id);
      if (comparison) {
        addTestResult(`版本对比完成: ${comparison.summary.totalChanges}个差异`);
        notificationService.notify({
          title: '版本对比完成',
          message: `发现${comparison.summary.totalChanges}个差异`,
          type: 'info',
          duration: 3000
        });
      }
    } else {
      addTestResult('需要至少2个版本才能进行对比');
    }
  };

  const testVersionTagging = () => {
    const versions = versionService.getVersions();
    if (versions.length > 0) {
      const version = versions[0];
      const tags = ['重要', '稳定版', '测试标签'];
      const randomTag = tags[Math.floor(Math.random() * tags.length)];
      
      versionService.tagVersion(version.id, randomTag);
      addTestResult(`为版本 ${version.version} 添加标签: ${randomTag}`);
      updateStats();
    }
  };

  const testVersionSearch = () => {
    const searchResults = versionService.searchVersions({
      dataType: 'assets',
      tags: ['重要']
    });
    addTestResult(`搜索结果: 找到${searchResults.length}个匹配的版本`);
  };

  const cleanupOldVersions = () => {
    const removedCount = versionService.cleanupOldVersions(10);
    addTestResult(`清理完成: 删除了${removedCount}个旧版本`);
    updateStats();
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getDataTypeText = (type: DataType) => {
    switch (type) {
      case 'assets': return '资产';
      case 'transactions': return '交易';
      case 'plans': return '计划';
      case 'reviews': return '评估';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg backdrop-blur-sm">
              <History className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">版本历史测试</h1>
              <p className="text-gray-300">测试版本历史浏览和回滚功能</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 版本浏览器 */}
          <div className="lg:col-span-3">
            <VersionBrowser />
          </div>

          {/* 测试控制面板 */}
          <div className="space-y-6">
            {/* 版本统计 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span>版本统计</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.totalVersions}</div>
                  <div className="text-sm text-gray-400">总版本数</div>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(stats.versionsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{getDataTypeText(type as DataType)}</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-white/10 text-xs text-gray-400">
                  <div>总大小: {(stats.totalSize / 1024).toFixed(2)} KB</div>
                  {stats.oldestVersion && (
                    <div>最早: {stats.oldestVersion.toLocaleDateString()}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 测试操作 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitBranch className="w-5 h-5 text-blue-400" />
                  <span>版本测试</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => createTestVersion('assets')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    资产版本
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createTestVersion('transactions')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    交易版本
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createTestVersion('plans')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    计划版本
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createTestVersion('reviews')}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    评估版本
                  </Button>
                </div>
                
                <Button
                  onClick={createBatchVersions}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Database className="w-4 h-4 mr-2" />
                  批量创建版本
                </Button>
                
                <Button
                  onClick={testVersionComparison}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  variant="outline"
                >
                  测试版本对比
                </Button>
                
                <Button
                  onClick={testVersionTagging}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  variant="outline"
                >
                  测试版本标签
                </Button>
                
                <Button
                  onClick={testVersionSearch}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  variant="outline"
                >
                  测试版本搜索
                </Button>
                
                <Button
                  onClick={cleanupOldVersions}
                  className="w-full bg-red-600 hover:bg-red-700"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清理旧版本
                </Button>
                
                <Button
                  onClick={updateStats}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新统计
                </Button>
              </CardContent>
            </Card>

            {/* 测试日志 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-green-400" />
                    <span>测试日志</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={clearTestResults}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white"
                  >
                    清空日志
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-400 text-sm">暂无测试记录</p>
                  ) : (
                    testResults.map((result, index) => (
                      <div
                        key={index}
                        className="text-xs text-gray-300 bg-slate-800/50 p-2 rounded border border-white/10"
                      >
                        {result}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 功能说明 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-sm">功能说明</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-300 space-y-2">
                <p>• 点击版本左侧箭头可展开详细变更信息</p>
                <p>• 使用"对比"按钮可以比较两个版本的差异</p>
                <p>• 使用"恢复"按钮可以回滚到指定版本</p>
                <p>• 支持按数据类型、时间范围等条件搜索版本</p>
                <p>• 可以为重要版本添加标签便于管理</p>
                <p>• 系统会自动限制版本数量并提供清理功能</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}