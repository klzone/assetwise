'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SyncMonitor } from '@/components/sync/sync-monitor';
import { notificationService } from '@/lib/services/notification.service';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Database
} from 'lucide-react';

export default function SyncMonitorTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testNotifications = () => {
    // 测试成功通知
    notificationService.notifySyncSuccess(15, 3.2);
    addTestResult('发送同步成功通知');

    // 测试错误通知
    setTimeout(() => {
      notificationService.notifySyncError('网络连接超时，请检查网络设置');
      addTestResult('发送同步错误通知');
    }, 1000);

    // 测试冲突通知
    setTimeout(() => {
      notificationService.notifySyncConflict(3);
      addTestResult('发送数据冲突通知');
    }, 2000);

    // 测试存储空间不足通知
    setTimeout(() => {
      notificationService.notifyStorageQuotaExceeded();
      addTestResult('发送存储空间不足通知');
    }, 3000);

    // 测试自定义通知
    setTimeout(() => {
      notificationService.notify({
        title: '测试通知',
        message: '这是一个测试通知，用于验证通知系统功能',
        type: 'info',
        duration: 5000,
        actions: [
          {
            label: '确认',
            action: () => {
              addTestResult('用户点击了确认按钮');
            },
            style: 'primary'
          },
          {
            label: '取消',
            action: () => {
              addTestResult('用户点击了取消按钮');
            },
            style: 'secondary'
          }
        ]
      });
      addTestResult('发送自定义通知');
    }, 4000);
  };

  const testPersistentNotification = () => {
    notificationService.notify({
      title: '持久化通知测试',
      message: '这是一个持久化通知，不会自动消失',
      type: 'warning',
      persistent: true,
      actions: [
        {
          label: '处理',
          action: () => {
            addTestResult('用户处理了持久化通知');
          },
          style: 'primary'
        }
      ]
    });
    addTestResult('发送持久化通知');
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const clearAllNotifications = () => {
    notificationService.clear();
    addTestResult('清空所有通知');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg backdrop-blur-sm">
              <Database className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">同步监控测试</h1>
              <p className="text-gray-300">测试同步状态监控和通知系统功能</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 同步监控组件 */}
          <div className="lg:col-span-2">
            <SyncMonitor />
          </div>

          {/* 测试控制面板 */}
          <div className="space-y-6">
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <span>通知测试</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={testNotifications}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  测试所有通知类型
                </Button>
                
                <Button
                  onClick={testPersistentNotification}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  variant="outline"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  测试持久化通知
                </Button>
                
                <Button
                  onClick={clearAllNotifications}
                  className="w-full bg-red-600 hover:bg-red-700"
                  variant="outline"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  清空所有通知
                </Button>
              </CardContent>
            </Card>

            {/* 测试结果 */}
            <Card className="bg-slate-900/80 backdrop-blur-md border-white/10 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="w-5 h-5 text-green-400" />
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
                <p>• 点击同步监控组件右上角的铃铛图标可打开通知中心</p>
                <p>• 通知中心支持筛选已读/未读通知</p>
                <p>• 支持标记已读、清空通知等操作</p>
                <p>• 持久化通知不会自动消失，需要手动处理</p>
                <p>• 通知支持自定义操作按钮</p>
                <p>• 系统会自动监控网络状态变化</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}