'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitMerge,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Filter,
  Search,
  Eye,
  Settings,
  BarChart3,
  Zap,
  Shield,
  Database,
  Users,
  Calendar
} from 'lucide-react';
import { 
  conflictService, 
  DataConflict, 
  ConflictStats, 
  ResolutionStrategy,
  ConflictType,
  ConflictStatus 
} from '@/lib/services/conflict.service';
import { DataType } from '@/lib/types/sync.types';
import { notificationService } from '@/lib/services/notification.service';

interface ConflictManagerProps {
  className?: string;
}

export function ConflictManager({ className }: ConflictManagerProps) {
  const [conflicts, setConflicts] = useState<DataConflict[]>([]);
  const [stats, setStats] = useState<ConflictStats | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<DataConflict | null>(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConflictStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'low' | 'medium' | 'high' | 'critical' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 订阅冲突变化
    const unsubscribe = conflictService.subscribe((updatedConflicts) => {
      setConflicts(updatedConflicts);
      setStats(conflictService.getConflictStats());
      setIsLoading(false);
    });

    // 创建一些测试冲突数据
    createTestConflicts();

    return unsubscribe;
  }, []);

  const createTestConflicts = () => {
    // 创建不同类型的测试冲突
    const testCases = [
      {
        localData: { id: 'asset_1', name: '办公桌', price: 1200, updatedAt: new Date().toISOString() },
        remoteData: { id: 'asset_1', name: '办公桌椅', price: 1500, updatedAt: new Date(Date.now() - 60000).toISOString() },
        dataType: 'assets' as DataType,
        itemType: 'furniture'
      },
      {
        localData: { id: 'trans_1', amount: 5000, status: 'pending', updatedAt: new Date().toISOString() },
        remoteData: { id: 'trans_1', amount: 5000, status: 'completed', updatedAt: new Date(Date.now() - 30000).toISOString() },
        dataType: 'transactions' as DataType,
        itemType: 'payment'
      },
      {
        localData: { id: 'plan_1', title: '投资计划A', deleted: true, updatedAt: new Date().toISOString() },
        remoteData: { id: 'plan_1', title: '投资计划A（修订版）', deleted: false, updatedAt: new Date(Date.now() - 120000).toISOString() },
        dataType: 'plans' as DataType,
        itemType: 'investment'
      }
    ];

    testCases.forEach(testCase => {
      conflictService.detectConflicts(
        testCase.localData,
        testCase.remoteData,
        testCase.dataType,
        testCase.localData.id,
        testCase.itemType
      );
    });
  };

  const getConflictTypeText = (type: ConflictType) => {
    switch (type) {
      case 'update_update': return '同时修改';
      case 'update_delete': return '修改-删除';
      case 'delete_update': return '删除-修改';
      case 'create_create': return '重复创建';
      case 'schema_mismatch': return '结构不匹配';
      case 'timestamp_conflict': return '时间戳冲突';
      default: return type;
    }
  };

  const getConflictTypeColor = (type: ConflictType) => {
    switch (type) {
      case 'update_update': return 'text-blue-400';
      case 'update_delete': return 'text-red-400';
      case 'delete_update': return 'text-red-400';
      case 'create_create': return 'text-amber-400';
      case 'schema_mismatch': return 'text-purple-400';
      case 'timestamp_conflict': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: ConflictStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'ignored': return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
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

  const handleResolveConflict = (conflict: DataConflict, strategy: ResolutionStrategy, reason?: string) => {
    const success = conflictService.resolveConflict(conflict.id, strategy, 'user', reason);
    
    if (success) {
      notificationService.notify({
        title: '冲突已解决',
        message: `使用策略: ${getStrategyText(strategy)}`,
        type: 'success',
        duration: 3000
      });
      setShowResolutionDialog(false);
      setSelectedConflict(null);
    } else {
      notificationService.notify({
        title: '解决冲突失败',
        message: '请稍后重试',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleIgnoreConflict = (conflict: DataConflict, reason?: string) => {
    const success = conflictService.ignoreConflict(conflict.id, reason);
    
    if (success) {
      notificationService.notify({
        title: '冲突已忽略',
        message: '该冲突将不再显示',
        type: 'info',
        duration: 3000
      });
    }
  };

  const getStrategyText = (strategy: ResolutionStrategy) => {
    switch (strategy) {
      case 'use_local': return '使用本地版本';
      case 'use_remote': return '使用远程版本';
      case 'merge_auto': return '自动合并';
      case 'merge_manual': return '手动合并';
      case 'create_both': return '保留两个版本';
      case 'ignore': return '忽略冲突';
      default: return strategy;
    }
  };

  const filteredConflicts = conflicts.filter(conflict => {
    if (statusFilter !== 'all' && conflict.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && conflict.metadata.priority !== priorityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conflict.itemId.toLowerCase().includes(query) ||
        conflict.itemType.toLowerCase().includes(query) ||
        getConflictTypeText(conflict.conflictType).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-400">加载冲突数据中...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
              <div className="text-sm text-gray-400">总冲突数</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
              <div className="text-sm text-gray-400">待处理</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.criticalCount}</div>
              <div className="text-sm text-gray-400">关键冲突</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
              <div className="text-sm text-gray-400">已解决</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容 */}
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>冲突管理器</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => conflictService.clearResolvedConflicts()}
                className="bg-gray-600 hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                清理已解决
              </Button>
              <Button
                size="sm"
                onClick={createTestConflicts}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="w-4 h-4 mr-1" />
                创建测试冲突
              </Button>
            </div>
          </div>
          
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索冲突..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-white/20 text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ConflictStatus | 'all')}
                className="px-3 py-2 bg-slate-800/50 border border-white/20 rounded-md text-white text-sm"
              >
                <option value="all">所有状态</option>
                <option value="pending">待处理</option>
                <option value="resolved">已解决</option>
                <option value="ignored">已忽略</option>
                <option value="failed">失败</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-800/50 border border-white/20 rounded-md text-white text-sm"
              >
                <option value="all">所有优先级</option>
                <option value="critical">关键</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredConflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mb-2 opacity-50" />
              <p>没有找到冲突记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="border border-white/10 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(conflict.status)}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getPriorityColor(conflict.metadata.priority)}>
                            {conflict.metadata.priority.toUpperCase()}
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {getDataTypeText(conflict.dataType)}
                          </Badge>
                          <Badge className={`${getConflictTypeColor(conflict.conflictType)} bg-transparent border-current`}>
                            {getConflictTypeText(conflict.conflictType)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-300">
                          {conflict.itemType} #{conflict.itemId}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white"
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setShowResolutionDialog(true);
                        }}
                        disabled={conflict.status === 'resolved'}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        查看详情
                      </Button>
                      
                      {conflict.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleResolveConflict(conflict, 'merge_auto')}
                          >
                            <GitMerge className="w-3 h-3 mr-1" />
                            自动合并
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-600/20 border-gray-500/30 text-gray-300"
                            onClick={() => handleIgnoreConflict(conflict, '用户手动忽略')}
                          >
                            忽略
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowLeft className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">本地版本</span>
                      </div>
                      <div className="text-gray-300 space-y-1">
                        <div>时间: {conflict.localVersion.timestamp.toLocaleString()}</div>
                        <div>校验和: {conflict.localVersion.checksum.slice(0, 8)}...</div>
                        <div className="text-xs bg-slate-800/50 p-2 rounded mt-2">
                          {JSON.stringify(conflict.localVersion.data, null, 2).slice(0, 100)}...
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowRight className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">远程版本</span>
                      </div>
                      <div className="text-gray-300 space-y-1">
                        <div>时间: {conflict.remoteVersion.timestamp.toLocaleString()}</div>
                        <div>校验和: {conflict.remoteVersion.checksum.slice(0, 8)}...</div>
                        <div className="text-xs bg-slate-800/50 p-2 rounded mt-2">
                          {JSON.stringify(conflict.remoteVersion.data, null, 2).slice(0, 100)}...
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimestamp(conflict.timestamp)}</span>
                      </div>
                      {conflict.resolution && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span>已解决: {getStrategyText(conflict.resolution.strategy)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      同步ID: {conflict.metadata.syncId.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 冲突解决对话框 */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border-white/10 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GitMerge className="w-5 h-5 text-blue-400" />
              <span>冲突解决</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedConflict && (
            <div className="space-y-6">
              {/* 冲突信息 */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className={getPriorityColor(selectedConflict.metadata.priority)}>
                    {selectedConflict.metadata.priority.toUpperCase()}
                  </Badge>
                  <Badge className={`${getConflictTypeColor(selectedConflict.conflictType)} bg-transparent border-current`}>
                    {getConflictTypeText(selectedConflict.conflictType)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-300">
                  <div>项目: {selectedConflict.itemType} #{selectedConflict.itemId}</div>
                  <div>数据类型: {getDataTypeText(selectedConflict.dataType)}</div>
                  <div>发生时间: {selectedConflict.timestamp.toLocaleString()}</div>
                </div>
              </div>

              {/* 版本对比 */}
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                  <TabsTrigger value="comparison" className="data-[state=active]:bg-slate-700/50 text-white">
                    版本对比
                  </TabsTrigger>
                  <TabsTrigger value="resolution" className="data-[state=active]:bg-slate-700/50 text-white">
                    解决方案
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="comparison" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <ArrowLeft className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">本地版本</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>时间: {selectedConflict.localVersion.timestamp.toLocaleString()}</div>
                        <div>来源: {selectedConflict.localVersion.source}</div>
                        <div>校验和: {selectedConflict.localVersion.checksum}</div>
                        <div className="bg-slate-800/50 p-3 rounded mt-3">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(selectedConflict.localVersion.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <ArrowRight className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">远程版本</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>时间: {selectedConflict.remoteVersion.timestamp.toLocaleString()}</div>
                        <div>来源: {selectedConflict.remoteVersion.source}</div>
                        <div>校验和: {selectedConflict.remoteVersion.checksum}</div>
                        <div className="bg-slate-800/50 p-3 rounded mt-3">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                            {JSON.stringify(selectedConflict.remoteVersion.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="resolution" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 h-auto p-4 flex flex-col items-start"
                      onClick={() => handleResolveConflict(selectedConflict, 'use_local', '用户选择使用本地版本')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">使用本地版本</span>
                      </div>
                      <span className="text-xs text-blue-200">保留本地修改，丢弃远程更改</span>
                    </Button>
                    
                    <Button
                      className="bg-green-600 hover:bg-green-700 h-auto p-4 flex flex-col items-start"
                      onClick={() => handleResolveConflict(selectedConflict, 'use_remote', '用户选择使用远程版本')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowRight className="w-4 h-4" />
                        <span className="font-medium">使用远程版本</span>
                      </div>
                      <span className="text-xs text-green-200">保留远程修改，丢弃本地更改</span>
                    </Button>
                    
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 h-auto p-4 flex flex-col items-start"
                      onClick={() => handleResolveConflict(selectedConflict, 'merge_auto', '用户选择自动合并')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <GitMerge className="w-4 h-4" />
                        <span className="font-medium">自动合并</span>
                      </div>
                      <span className="text-xs text-purple-200">系统智能合并两个版本</span>
                    </Button>
                    
                    <Button
                      className="bg-amber-600 hover:bg-amber-700 h-auto p-4 flex flex-col items-start"
                      onClick={() => handleResolveConflict(selectedConflict, 'create_both', '用户选择保留两个版本')}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="w-4 h-4" />
                        <span className="font-medium">保留两个版本</span>
                      </div>
                      <span className="text-xs text-amber-200">创建两个独立的记录</span>
                    </Button>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-white/10">
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white"
                      onClick={() => setShowResolutionDialog(false)}
                    >
                      取消
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-gray-600/20 border-gray-500/30 text-gray-300"
                      onClick={() => {
                        handleIgnoreConflict(selectedConflict, '用户选择忽略此冲突');
                        setShowResolutionDialog(false);
                      }}
                    >
                      忽略冲突
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}