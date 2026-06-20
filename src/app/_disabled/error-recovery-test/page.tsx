'use client';

import React from 'react';
import { ErrorRecoveryDashboard } from '@/components/sync/error-recovery-dashboard';
import { ClearErrorData } from '@/components/sync/clear-error-data';
import { Shield, AlertTriangle } from 'lucide-react';

export default function ErrorRecoveryTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <ClearErrorData />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">错误处理与恢复中心</h1>
              <p className="text-gray-300">智能错误检测、自动恢复和故障排除系统</p>
            </div>
          </div>
          
          {/* 快速状态指示器 */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">错误监控运行中</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">自动恢复已启用</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">智能诊断就绪</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <ErrorRecoveryDashboard />
        </div>
      </div>
    </div>
  );
}
