'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncValidationDashboard } from '@/components/sync/sync-validation-dashboard';
import { RealTimeSyncMonitor } from '@/components/sync/real-time-sync-monitor';
import { SyncTestSuite } from '@/components/sync/sync-test-suite';
import { SyncDashboard } from '@/components/sync/sync-dashboard';
import { SyncPerformanceMonitor } from '@/components/sync/sync-performance-monitor';
import { SyncTestRunner } from '@/components/sync/sync-test-runner';
import { 
  TestTube, 
  Activity, 
  BarChart3, 
  Shield,
  Database,
  Zap
} from 'lucide-react';

export default function SyncTestPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面头部 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">AssetWise 数据同步测试中心</h1>
          <p className="text-gray-400">全面验证和完善数据同步功能的一致性和可靠性</p>
        </div>

        {/* 快速状态概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">同步状态</p>
                  <p className="text-lg font-bold text-green-400">正常运行</p>
                </div>
                <Activity className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">网络连接</p>
                  <p className="text-lg font-bold text-blue-400">在线</p>
                </div>
                <Database className="w-6 h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">测试状态</p>
                  <p className="text-lg font-bold text-amber-400">就绪</p>
                </div>
                <TestTube className="w-6 h-6 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">性能</p>
                  <p className="text-lg font-bold text-purple-400">优秀</p>
                </div>
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要功能标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-white/10 grid grid-cols-5 w-full">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-slate-700 flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>同步概览</span>
            </TabsTrigger>
            <TabsTrigger 
              value="validation" 
              className="data-[state=active]:bg-slate-700 flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>功能验证</span>
            </TabsTrigger>
            <TabsTrigger 
              value="monitor" 
              className="data-[state=active]:bg-slate-700 flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>实时监控</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-slate-700 flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>性能监控</span>
            </TabsTrigger>
            <TabsTrigger 
              value="testing" 
              className="data-[state=active]:bg-slate-700 flex items-center space-x-2"
            >
              <TestTube className="w-4 h-4" />
              <span>测试套件</span>
            </TabsTrigger>
          </TabsList>

          {/* 同步概览 */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  数据同步统计概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SyncDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 功能验证 */}
          <TabsContent value="validation" className="space-y-6">
            <SyncValidationDashboard />
          </TabsContent>

          {/* 实时监控 */}
          <TabsContent value="monitor" className="space-y-6">
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  实时同步监控
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeSyncMonitor />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 性能监控 */}
          <TabsContent value="performance" className="space-y-6">
            <SyncPerformanceMonitor />
          </TabsContent>

          {/* 测试套件 */}
          <TabsContent value="testing" className="space-y-6">
            <SyncTestRunner />
          </TabsContent>
        </Tabs>

        {/* 底部信息 */}
        <Card className="bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <span>AssetWise 数据同步测试中心</span>
                <span>版本 1.0.0</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>最后更新: {new Date().toLocaleString()}</span>
                <span>状态: 运行中</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}