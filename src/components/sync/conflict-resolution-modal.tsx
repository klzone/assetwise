'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Cloud, 
  Merge, 
  X,
  CheckCircle,
  ArrowRight,
  Database,
  Smartphone,
  Monitor
} from 'lucide-react';

interface ConflictData {
  id: string;
  dataType: 'assets' | 'transactions' | 'plans' | 'reviews';
  dataId: string;
  itemName: string;
  conflictType: 'update' | 'delete' | 'create';
  localVersion: any;
  remoteVersion: any;
  localTimestamp: string;
  remoteTimestamp: string;
  localDevice: string;
  remoteDevice: string;
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictData[];
  onResolve: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => void;
}

export function ConflictResolutionModal({ 
  isOpen, 
  onClose, 
  conflicts, 
  onResolve 
}: ConflictResolutionModalProps) {
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(
    conflicts.length > 0 ? conflicts[0] : null
  );
  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'remote' | 'merge'>>({});

  const handleResolveConflict = (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    setResolutions(prev => ({ ...prev, [conflictId]: resolution }));
  };

  const handleResolveAll = () => {
    Object.entries(resolutions).forEach(([conflictId, resolution]) => {
      onResolve(conflictId, resolution);
    });
    onClose();
  };

  const getConflictTypeText = (type: ConflictData['conflictType']) => {
    switch (type) {
      case 'update': return '更新冲突';
      case 'delete': return '删除冲突';
      case 'create': return '创建冲突';
    }
  };

  const getDataTypeText = (type: ConflictData['dataType']) => {
    switch (type) {
      case 'assets': return '资产';
      case 'transactions': return '交易';
      case 'plans': return '计划';
      case 'reviews': return '评估';
    }
  };

  const renderDataComparison = (conflict: ConflictData) => {
    const localData = conflict.localVersion;
    const remoteData = conflict.remoteVersion;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 本地版本 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <h4 className="font-medium text-white">本地版本</h4>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {conflict.localDevice}
            </Badge>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Clock className="w-3 h-3" />
              <span>{new Date(conflict.localTimestamp).toLocaleString()}</span>
            </div>
            <div className="space-y-1">
              {Object.entries(localData).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">{key}:</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 云端版本 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-green-400" />
            <h4 className="font-medium text-white">云端版本</h4>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              {conflict.remoteDevice}
            </Badge>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Clock className="w-3 h-3" />
              <span>{new Date(conflict.remoteTimestamp).toLocaleString()}</span>
            </div>
            <div className="space-y-1">
              {Object.entries(remoteData).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">{key}:</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResolutionOptions = (conflict: ConflictData) => {
    const currentResolution = resolutions[conflict.id];

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-white">选择解决方案:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 使用本地版本 */}
          <Button
            variant={currentResolution === 'local' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center space-y-2 ${
              currentResolution === 'local' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
            onClick={() => handleResolveConflict(conflict.id, 'local')}
          >
            <Smartphone className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">使用本地版本</div>
              <div className="text-xs opacity-70">保留本设备的更改</div>
            </div>
          </Button>

          {/* 使用云端版本 */}
          <Button
            variant={currentResolution === 'remote' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center space-y-2 ${
              currentResolution === 'remote' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
            onClick={() => handleResolveConflict(conflict.id, 'remote')}
          >
            <Cloud className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">使用云端版本</div>
              <div className="text-xs opacity-70">采用云端的更改</div>
            </div>
          </Button>

          {/* 智能合并 */}
          <Button
            variant={currentResolution === 'merge' ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-center space-y-2 ${
              currentResolution === 'merge' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
            onClick={() => handleResolveConflict(conflict.id, 'merge')}
          >
            <Merge className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">智能合并</div>
              <div className="text-xs opacity-70">尝试自动合并</div>
            </div>
          </Button>
        </div>
      </div>
    );
  };

  if (!selectedConflict) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900/95 backdrop-blur-md border-white/20 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <span>数据冲突解决</span>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                {conflicts.length} 个冲突
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
          {/* 冲突列表 */}
          <div className="w-full md:w-1/3 space-y-4">
            <h3 className="font-medium text-white">冲突列表</h3>
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConflict?.id === conflict.id
                        ? 'bg-white/20 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedConflict(conflict)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                        {getConflictTypeText(conflict.conflictType)}
                      </Badge>
                      {resolutions[conflict.id] && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{conflict.itemName}</p>
                      <p className="text-xs text-gray-400">
                        {getDataTypeText(conflict.dataType)} • {conflict.dataId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 冲突详情 */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-xl font-medium text-white">{selectedConflict.itemName}</h3>
                <p className="text-gray-300">
                  {getDataTypeText(selectedConflict.dataType)} • {getConflictTypeText(selectedConflict.conflictType)}
                </p>
              </div>
            </div>

            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                检测到数据冲突。请选择要保留的版本或尝试智能合并。
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="comparison" className="space-y-4">
              <TabsList className="bg-white/10 backdrop-blur-md border-white/20">
                <TabsTrigger value="comparison" className="data-[state=active]:bg-white/20 text-white">
                  版本对比
                </TabsTrigger>
                <TabsTrigger value="resolution" className="data-[state=active]:bg-white/20 text-white">
                  解决方案
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="space-y-4">
                {renderDataComparison(selectedConflict)}
              </TabsContent>

              <TabsContent value="resolution" className="space-y-4">
                {renderResolutionOptions(selectedConflict)}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-sm text-gray-300">
            已解决: {Object.keys(resolutions).length} / {conflicts.length}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              稍后处理
            </Button>
            <Button
              onClick={handleResolveAll}
              disabled={Object.keys(resolutions).length !== conflicts.length}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              应用所有解决方案
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}