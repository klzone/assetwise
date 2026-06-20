'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SyncSettings } from '@/components/sync/sync-settings';
import { SyncHistory } from '@/components/sync/sync-history';
import { SyncDashboard } from '@/components/sync/sync-dashboard';
import { 
  Settings, 
  History, 
  BarChart3,
  Database,
  Zap,
  Wifi,
  CheckCircle
} from 'lucide-react';

export default function SyncSettingsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg backdrop-blur-sm">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">数据同步中心</h1>
              <p className="text-gray-300">管理您的数据同步配置、监控同步状态和查看历史记录</p>
            </div>
          </div>
          
          {/* 快速状态指示器 */}
          <div className="flex items-center space-x-4 p-4 bg-slate-900/50 backdrop-blur-md rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">同步服务运行中</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">网络连接正常</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">上次同步: 1小时前</span>
            </div>
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
              <Zap className="w-3 h-3 mr-1" />
              专业版
            </Badge>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 backdrop-blur-md border border-white/10">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-slate-700/50 text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span>仪表板</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center space-x-2 data-[state=active]:bg-slate-700/50 text-white"
            >
              <Settings className="w-4 h-4" />
              <span>设置</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center space-x-2 data-[state=active]:bg-slate-700/50 text-white"
            >
              <History className="w-4 h-4" />
              <span>历史记录</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <SyncDashboard />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SyncSettings />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <SyncHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}