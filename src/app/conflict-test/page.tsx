'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConflictManager } from '@/components/sync/conflict-manager';
import { conflictService } from '@/lib/services/conflict.service';
import { notificationService } from '@/lib/services/notification.service';
import { 
  AlertTriangle, 
  GitMerge, 
  Database, 
  Zap,
  BarChart3,
  Trash2,
  RefreshCw,
  TestTube,
  Shield
} from 'lucide-react';
import { DataType } from '@/lib/types/sync.types';

export default function ConflictTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [stats, setStats] = useState(conflictService.getConflictStats());

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const updateStats = () => {
    setStats(conflictService.getConflictStats());
  };

  const createUpdateUpdateConflict = () => {
    const localData = {
      id: 'asset_update_test',
      name: '办公桌',
      price: 1200,
      category: '家具',
      updatedAt: new Date().toISOString()
    };

    const remoteData = {
      id: 'asset_update_test',
      name: '办公桌椅套装',
      price: 1500,
      category: '办公用品',
      updatedAt: new Date(Date.now() - 30000).toISOString()
    };

    const conflicts = conflictService.detectConflicts(
      localData,
      remoteData,
      'assets',
      'asset_update_test',
      'furniture'
    );

    addTestResult(`创建了同时修改冲突: ${conflicts.length}个`);
    updateStats();
  };

  const createDeleteUpdateConflict = () => {
    const localData = {
      id: 'plan_delete_test',
      title: '投资计划A',
      deleted: true,
      updatedAt: new Date().toISOString()
    };

    const remoteData = {
      id: 'plan_delete_test',
      title: '投资计划A（修订版）',
      description: '新增了详细描述',
      deleted: false,
      updatedAt: new Date(Date.now() - 60000).toISOString()
    };

    const conflicts = conflictService.detectConflicts(
      localData,
      remoteData,
      'plans',
      'plan_delete_test',
      'investment'
    );

    addTestResult(`创建了删除-修改冲突: ${conflicts.length}个`);
    updateStats();
  };

  const createCriticalFieldConflict = () => {
    const localData = {
      id: 'trans_critical_test',
      amount: 10000,
      status: 'pending',
      type: 'transfer',
      updatedAt: new Date().toISOString()
    };

    const remoteData = {
      id: 'trans_critical_test',
      amount: 15000,
      status: 'completed',
      type: 'transfer',
      updatedAt: new Date(Date.now() - 45000).toISOString()
    };

    const conflicts = conflictService.detectConflicts(
      localData,
      remoteData,
      'transactions',
      'trans_critical_test',
      'payment'
    );

    addTestResult(`创建了关键字段冲突: ${conflicts.length}个`);
    updateStats();
  };

  const createTimestampConflict = () => {
    const timestamp = new Date().toISOString();
    
    const localData = {
      id: 'review_timestamp_test',
      rating: 4,
      comment: '本地评价',
      updatedAt: timestamp
    };

    const remoteData = {
      id: 'review_timestamp_test',
      rating: 5,
      comment: '远程评价',
      updatedAt: timestamp // 相同时间戳
    };

    const conflicts = conflictService.detectConflicts(
      localData,
      remoteData,
      'reviews',
      'review_timestamp_test',
      'evaluation'
    );

    addTestResult(`创建了时间戳冲突: ${conflicts.length}个`);
    updateStats();
  };

  const createBatchConflicts = () => {
    const testCases = [
      {
        local: { id: 'batch_1', name: '资产1', value: 1000, updatedAt: new Date().toISOString() },
        remote: { id: 'batch_1', name: '资产1（修改）', value: 1200, updatedAt: new Date(Date.now() - 30000).toISOString() },
        dataType: 'assets' as DataType,
        itemType: 'equipment'
      },
      {
        local: { id: 'batch_2', amount: 5000, status: 'pending', updatedAt: new Date().toISOString() },
        remote: { id: 'batch_2', amount: 5000, status: 'failed', updatedAt: new Date(Date.now() - 60000).toISOString() },
        dataType: 'transactions' as DataType,
        itemType: 'payment'
      },
      {
        local: { id: 'batch_3', title: '计划3', deleted: true, updatedAt: new Date().toISOString() },
        remote: { id: 'batch_3', title: '计划3（更新）', priority: 'high', deleted: false, updatedAt: new Date(Date.now() - 90000).toISOString() },
        dataType: 'plans' as DataType,
        itemType: 'strategy'
      }
    ];

    let totalConflicts = 0;
    testCases.forEach((testCase, index) => {
      setTimeout(() => {
        const conflicts = conflictService.detectConflicts(
          testCase.local,
          testCase.remote,
          testCase.dataType,
          testCase.local.id,
          testCase.itemType
        );
        totalConflicts += conflicts.length;
        
        if (index === testCases.length - 1) {
          addTestResult(`批量创建冲突完成: 总共${totalConflicts}个`);
          updateStats();
        }
      }, index * 500);
    });
  };

  const testAutoResolution = () => {
    const conflicts = conflictService.getConflicts({ status: 'pending' });
    let resolvedCount = 0;

    conflicts.slice(0, 3).forEach(conflict => {
      const success = conflictService.resolveConflict(
        conflict.id,
        'merge_auto',
        'test_system',
        '自动解决测试'
      );
      if (success) resolvedCount++;
    });

    addTestResult(`自动解决测试: 成功解决${resolvedCount}个冲突`);
    updateStats();
  };

  const testManualResolution = () => {
    const conflicts = conflictService.getConflicts({ status: 'pending' });
    let resolvedCount = 0;

    conflicts.slice(0, 2).forEach((conflict, index) => {
      const strategies = ['use_local', 'use_remote'];
      const success = conflictService.resolveConflict(
        conflict.id,
        strategies[index] as any,
        'test_user',
        '手动解决测试'
      );
      if (success) resolvedCount++;
    });

    addTestResult(`手动解决测试: 成功解决${resolvedCount}个冲突`);
    updateStats();
  };

  const testConflictIgnore = () => {
    const conflicts = conflictService.getConflicts({ status: 'pending' });
    let ignoredCount = 0;

    conflicts.slice(0, 2).forEach(conflict => {
      const success = conflictService.ignoreConflict(conflict.id, '测试忽略功能');
      if (success) ignoredCount++;
    });

    addTestResult(`忽略冲突测试: 忽略了${ignoredCount}个冲突`);
    updateStats();
  };

  const testConflictRules = () => {
    const rules = conflictService.getRules();
    addTestResult(`冲突规则测试: 当前有${rules.length}个规则`);
    
    // 添加一个新规则
    const newRuleId = conflictService.addRule({
      name: '测试规则',
      dataType: 'assets',
      enabled: true,
      priority: 1,
      conditions: [
        { field: 'price', operator: 'changed', weight: 1 }
      ],
      autoResolution: 'merge_auto'
    });

    addTestResult(`添加了新的冲突规则: ${newRuleId.slice(0, 8)}...`);
  };

  const clearAllConflicts = () => {
    const removedCount = conflictService.clearResolvedConflicts();
    addTestResult(`清理完成: 删除了${removedCount}个已解决的冲突`);
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
            <div className="p-2 bg-red-600/20 rounded-lg backdrop-blur-sm">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">冲突检测与解决测试</h1>
              <p className="text-gray-300">测试数据冲突检测和解决机制</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 冲突管理器 */}
          <div className="lg:col-span-3">
            <ConflictManager />
          </div>

          {/* 测试控制面板 */}
          <div className="space-y-6">
            {/* 冲突统计 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-red-400" />
                  <span>冲突统计</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.total}</div>
                  <div className="text-sm text-gray-400">总冲突数</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-400">{stats.pending}</div>
                    <div className="text-gray-400">待处理</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{stats.resolved}</div>
                    <div className="text-gray-400">已解决</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-400">{stats.ignored}</div>
                    <div className="text-gray-400">已忽略</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">{stats.criticalCount}</div>
                    <div className="text-gray-400">关键</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {Object.entries(stats.byDataType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">{getDataTypeText(type as DataType)}</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {stats.avgResolutionTime > 0 && (
                  <div className="pt-2 border-t border-white/10 text-xs text-gray-400">
                    平均解决时间: {Math.round(stats.avgResolutionTime / 1000)}秒
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 冲突测试 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5 text-blue-400" />
                  <span>冲突测试</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    size="sm"
                    onClick={createUpdateUpdateConflict}
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    <GitMerge className="w-3 h-3 mr-1" />
                    同时修改冲突
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={createDeleteUpdateConflict}
                    className="bg-red-600 hover:bg-red-700 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    删除-修改冲突
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={createCriticalFieldConflict}
                    className="bg-amber-600 hover:bg-amber-700 text-xs"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    关键字段冲突
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={createTimestampConflict}
                    className="bg-purple-600 hover:bg-purple-700 text-xs"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    时间戳冲突
                  </Button>
                </div>
                
                <Button
                  onClick={createBatchConflicts}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Database className="w-4 h-4 mr-2" />
                  批量创建冲突
                </Button>
              </CardContent>
            </Card>

            {/* 解决测试 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  <span>解决测试</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={testAutoResolution}
                  className="w-full bg-green-600 hover:bg-green-700"
                  variant="outline"
                >
                  测试自动解决
                </Button>
                
                <Button
                  onClick={testManualResolution}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  variant="outline"
                >
                  测试手动解决
                </Button>
                
                <Button
                  onClick={testConflictIgnore}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                  variant="outline"
                >
                  测试忽略冲突
                </Button>
                
                <Button
                  onClick={testConflictRules}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  variant="outline"
                >
                  测试冲突规则
                </Button>
                
                <Button
                  onClick={clearAllConflicts}
                  className="w-full bg-red-600 hover:bg-red-700"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清理已解决冲突
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
                <p>• 系统会自动检测数据同步时的冲突</p>
                <p>• 支持多种冲突类型：同时修改、删除-修改等</p>
                <p>• 提供自动合并、手动选择等解决策略</p>
                <p>• 可以配置冲突检测规则和自动解决策略</p>
                <p>• 支持冲突优先级管理和批量处理</p>
                <p>• 提供详细的冲突历史和统计信息</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}