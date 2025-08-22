'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  History, 
  RotateCcw, 
  Search, 
  Filter, 
  Tag,
  Calendar,
  User,
  Monitor,
  GitBranch,
  FileText,
  Download,
  Trash2,
  Eye,
  GitCompare,
  Clock,
  Database,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { versionService, DataVersion, VersionComparison } from '@/lib/services/version.service';
import { DataType } from '@/lib/types/sync.types';
import { notificationService } from '@/lib/services/notification.service';

interface VersionBrowserProps {
  className?: string;
}

export function VersionBrowser({ className }: VersionBrowserProps) {
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [filteredVersions, setFilteredVersions] = useState<DataVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DataVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<DataVersion | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDataType, setFilterDataType] = useState<DataType | 'all'>('all');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  useEffect(() => {
    filterVersions();
  }, [versions, searchQuery, filterDataType]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      // 加载真实版本数据
      const allVersions = versionService.getVersions();
      
      // 如果没有版本数据，创建一些模拟数据
      if (allVersions.length === 0) {
        createMockVersions();
        const mockVersions = versionService.getVersions();
        setVersions(mockVersions);
      } else {
        setVersions(allVersions);
      }
    } catch (error) {
      console.error('加载版本历史失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMockVersions = () => {
    const dataTypes: DataType[] = ['assets', 'transactions', 'plans', 'reviews'];
    const devices = ['当前设备', '办公室电脑', '手机端'];
    
    dataTypes.forEach(dataType => {
      for (let i = 0; i < 5; i++) {
        const changes = [
          {
            type: 'create' as const,
            itemId: `item_${i}`,
            itemType: dataType,
            newValue: `新增${dataType}数据`,
            timestamp: new Date(Date.now() - i * 86400000)
          },
          {
            type: 'update' as const,
            itemId: `item_${i + 1}`,
            itemType: dataType,
            field: 'name',
            oldValue: '旧值',
            newValue: '新值',
            timestamp: new Date(Date.now() - i * 86400000)
          }
        ];

        versionService.createVersion(
          dataType,
          changes,
          {
            device: devices[i % devices.length],
            userId: 'user_123',
            syncId: `sync_${i}`,
            source: 'local'
          },
          `${dataType}数据更新 - 第${i + 1}次同步`
        );
      }
    });
  };

  const filterVersions = () => {
    let filtered = versions;

    if (filterDataType !== 'all') {
      filtered = filtered.filter(v => v.dataType === filterDataType);
    }

    if (searchQuery) {
      filtered = filtered.filter(v => 
        v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.metadata.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredVersions(filtered);
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

  const getChangeTypeText = (type: string) => {
    switch (type) {
      case 'create': return '新增';
      case 'update': return '修改';
      case 'delete': return '删除';
      default: return type;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'create': return 'text-green-400';
      case 'update': return 'text-blue-400';
      case 'delete': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const toggleVersionExpansion = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleCompareVersions = (version1: DataVersion, version2: DataVersion) => {
    const comp = versionService.compareVersions(version1.id, version2.id);
    setComparison(comp);
    setSelectedVersion(version1);
    setCompareVersion(version2);
  };

  const handleRestoreVersion = async (version: DataVersion) => {
    try {
      await versionService.restoreVersion(version.id, {
        targetVersion: version.id,
        createBackup: true,
        mergeStrategy: 'replace'
      });

      notificationService.notify({
        title: '版本恢复成功',
        message: `已成功恢复到版本 ${version.version}`,
        type: 'success',
        duration: 5000
      });

      setShowRestoreDialog(false);
      loadVersions(); // 重新加载版本列表
    } catch (error) {
      notificationService.notify({
        title: '版本恢复失败',
        message: error instanceof Error ? error.message : '未知错误',
        type: 'error',
        persistent: true
      });
    }
  };

  const handleAddTag = (version: DataVersion, tag: string) => {
    if (tag.trim()) {
      versionService.tagVersion(version.id, tag.trim());
      loadVersions();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <p className="text-gray-400">加载版本历史中...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>版本历史浏览器</span>
          </CardTitle>
          
          {/* 搜索和筛选 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索版本描述、设备或标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-white/20 text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterDataType}
                onChange={(e) => setFilterDataType(e.target.value as DataType | 'all')}
                className="px-3 py-2 bg-slate-800/50 border border-white/20 rounded-md text-white text-sm"
              >
                <option value="all">所有类型</option>
                <option value="assets">资产</option>
                <option value="transactions">交易</option>
                <option value="plans">计划</option>
                <option value="reviews">评估</option>
              </select>
              
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
                onClick={loadVersions}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <History className="w-12 h-12 mb-2 opacity-50" />
              <p>没有找到版本记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVersions.map((version) => (
                <div
                  key={version.id}
                  className="border border-white/10 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-0 h-auto text-gray-400 hover:text-white"
                          onClick={() => toggleVersionExpansion(version.id)}
                        >
                          {expandedVersions.has(version.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              v{version.version}
                            </Badge>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              {getDataTypeText(version.dataType)}
                            </Badge>
                            {version.tags.map(tag => (
                              <Badge key={tag} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {version.description || '无描述'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white"
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowRestoreDialog(true);
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          恢复
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white"
                          onClick={() => {
                            if (compareVersion) {
                              handleCompareVersions(version, compareVersion);
                            } else {
                              setCompareVersion(version);
                              notificationService.notify({
                                title: '选择对比版本',
                                message: '请选择另一个版本进行对比',
                                type: 'info',
                                duration: 3000
                              });
                            }
                          }}
                        >
                          <GitCompare className="w-3 h-3 mr-1" />
                          {compareVersion?.id === version.id ? '取消对比' : '对比'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{version.timestamp.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Monitor className="w-3 h-3" />
                          <span>{version.metadata.device}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Database className="w-3 h-3" />
                          <span>{formatFileSize(version.size)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>{version.changes.length} 个变更</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 展开的详细信息 */}
                  {expandedVersions.has(version.id) && (
                    <div className="border-t border-white/10 p-4 bg-slate-900/30">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">变更详情</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {version.changes.map((change, index) => (
                              <div key={index} className="text-xs bg-slate-800/50 p-2 rounded border border-white/10">
                                <div className="flex items-center space-x-2">
                                  <Badge className={`${getChangeTypeColor(change.type)} bg-transparent border-current`}>
                                    {getChangeTypeText(change.type)}
                                  </Badge>
                                  <span className="text-gray-300">{change.itemType}</span>
                                  <span className="text-gray-400">#{change.itemId}</span>
                                </div>
                                {change.field && (
                                  <div className="mt-1 text-gray-400">
                                    字段: {change.field}
                                    {change.oldValue && (
                                      <span className="ml-2">
                                        <span className="text-red-400">{change.oldValue}</span>
                                        <span className="mx-1">→</span>
                                        <span className="text-green-400">{change.newValue}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            <span>校验和: {version.checksum}</span>
                            {version.parentVersion && (
                              <span className="ml-4">父版本: {version.parentVersion.slice(0, 8)}...</span>
                            )}
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white/10 border-white/20 text-white text-xs"
                              onClick={() => {
                                const tag = prompt('输入标签名称:');
                                if (tag) handleAddTag(version, tag);
                              }}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              添加标签
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 版本对比结果 */}
      {comparison && selectedVersion && compareVersion && (
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitCompare className="w-5 h-5 text-blue-400" />
              <span>版本对比结果</span>
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>版本 {selectedVersion.version} vs 版本 {compareVersion.version}</span>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white"
                onClick={() => {
                  setComparison(null);
                  setCompareVersion(null);
                }}
              >
                关闭对比
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{comparison.summary.addedCount}</div>
                <div className="text-sm text-gray-400">新增</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{comparison.summary.modifiedCount}</div>
                <div className="text-sm text-gray-400">修改</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{comparison.summary.deletedCount}</div>
                <div className="text-sm text-gray-400">删除</div>
              </div>
            </div>
            
            <Tabs defaultValue="added" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                <TabsTrigger value="added" className="data-[state=active]:bg-slate-700/50 text-white">
                  新增 ({comparison.summary.addedCount})
                </TabsTrigger>
                <TabsTrigger value="modified" className="data-[state=active]:bg-slate-700/50 text-white">
                  修改 ({comparison.summary.modifiedCount})
                </TabsTrigger>
                <TabsTrigger value="deleted" className="data-[state=active]:bg-slate-700/50 text-white">
                  删除 ({comparison.summary.deletedCount})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="added" className="mt-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comparison.added.map((change, index) => (
                    <div key={index} className="text-xs bg-green-500/10 p-2 rounded border border-green-500/20">
                      <div className="text-green-400">+ {change.itemType} #{change.itemId}</div>
                      {change.field && (
                        <div className="text-gray-300 mt-1">{change.field}: {change.newValue}</div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="modified" className="mt-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comparison.modified.map((change, index) => (
                    <div key={index} className="text-xs bg-blue-500/10 p-2 rounded border border-blue-500/20">
                      <div className="text-blue-400">~ {change.itemType} #{change.itemId}</div>
                      {change.field && (
                        <div className="text-gray-300 mt-1">
                          {change.field}: 
                          <span className="text-red-400 ml-1">{change.oldValue}</span>
                          <span className="mx-1">→</span>
                          <span className="text-green-400">{change.newValue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="deleted" className="mt-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comparison.deleted.map((change, index) => (
                    <div key={index} className="text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
                      <div className="text-red-400">- {change.itemType} #{change.itemId}</div>
                      {change.field && (
                        <div className="text-gray-300 mt-1">{change.field}: {change.oldValue}</div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 恢复确认对话框 */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-md border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>确认版本恢复</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-medium">警告</span>
                </div>
                <p className="text-sm text-gray-300">
                  恢复版本将会覆盖当前数据。系统会自动创建当前数据的备份。
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-400">目标版本: </span>
                  <span className="text-white">v{selectedVersion.version}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">数据类型: </span>
                  <span className="text-white">{getDataTypeText(selectedVersion.dataType)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">创建时间: </span>
                  <span className="text-white">{selectedVersion.timestamp.toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">描述: </span>
                  <span className="text-white">{selectedVersion.description || '无描述'}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white"
                  onClick={() => setShowRestoreDialog(false)}
                >
                  取消
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleRestoreVersion(selectedVersion)}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  确认恢复
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}