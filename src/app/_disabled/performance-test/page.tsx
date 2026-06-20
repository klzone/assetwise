'use client';

import React from 'react';
import { PerformanceMonitor } from '@/components/sync/performance-monitor';
import { Activity, Zap } from 'lucide-react';

export default function PerformanceTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">性能测试中心</h1>
              <p className="text-gray-300">跨设备同步测试和性能优化监控</p>
            </div>
          </div>
          
          {/* 快速状态指示器 */}
          <div className="flex items-center space-x-4 p-4 bg-slate-800/30 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">性能监控运行中</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">实时数据收集</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span className="text-sm text-gray-300">测试套件就绪</span>
            </div>
          </div>
        </div>
        
        <PerformanceMonitor />
      </div>
    </div>
  );
}